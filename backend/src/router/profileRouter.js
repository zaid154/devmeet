const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const userModel = require('../modal/user');
const connectionModel = require('../modal/connection');
const blockModel = require('../modal/block');
const messageModel = require('../modal/message');
const reportModel = require('../modal/report');
const userAuth = require('../utils/userAuth');
const { buildDiscoveryQuery, normalizePreference } = require('../utils/matchingService');

// Optional auth helper (Allows guests or logged-in users to view public feeds)
const optionalUserAuth = async (req, res, next) => {
    try {
        let token = req?.cookies?.token;
        if (!token && req.headers.authorization) {
            token = req.headers.authorization.replace('Bearer ', '');
        }
        if (token) {
            const jwt = require('jsonwebtoken');
            const secret = process.env.JWT_PVT_KEY || process.env.JWT_SECRET || 'dev_super_secret_change_me_0123456789abcdef';
            const decoded = jwt.verify(token, secret);
            if (decoded && decoded.userId) {
                req.user = await userModel.findById(decoded.userId);
                req.userId = req.user?._id;
            }
        }
    } catch (e) {}
    next();
};


// =========================================================================
// 1. GET CURRENT LOGGED-IN USER PROFILE
// Kaam: Logged-in user ka apna profile data return karta hai.
// Kab use hota hai: App open hone par ya Profile screen par user details load karne ke liye.
// =========================================================================
router.get('/profile', userAuth, async (req, res) => {
    try {
        const user = await userModel.findById(req.userId).select('-password');
        if (!user) {
            return res.status(404).send({
                status: false,
                message: "User not found"
            });
        }

        res.send({
            status: true,
            message: "Profile fetched successfully",
            data: user
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});


// =========================================================================
// 2. GET USER PROFILE BY ID
// Kaam: Kisi doosre user ki detailed profile dekhne ke liye use hota hai.
// Kab use hota hai: Swipe deck me card expand karne par ya matched profile open karne par.
// =========================================================================
router.get('/user/:id', optionalUserAuth, async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).send({
                status: false,
                message: "Invalid User ID"
            });
        }

        const user = await userModel.findById(id).select('-password');
        if (!user) {
            return res.status(404).send({
                status: false,
                message: "User not found"
            });
        }

        res.send({
            status: true,
            message: "User found successfully",
            data: user
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});


// =========================================================================
// 3. UPDATE PROFILE API
// Kaam: User ka bio, skills, location, interests, photos, aur goals update karta hai.
// Kab use hota hai: Jab user 'Edit Profile' screen par details save karta hai.
// =========================================================================
router.patch('/updateProfile', userAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const allowedFields = [
            "firstName", "lastName", "age", "skills", "profileImage", "phone",
            "bio", "interests", "relationshipGoal", "interestedIn", "lookingFor", "location",
            "education", "job", "height", "zodiacSign", "favoriteArtist",
            "favoriteSong", "musicGenre", "gender", "photos", "preferences"
        ];

        const updateData = {};
        Object.keys(req.body).forEach(key => {
            if (allowedFields.includes(key)) {
                updateData[key] = req.body[key];
            }
        });

        // Keep interestedIn and preferences.gender synchronized
        if (updateData.interestedIn) {
            updateData.lookingFor = updateData.interestedIn;
            if (!updateData['preferences.gender']) {
                updateData['preferences.gender'] = updateData.interestedIn;
            }
        }

        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).send({
                status: false,
                message: "User not found"
            });
        }

        res.send({
            status: true,
            message: "Profile updated successfully! 🎉",
            data: updatedUser
        });
    } catch (error) {
        console.error("updateProfile error:", error.message);
        res.status(500).send({
            status: false,
            message: error.message || "Failed to update profile"
        });
    }
});


// =========================================================================
// 4. GET FEED RECOMMENDATIONS (Swipe Deck)
// Kaam: Strict sexual & romantic preference ke hisab se matching profiles return karta hai.
// Kab use hota hai: Feed / Dating swipe screen par card stack load karne ke liye.
// =========================================================================
router.get('/allUser', optionalUserAuth, async (req, res) => {
    try {
        const currentUser = req.user;
        const limit = Number(req.query.limit) || 50;

        // Build exact preference-based matching query
        const discoveryFilter = await buildDiscoveryQuery(currentUser, req.query);

        const feedUsers = await userModel.find(discoveryFilter)
            .select('-password')
            .limit(limit);

        res.send({
            status: true,
            message: "Feed recommendations fetched successfully",
            data: feedUsers
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});


// =========================================================================
// 5. RESET FEED API
// Kaam: User ki 'ignored' / 'passed' connections clear karke feed dobara refresh karta hai.
// Kab use hota hai: Jab feed me saare profiles khatam ho jayein aur user 'Start Over' click kare.
// =========================================================================
router.post('/resetFeed', userAuth, async (req, res) => {
    try {
        const currentUserId = req.userId;

        // Clear ignored connections
        await connectionModel.deleteMany({
            fromUserId: currentUserId,
            status: 'ignored'
        });

        res.send({
            status: true,
            message: "Feed has been reset successfully! New profiles are now available."
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});


// =========================================================================
// 5. SEARCH USERS API (Explore & Search)
// Kaam: Keywords (Name, Skills, Job, Location) & Sexual Interest ke hisab se profiles filter karta hai.
// Kab use hota hai: Search page ya Explore filter bar me.
// =========================================================================
router.get('/searchUsers', optionalUserAuth, async (req, res) => {
    try {
        const currentUser = req.user;
        const filter = await buildDiscoveryQuery(currentUser, req.query);

        const results = await userModel.find(filter)
            .select('-password')
            .limit(50);

        res.send({
            status: true,
            data: results
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});


// =========================================================================
// 6. GET SINGLE USER PROFILE DETAILS
// Kaam: Kisi dusre candidate ki full profile (bio, interests, photos, skills) dekhne ke liye.
// Kab use hota hai: Feed card par tap karke full details modal kholne par.
// =========================================================================
router.get('/user-profile/:id', userAuth, async (req, res) => {
    try {
        const targetUserId = req.params.id;

        const user = await userModel.findById(targetUserId).select('-password');
        if (!user) {
            return res.status(404).send({
                status: false,
                message: "User not found"
            });
        }

        res.send({
            status: true,
            data: user
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});


// =========================================================================
// 7. REQUEST PHOTO VERIFICATION BADGE (Blue Checkmark)
// Kaam: User ki photo verification request submit karta hai.
// Kab use hota hai: Jab user profile me 'Get Verified' badge ke liye apply karta hai.
// =========================================================================
router.post('/verify', userAuth, async (req, res) => {
    try {
        const user = await userModel.findByIdAndUpdate(
            req.userId,
            {
                isVerified: true,
                verificationStatus: 'approved'
            },
            { new: true }
        ).select('-password');

        res.send({
            status: true,
            message: "Verification approved! Blue badge is now active on your profile. ✓",
            data: user
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});


// =========================================================================
// 8. DELETE USER ACCOUNT PERMANENTLY
// Kaam: User ka account aur uske saare matches/chats permanently delete karta hai.
// Kab use hota hai: Settings me 'Delete Account' par click karne par.
// =========================================================================
router.delete('/account', userAuth, async (req, res) => {
    try {
        const currentUserId = req.userId;

        await userModel.findByIdAndDelete(currentUserId);

        // Delete connections, messages and reports
        await connectionModel.deleteMany({
            $or: [{ fromUserId: currentUserId }, { toUserId: currentUserId }]
        });

        await messageModel.deleteMany({
            $or: [{ senderId: currentUserId }, { receiverId: currentUserId }]
        });

        res.cookie('token', null, { expires: new Date(Date.now()) });

        res.send({
            status: true,
            message: "Account deleted permanently"
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});


// =========================================================================
// 9. GET USER SETTINGS (Preferences & Privacy)
// =========================================================================
router.get('/settings', userAuth, async (req, res) => {
    try {
        const user = await userModel.findById(req.userId).select('preferences privacy interestedIn lookingFor gender');
        if (!user) {
            return res.status(404).send({
                status: false,
                message: "User not found"
            });
        }

        res.send({
            status: true,
            data: {
                preferences: {
                    ageMin: user.preferences?.ageMin || 18,
                    ageMax: user.preferences?.ageMax || 45,
                    gender: user.interestedIn || user.preferences?.gender || 'everyone',
                    location: user.preferences?.location || ''
                },
                privacy: user.privacy || {
                    showOnlineStatus: true,
                    showLastSeen: true,
                    showProfile: true
                },
                interestedIn: user.interestedIn || 'everyone',
                gender: user.gender
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
// 10. UPDATE USER SETTINGS (Preferences & Privacy)
// =========================================================================
router.patch('/settings', userAuth, async (req, res) => {
    try {
        const { preferences, privacy } = req.body || {};
        const updateData = {};

        if (preferences) {
            if (preferences.ageMin !== undefined) updateData['preferences.ageMin'] = Number(preferences.ageMin);
            if (preferences.ageMax !== undefined) updateData['preferences.ageMax'] = Number(preferences.ageMax);
            if (preferences.location !== undefined) updateData['preferences.location'] = preferences.location;
            if (preferences.gender) {
                updateData['preferences.gender'] = preferences.gender;
                updateData.interestedIn = preferences.gender;
                updateData.lookingFor = preferences.gender;
            }
        }

        if (privacy) {
            if (privacy.showOnlineStatus !== undefined) updateData['privacy.showOnlineStatus'] = Boolean(privacy.showOnlineStatus);
            if (privacy.showLastSeen !== undefined) updateData['privacy.showLastSeen'] = Boolean(privacy.showLastSeen);
            if (privacy.showProfile !== undefined) updateData['privacy.showProfile'] = Boolean(privacy.showProfile);
        }

        const updatedUser = await userModel.findByIdAndUpdate(
            req.userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        res.send({
            status: true,
            message: "Preferences updated successfully! 🎉",
            data: updatedUser
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});

module.exports = router;