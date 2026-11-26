const express = require('express');
const router = express.Router();

const userAuth = require('../utils/userAuth');
const messageModel = require('../modal/message');
const connectionModel = require('../modal/connection');
const blockModel = require('../modal/block');
const { uploadFromBuffer } = require('../utils/cloudinaryService');
const { isValidObjectId, parsePagination } = require('../utils/securityMiddleware');
const {
    CHAT_MEDIA_MIME_TO_EXT,
    createSafeUploader,
    validateUploadedFile,
} = require('../utils/uploadValidation');

const upload = createSafeUploader(CHAT_MEDIA_MIME_TO_EXT, 10 * 1024 * 1024);

async function verifyMatchedAndUnblocked(userA, userB) {
    if (!isValidObjectId(userB) || userA.toString() === userB.toString()) {
        return { ok: false, status: 400, message: 'Invalid target user ID' };
    }

    const isBlocked = await blockModel.findOne({
        $or: [
            { blockerId: userA, blockedId: userB },
            { blockerId: userB, blockedId: userA },
        ],
    });
    if (isBlocked) {
        return { ok: false, status: 403, message: 'Cannot access messages. User is blocked.' };
    }

    const isConnected = await connectionModel.findOne({
        status: 'accepted',
        $or: [
            { fromUserId: userA, toUserId: userB },
            { fromUserId: userB, toUserId: userA },
        ],
    });
    if (!isConnected) {
        return { ok: false, status: 403, message: 'You can only message users you are matched with.' };
    }

    return { ok: true };
}

// =========================================================================
// 1. GET CHAT MESSAGES API
// =========================================================================
router.get('/messages/:targetUserId', userAuth, async (req, res) => {
    try {
        const { targetUserId } = req.params;
        const currentUserId = req.userId;

        const access = await verifyMatchedAndUnblocked(currentUserId, targetUserId);
        if (!access.ok) {
            return res.status(access.status).send({ status: false, message: access.message });
        }

        const { limit, skip } = parsePagination(req.query.page, req.query.limit || 50, 100);

        const messages = await messageModel.find({
            $or: [
                { senderId: currentUserId, receiverId: targetUserId },
                { senderId: targetUserId, receiverId: currentUserId },
            ],
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('senderId', 'firstName lastName profileImage')
            .lean();

        await messageModel.updateMany(
            { senderId: targetUserId, receiverId: currentUserId, read: false },
            { $set: { read: true } }
        );

        res.send({
            status: true,
            message: 'Messages fetched successfully',
            data: messages.reverse(),
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message,
        });
    }
});

// =========================================================================
// 2. SEND MESSAGE API
// =========================================================================
router.post('/messages/:targetUserId', userAuth, async (req, res) => {
    try {
        const { targetUserId } = req.params;
        const currentUserId = req.userId;
        const { text, type = 'text', mediaUrl, duration, callInfo } = req.body || {};

        const access = await verifyMatchedAndUnblocked(currentUserId, targetUserId);
        if (!access.ok) {
            return res.status(access.status).send({ status: false, message: access.message });
        }

        const safeTypes = ['text', 'image', 'audio', 'video', 'gif', 'call'];
        const safeType = safeTypes.includes(type) ? type : 'text';

        const newMessage = await messageModel.create({
            senderId: currentUserId,
            receiverId: targetUserId,
            text: typeof text === 'string' ? text.slice(0, 5000) : '',
            type: safeType,
            mediaUrl: typeof mediaUrl === 'string' ? mediaUrl : null,
            duration: typeof duration === 'number' ? Math.max(0, duration) : null,
            callInfo: callInfo && typeof callInfo === 'object' ? callInfo : null,
            read: false,
        });

        const populatedMessage = await messageModel.findById(newMessage._id)
            .populate('senderId', 'firstName lastName profileImage');

        const io = req.app.get('io');
        if (io) {
            io.to(targetUserId.toString()).emit('receive-message', populatedMessage);
        }

        res.send({
            status: true,
            message: 'Message sent successfully',
            data: populatedMessage,
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message,
        });
    }
});

// =========================================================================
// 3. GET CONVERSATIONS / RECENT CHATS LIST
// =========================================================================
router.get(['/conversations', '/chat/conversations'], userAuth, async (req, res) => {
    try {
        const currentUserId = req.userId;

        const connections = await connectionModel.find({
            $or: [
                { fromUserId: currentUserId, status: 'accepted' },
                { toUserId: currentUserId, status: 'accepted' },
            ],
        })
            .populate('fromUserId', 'firstName lastName profileImage job isVerified accountStatus')
            .populate('toUserId', 'firstName lastName profileImage job isVerified accountStatus');

        const conversationList = [];

        for (const conn of connections) {
            if (!conn.fromUserId || !conn.toUserId) continue;
            const isSender = conn.fromUserId._id.toString() === currentUserId.toString();
            const targetUser = isSender ? conn.toUserId : conn.fromUserId;
            if (!targetUser) continue;

            const lastMessage = await messageModel.findOne({
                $or: [
                    { senderId: currentUserId, receiverId: targetUser._id },
                    { senderId: targetUser._id, receiverId: currentUserId },
                ],
            }).sort({ createdAt: -1 });

            const unreadCount = await messageModel.countDocuments({
                senderId: targetUser._id,
                receiverId: currentUserId,
                read: false,
            });

            conversationList.push({
                user: targetUser,
                lastMessage: lastMessage || null,
                unreadCount,
                matchedAt: conn.updatedAt,
            });
        }

        conversationList.sort((a, b) => {
            const timeA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt) : new Date(a.matchedAt);
            const timeB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt) : new Date(b.matchedAt);
            return timeB - timeA;
        });

        res.send({
            status: true,
            message: 'Conversations fetched successfully',
            data: conversationList,
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message,
        });
    }
});

// =========================================================================
// 4. UPLOAD CHAT ATTACHMENT (Validated MIME + Cloudinary Stream)
// =========================================================================
router.post('/upload', userAuth, upload.single('file'), async (req, res) => {
    try {
        const check = validateUploadedFile(req.file, CHAT_MEDIA_MIME_TO_EXT);
        if (!check.ok) {
            return res.status(400).send({
                status: false,
                message: check.message,
            });
        }

        const isAudio = check.mime.startsWith('audio');
        const isVideo = check.mime.startsWith('video');
        const resourceType = (isAudio || isVideo) ? 'video' : 'image';

        const result = await uploadFromBuffer(req.file.buffer, {
            folder: isAudio ? 'portfolio-cms/chat-audio' : 'portfolio-cms/chat-images',
            resource_type: resourceType,
        });

        res.send({
            status: true,
            message: 'Attachment uploaded successfully',
            url: result.secure_url || result.url,
            data: {
                mediaUrl: result.secure_url || result.url,
                publicId: result.public_id,
                type: isAudio ? 'audio' : 'image',
            },
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message,
        });
    }
});

// =========================================================================
// 5. MARK MESSAGES AS READ
// =========================================================================
router.patch('/messages/read/:targetUserId', userAuth, async (req, res) => {
    try {
        const { targetUserId } = req.params;
        const currentUserId = req.userId;

        const access = await verifyMatchedAndUnblocked(currentUserId, targetUserId);
        if (!access.ok) {
            return res.status(access.status).send({ status: false, message: access.message });
        }

        await messageModel.updateMany(
            { senderId: targetUserId, receiverId: currentUserId, read: false },
            { $set: { read: true } }
        );

        res.send({
            status: true,
            message: 'Messages marked as read',
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message,
        });
    }
});

module.exports = router;
