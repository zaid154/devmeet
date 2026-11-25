const express = require('express');
const router = express.Router();
const blockModel = require('../modal/block');
const connectionModel = require('../modal/connection');
const userAuth = require('../utils/userAuth');


// =========================================================================
// 1. BLOCK USER API
// Kaam: Kisi user ko block karta hai aur unki connection ko reject mark karta hai.
// Kab use hota hai: Chat settings ya Profile options me 'Block User' par click karne par.
// =========================================================================
router.post('/block/:userId', userAuth, async (req, res) => {
    try {
        const blockerId = req.userId;
        const blockedId = req.params.userId;

        if (blockerId.toString() === blockedId.toString()) {
            return res.status(400).send({
                status: false,
                message: "You cannot block yourself"
            });
        }

        const existingBlock = await blockModel.findOne({ blockerId, blockedId });
        if (existingBlock) {
            return res.status(400).send({
                status: false,
                message: "User is already blocked"
            });
        }

        const newBlock = new blockModel({
            blockerId,
            blockedId
        });
        await newBlock.save();

        // Reject active connections
        await connectionModel.updateMany(
            {
                $or: [
                    { fromUserId: blockerId, toUserId: blockedId },
                    { fromUserId: blockedId, toUserId: blockerId }
                ]
            },
            { status: 'rejected' }
        );

        res.send({
            status: true,
            message: "User blocked successfully"
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});


// =========================================================================
// 2. UNBLOCK USER API
// Kaam: Blocked user ko unblock karta hai.
// Kab use hota hai: Settings me Blocked Users list se unblock karne par.
// =========================================================================
router.delete('/block/:userId', userAuth, async (req, res) => {
    try {
        const deletedBlock = await blockModel.findOneAndDelete({
            blockerId: req.userId,
            blockedId: req.params.userId
        });

        if (!deletedBlock) {
            return res.status(404).send({
                status: false,
                message: "Block record not found"
            });
        }

        res.send({
            status: true,
            message: "User unblocked successfully"
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});


// =========================================================================
// 3. GET BLOCKED USERS LIST
// Kaam: Current user dwara block kiye gaye sabhi users ko list karta hai.
// Kab use hota hai: Settings > Privacy > Blocked Users screen par.
// =========================================================================
router.get('/blocked-users', userAuth, async (req, res) => {
    try {
        const blockedUsers = await blockModel.find({ blockerId: req.userId })
            .populate('blockedId', 'firstName lastName profileImage age gender location')
            .sort({ createdAt: -1 });

        res.send({
            status: true,
            message: "Blocked users fetched",
            data: blockedUsers
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});

module.exports = router;
