const express = require('express');
const router = express.Router();
const reportModel = require('../modal/report');
const userAuth = require('../utils/userAuth');

const validReasons = ['fake-profile', 'spam', 'harassment', 'inappropriate-content', 'scam', 'other'];


// =========================================================================
// 1. REPORT USER API
// Kaam: Fake ya abusive user ke khilaaf complaint / report register karta hai.
// Kab use hota hai: User profile ya Chat window me 'Report User' option par click karne par.
// =========================================================================
router.post('/report/:userId', userAuth, async (req, res) => {
    try {
        const reporterId = req.userId;
        const reportedUserId = req.params.userId;
        const { reason, description } = req.body;

        if (reporterId.toString() === reportedUserId.toString()) {
            return res.status(400).send({
                status: false,
                message: "You cannot report yourself"
            });
        }

        if (!reason || !validReasons.includes(reason)) {
            return res.status(400).send({
                status: false,
                message: "Invalid reason. Must be one of: " + validReasons.join(', ')
            });
        }

        const newReport = new reportModel({
            reporterId,
            reportedUserId,
            reason,
            description: description || '',
            status: 'pending'
        });
        await newReport.save();

        res.send({
            status: true,
            message: "Report submitted successfully. Our safety team will review it."
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});

module.exports = router;
