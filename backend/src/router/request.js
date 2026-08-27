const express = require('express');
const router = express.Router();
const userAuth = require('../utils/userAuth');
const connectionModel = require('../modal/connection');
const userModel = require('../modal/user');
const blockModel = require('../modal/block');
const notificationModel = require('../modal/notification');


// =========================================================================
// 1. SEND SWIPE / CONNECTION REQUEST API
// Kaam: Swipe Right (interested / like) ya Swipe Left (ignored / pass) handle karta hai.
// Mutual Like hone par automatically 'Match' bana deta hai.
// Kab use hota hai: Feed deck par Right/Left swipe karne par.
// =========================================================================
router.post('/sendConnection/:toUserId/:status', userAuth, async (req, res) => {
    try {
        const { toUserId, status } = req.params;
        const fromUserId = req.userId;

        if (fromUserId.toString() === toUserId.toString()) {
            return res.status(400).send({
                status: false,
                message: "You cannot send a connection request to yourself"
            });
        }

        // Check if either user has blocked the other
        const isBlocked = await blockModel.findOne({
            $or: [
                { blockerId: fromUserId, blockedId: toUserId },
                { blockerId: toUserId, blockedId: fromUserId }
            ]
        });

        if (isBlocked) {
            return res.status(403).send({
                status: false,
                message: "Cannot interact with this profile"
            });
        }

        const existingConnection = await connectionModel.findOne({
            $or: [
                { fromUserId, toUserId },
                { fromUserId: toUserId, toUserId: fromUserId }
            ]
        });

        if (existingConnection) {
            // Check mutual like -> Converts to Accepted Match! 🎉
            const wasInterested = ['intrested', 'super-like', 'pending'].includes(existingConnection.status);
            const otherLikedFirst = existingConnection.fromUserId.toString() === toUserId.toString();
            const currentLikes = ['intrested', 'super-like'].includes(status);

            if (wasInterested && otherLikedFirst && currentLikes) {
                existingConnection.status = 'accepted';
                await existingConnection.save();

                // Send Match Push Notification
                try {
                    const fromUser = await userModel.findById(fromUserId).select('firstName lastName');
                    await notificationModel.create({
                        userId: toUserId,
                        type: 'match',
                        fromUserId: fromUserId,
                        title: "It's a Match! 🎉",
                        body: `You and ${fromUser?.firstName || 'someone'} liked each other!`
                    });
                } catch (e) {}

                return res.send({
                    status: true,
                    isMatch: true,
                    message: "It's a Match! 🎉 You can now start chatting.",
                    data: existingConnection
                });
            }

            existingConnection.status = status;
            await existingConnection.save();

            return res.send({
                status: true,
                message: `Connection status updated to ${status}`
            });
        }

        // First time interaction
        const newConnection = new connectionModel({
            fromUserId,
            toUserId,
            status
        });
        await newConnection.save();

        if (status === 'intrested' || status === 'super-like') {
            try {
                const sender = await userModel.findById(fromUserId).select('firstName');
                await notificationModel.create({
                    userId: toUserId,
                    type: status === 'super-like' ? 'super-like' : 'like',
                    fromUserId: fromUserId,
                    title: status === 'super-like' ? '⭐ New Super Like!' : '💖 New Like!',
                    body: `${sender?.firstName || 'Someone'} liked your profile`
                });
            } catch (e) {}
        }

        res.send({
            status: true,
            message: `Request sent successfully (${status})`,
            data: newConnection
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});


// =========================================================================
// 2. SUPER LIKE API
// Kaam: User ko direct Super Like send karta hai with priority notification.
// Kab use hota hai: Feed me Star / Super Like button press karne par.
// =========================================================================
router.post('/super-like/:toUserId', userAuth, async (req, res) => {
    try {
        const { toUserId } = req.params;
        const fromUserId = req.userId;

        if (fromUserId.toString() === toUserId.toString()) {
            return res.status(400).send({
                status: false,
                message: "You cannot super-like yourself"
            });
        }

        const existing = await connectionModel.findOne({
            $or: [
                { fromUserId, toUserId },
                { fromUserId: toUserId, toUserId: fromUserId }
            ]
        });

        if (existing) {
            if (existing.fromUserId.toString() === toUserId.toString() && ['intrested', 'super-like', 'pending'].includes(existing.status)) {
                existing.status = 'accepted';
                await existing.save();

                return res.send({
                    status: true,
                    isMatch: true,
                    message: "It's a Match with Super Like! ⭐🎉",
                    data: existing
                });
            }
            existing.status = 'super-like';
            await existing.save();
            return res.send({ status: true, message: "Super Liked!", data: existing });
        }

        const newConn = await connectionModel.create({
            fromUserId,
            toUserId,
            status: 'super-like'
        });

        try {
            const sender = await userModel.findById(fromUserId).select('firstName');
            await notificationModel.create({
                userId: toUserId,
                type: 'super-like',
                fromUserId: fromUserId,
                title: '⭐ Someone Super Liked You!',
                body: `${sender?.firstName || 'A developer'} sent you a Super Like!`
            });
        } catch (e) {}

        res.send({
            status: true,
            message: "Super Like sent successfully! ⭐",
            data: newConn
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});


// =========================================================================
// 3. UNMATCH API
// Kaam: Match tod deta hai aur dono users ke beech connection delete karta hai.
// Kab use hota hai: Chat settings me 'Unmatch' click karne par.
// =========================================================================
router.post('/unmatch/:userId', userAuth, async (req, res) => {
    try {
        const targetUserId = req.params.userId;
        const currentUserId = req.userId;

        await connectionModel.deleteMany({
            $or: [
                { fromUserId: currentUserId, toUserId: targetUserId },
                { fromUserId: targetUserId, toUserId: currentUserId }
            ]
        });

        res.send({
            status: true,
            message: "Unmatched successfully"
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});


// =========================================================================
// 4. ACCEPT / REJECT RECEIVED REQUEST API
// Kaam: Received connection request ko Accept (accepted) ya Reject (rejected) karta hai.
// Kab use hota hai: Requests / Likes screen par Accept/Reject button dabane par.
// =========================================================================
router.patch(['/request/:id/:status', '/request/review/:status/:id'], userAuth, async (req, res) => {
    try {
        const connectionId = req.params.id;
        const targetStatus = req.params.status;
        const currentUserId = req.userId || req.user?._id;

        const allowedStatuses = ['accepted', 'rejected', 'ignored'];
        if (!allowedStatuses.includes(targetStatus)) {
            return res.status(400).send({
                status: false,
                message: "Invalid status"
            });
        }

        const connection = await connectionModel.findOne({
            _id: connectionId,
            toUserId: currentUserId,
            status: { $in: ['intrested', 'super-like', 'pending'] }
        });

        if (!connection) {
            return res.status(404).send({
                status: false,
                message: "Connection request not found or already processed"
            });
        }

        connection.status = targetStatus;
        await connection.save();

        if (targetStatus === 'accepted') {
            try {
                const currentUser = await userModel.findById(currentUserId).select('firstName');
                await notificationModel.create({
                    userId: connection.fromUserId,
                    type: 'match',
                    fromUserId: currentUserId,
                    title: "It's a Match! 🎉",
                    body: `${currentUser?.firstName || 'Someone'} accepted your connection request!`
                });
            } catch (e) {}
        }

        res.send({
            status: true,
            message: `Request has been ${targetStatus}`,
            data: connection
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});


// =========================================================================
// 5. GET ALL ACCEPTED MATCHES (Connections)
// Kaam: User ke sabhi accepted matches aur chat contacts return karta hai.
// Kab use hota hai: Connections / Chat list screen par matches dikhane ke liye.
// =========================================================================
router.get(['/view/accepted', '/user/matches'], userAuth, async (req, res) => {
    try {
        const currentUserId = req.userId || req.user?._id;

        const connections = await connectionModel.find({
            $or: [
                { fromUserId: currentUserId, status: 'accepted' },
                { toUserId: currentUserId, status: 'accepted' }
            ]
        })
        .populate('fromUserId', 'firstName lastName profileImage photos job location age isVerified accountStatus')
        .populate('toUserId', 'firstName lastName profileImage photos job location age isVerified accountStatus')
        .sort({ updatedAt: -1 });

        const matches = connections.map(conn => {
            const isSender = conn.fromUserId._id.toString() === currentUserId.toString();
            return isSender ? conn.toUserId : conn.fromUserId;
        }).filter(Boolean);

        res.send({
            status: true,
            message: "Accepted matches fetched successfully",
            data: matches
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});


// =========================================================================
// 6. GET RECEIVED CONNECTION REQUESTS
// Kaam: Dusre users dwara bheje gaye pending likes / requests list karta hai.
// Kab use hota hai: Likes / Requests tab par notifications dekhne ke liye.
// =========================================================================
router.get(['/user/request/received', '/view/all', '/view/received'], userAuth, async (req, res) => {
    try {
        const currentUserId = req.userId || req.user?._id;

        const requests = await connectionModel.find({
            toUserId: currentUserId,
            status: { $in: ['intrested', 'super-like', 'pending'] }
        })
        .populate('fromUserId', 'firstName lastName profileImage photos job location age isVerified bio skills interests')
        .sort({ createdAt: -1 });

        res.send({
            status: true,
            message: "Received requests fetched successfully",
            data: requests
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});

module.exports = router;