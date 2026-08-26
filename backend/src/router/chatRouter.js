const express = require('express');
const router = express.Router();
const multer = require('multer');

const userAuth = require('../utils/userAuth');
const messageModel = require('../modal/message');
const connectionModel = require('../modal/connection');
const blockModel = require('../modal/block');
const userModel = require('../modal/user');
const mediaModel = require('../modal/media');
const { uploadFromBuffer } = require('../utils/cloudinaryService');

// Multer memory storage for chat attachments (Images & Audio notes)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});


// =========================================================================
// 1. GET CHAT MESSAGES API
// Kaam: Do users ke beech ki chat history fetch karta hai aur unread messages ko 'read' mark karta hai.
// Kab use hota hai: Jab user kisi match ke sath chat window open karta hai.
// =========================================================================
router.get('/messages/:targetUserId', userAuth, async (req, res) => {
    try {
        const { targetUserId } = req.params;
        const currentUserId = req.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        // Check if either user has blocked the other
        const isBlocked = await blockModel.findOne({
            $or: [
                { blockerId: currentUserId, blockedId: targetUserId },
                { blockerId: targetUserId, blockedId: currentUserId }
            ]
        });

        if (isBlocked) {
            return res.status(403).send({
                status: false,
                message: "Cannot view messages. User is blocked."
            });
        }

        const messages = await messageModel.find({
            $or: [
                { senderId: currentUserId, receiverId: targetUserId },
                { senderId: targetUserId, receiverId: currentUserId }
            ]
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('senderId', 'firstName lastName profileImage')
        .lean();

        // Mark incoming messages as read
        await messageModel.updateMany(
            { senderId: targetUserId, receiverId: currentUserId, read: false },
            { $set: { read: true } }
        );

        res.send({
            status: true,
            message: "Messages fetched successfully",
            data: messages.reverse()
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});


// =========================================================================
// 2. SEND MESSAGE API
// Kaam: Naya text message, voice note, ya image message database me save karta hai.
// Socket.IO ke through real-time push karta hai.
// Kab use hota hai: Chat window me 'Send' button press karne par.
// =========================================================================
router.post('/messages/:targetUserId', userAuth, async (req, res) => {
    try {
        const { targetUserId } = req.params;
        const currentUserId = req.userId;
        const { text, type = 'text', mediaUrl, duration, callInfo } = req.body;

        // Check active match
        const isConnected = await connectionModel.findOne({
            $or: [
                { fromUserId: currentUserId, toUserId: targetUserId, status: 'accepted' },
                { fromUserId: targetUserId, toUserId: currentUserId, status: 'accepted' }
            ]
        });

        if (!isConnected) {
            return res.status(403).send({
                status: false,
                message: "You can only message users you are matched with."
            });
        }

        // Check if blocked
        const isBlocked = await blockModel.findOne({
            $or: [
                { blockerId: currentUserId, blockedId: targetUserId },
                { blockerId: targetUserId, blockedId: currentUserId }
            ]
        });

        if (isBlocked) {
            return res.status(403).send({
                status: false,
                message: "Cannot send message. User is blocked."
            });
        }

        const newMessage = await messageModel.create({
            senderId: currentUserId,
            receiverId: targetUserId,
            text: text || '',
            type: type,
            mediaUrl: mediaUrl || null,
            duration: duration || null,
            callInfo: callInfo || null,
            read: false
        });

        const populatedMessage = await messageModel.findById(newMessage._id)
            .populate('senderId', 'firstName lastName profileImage');

        // Real-time Socket.IO emission
        const io = req.app.get('io');
        if (io) {
            io.to(targetUserId.toString()).emit('receive-message', populatedMessage);
        }

        res.send({
            status: true,
            message: "Message sent successfully",
            data: populatedMessage
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});


// =========================================================================
// 3. GET CONVERSATIONS / RECENT CHATS LIST
// Kaam: User ki saari active chats with last message & unread badge count return karta hai.
// Kab use hota hai: Chat Inbox tab load hone par.
// =========================================================================
router.get(['/conversations', '/chat/conversations'], userAuth, async (req, res) => {
    try {
        const currentUserId = req.userId;

        const connections = await connectionModel.find({
            $or: [
                { fromUserId: currentUserId, status: 'accepted' },
                { toUserId: currentUserId, status: 'accepted' }
            ]
        })
        .populate('fromUserId', 'firstName lastName profileImage job isVerified accountStatus')
        .populate('toUserId', 'firstName lastName profileImage job isVerified accountStatus');

        const conversationList = [];

        for (const conn of connections) {
            const isSender = conn.fromUserId._id.toString() === currentUserId.toString();
            const targetUser = isSender ? conn.toUserId : conn.fromUserId;

            if (!targetUser) continue;

            const lastMessage = await messageModel.findOne({
                $or: [
                    { senderId: currentUserId, receiverId: targetUser._id },
                    { senderId: targetUser._id, receiverId: currentUserId }
                ]
            }).sort({ createdAt: -1 });

            const unreadCount = await messageModel.countDocuments({
                senderId: targetUser._id,
                receiverId: currentUserId,
                read: false
            });

            conversationList.push({
                user: targetUser,
                lastMessage: lastMessage || null,
                unreadCount: unreadCount,
                matchedAt: conn.updatedAt
            });
        }

        conversationList.sort((a, b) => {
            const timeA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt) : new Date(a.matchedAt);
            const timeB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt) : new Date(b.matchedAt);
            return timeB - timeA;
        });

        res.send({
            status: true,
            message: "Conversations fetched successfully",
            data: conversationList
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});


// =========================================================================
// 4. UPLOAD CHAT ATTACHMENT (Cloudinary Stream)
// Kaam: Chat me bheji gayi image ya voice recording ko securely Cloudinary par upload karta hai.
// Kab use hota hai: Chat window me Image attach ya Voice Note send karne par.
// =========================================================================
router.post('/upload', userAuth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send({
                status: false,
                message: "No file uploaded"
            });
        }

        const isAudio = req.file.mimetype.startsWith('audio');
        const resourceType = isAudio ? 'video' : 'image';

        const result = await uploadFromBuffer(req.file.buffer, {
            folder: isAudio ? 'portfolio-cms/chat-audio' : 'portfolio-cms/chat-images',
            resource_type: resourceType
        });

        res.send({
            status: true,
            message: "Attachment uploaded successfully",
            url: result.secure_url || result.url,
            data: {
                mediaUrl: result.secure_url || result.url,
                publicId: result.public_id,
                type: isAudio ? 'audio' : 'image'
            }
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});


// =========================================================================
// 5. MARK MESSAGES AS READ
// Kaam: Kisi user se aaye sabhi unread messages ko 'read: true' mark karta hai.
// Kab use hota hai: Chat screen open karne par unread notification badge hatane ke liye.
// =========================================================================
router.patch('/messages/read/:targetUserId', userAuth, async (req, res) => {
    try {
        const { targetUserId } = req.params;
        const currentUserId = req.userId;

        await messageModel.updateMany(
            { senderId: targetUserId, receiverId: currentUserId, read: false },
            { $set: { read: true } }
        );

        res.send({
            status: true,
            message: "Messages marked as read"
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});

module.exports = router;
