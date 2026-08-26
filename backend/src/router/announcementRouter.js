const express = require('express');
const router = express.Router();
const announcementModel = require('../modal/announcement');
const appSettingModel = require('../modal/appSetting');
const userModel = require('../modal/user');
const userAuth = require('../utils/userAuth');


// =========================================================================
// 1. GET ACTIVE ANNOUNCEMENTS FOR USERS
// Kaam: Platform par chal rahe active broadcast announcements return karta hai.
// Kab use hota hai: Top notification banner me updates/alerts dikhane ke liye.
// =========================================================================
router.get('/announcements/active', async (req, res) => {
    try {
        const announcements = await announcementModel.find({ isActive: true })
            .sort({ createdAt: -1 })
            .limit(3)
            .select('title message type target targetLocation createdAt')
            .lean();

        res.send({
            status: true,
            data: announcements
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});


// =========================================================================
// 2. GET PUBLIC FEATURE FLAGS
// Kaam: Check karta hai ki kon-kon se features (Dating, Calls, Astrology) live enabled hain.
// Kab use hota hai: Frontend components me feature access conditionally toggle karne ke liye.
// =========================================================================
router.get('/features/public', async (req, res) => {
    try {
        const setting = await appSettingModel.findOne({ key: 'feature_flags' });
        const defaultFlags = {
            dating: true,
            superLike: true,
            doubleDate: true,
            musicMode: true,
            astrology: true,
            passport: true,
            voiceCall: true,
            videoCall: true,
            gif: true,
            voiceNotes: true,
            verification: true
        };

        res.send({
            status: true,
            data: setting?.value || defaultFlags
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});


// =========================================================================
// 3. SUBMIT VERIFICATION REQUEST (Selfie / ID)
// Kaam: User ki verification badge request moderation queue me bhejta hai.
// Kab use hota hai: Settings > Verify Profile me document submit karne par.
// =========================================================================
router.post('/verification/request', userAuth, async (req, res) => {
    try {
        const { documentUrl, selfieUrl } = req.body;
        const user = await userModel.findById(req.userId);
        if (!user) {
            return res.status(404).send({
                status: false,
                message: "User not found"
            });
        }

        if (user.isVerified) {
            return res.status(400).send({
                status: false,
                message: "Your profile is already verified!"
            });
        }

        user.verificationStatus = 'pending';
        user.verificationDocument = documentUrl || selfieUrl || user.profileImage;
        user.verificationSubmittedAt = new Date();
        await user.save();

        res.send({
            status: true,
            message: "Verification request submitted successfully. Our team will review it shortly.",
            data: {
                verificationStatus: user.verificationStatus,
                isVerified: user.isVerified
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
// 4. PASSPORT VIRTUAL LOCATION
// Kaam: User ka virtual explore location change karta hai (Swipe in different cities).
// Kab use hota hai: Passport Mode me doosre shehar (city) ke developers dekhne ke liye.
// =========================================================================
router.post('/passport/location', userAuth, async (req, res) => {
    try {
        const { city } = req.body;
        const user = await userModel.findById(req.userId);
        if (!user) {
            return res.status(404).send({
                status: false,
                message: "User not found"
            });
        }

        user.passportCity = city || '';
        await user.save();

        res.send({
            status: true,
            message: city ? `Passport set to ${city}` : "Passport reset to current location",
            data: { passportCity: user.passportCity }
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});

module.exports = router;
