const express = require('express');
const router = express.Router();
const notificationModel = require('../modal/notification');
const userAuth = require('../utils/userAuth');


// =========================================================================
// 1. GET USER NOTIFICATIONS API
// Kaam: Current user ki sabhi notifications (Likes, Super Likes, Matches) fetch karta hai.
// Kab use hota hai: Header bell icon ya Notifications page load hone par.
// =========================================================================
router.get('/notifications', userAuth, async (req, res) => {
    try {
        const notifications = await notificationModel.find({ userId: req.userId })
            .sort({ createdAt: -1 })
            .limit(50)
            .populate('fromUserId', 'firstName lastName profileImage');

        res.send({
            status: true,
            message: "Notifications fetched successfully",
            data: notifications
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});


// =========================================================================
// 2. MARK SINGLE NOTIFICATION AS READ
// Kaam: Kisi ek notification par click karne par usko 'read: true' mark karta hai.
// Kab use hota hai: Jab user notification list me kisi specific item par tap karta hai.
// =========================================================================
router.patch('/notifications/:id/read', userAuth, async (req, res) => {
    try {
        const notification = await notificationModel.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).send({
                status: false,
                message: "Notification not found"
            });
        }

        res.send({
            status: true,
            message: "Notification marked as read",
            data: notification
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});


// =========================================================================
// 3. MARK ALL NOTIFICATIONS AS READ
// Kaam: User ki sabhi unread notifications ko ek sath 'read: true' mark karta hai.
// Kab use hota hai: Notifications page par 'Mark all as read' button dabane par.
// =========================================================================
router.patch('/notifications/read-all', userAuth, async (req, res) => {
    try {
        await notificationModel.updateMany(
            { userId: req.userId, read: false },
            { read: true }
        );

        res.send({
            status: true,
            message: "All notifications marked as read"
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});


// =========================================================================
// 4. GET UNREAD NOTIFICATIONS COUNT
// Kaam: Total unread notifications ka number return karta hai.
// Kab use hota hai: Navigation bar / Bell icon par red badge count dikhane ke liye.
// =========================================================================
router.get('/notifications/unread-count', userAuth, async (req, res) => {
    try {
        const count = await notificationModel.countDocuments({
            userId: req.userId,
            read: false
        });

        res.send({
            status: true,
            message: "Unread count fetched",
            data: { count }
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});

module.exports = router;
