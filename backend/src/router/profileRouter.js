const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const userModel = require('../modal/user');
const connectionModel = require('../modal/connection');
const blockModel = require('../modal/block');
const messageModel = require('../modal/message');
const reportModel = require('../modal/report');
const userAuth = require('../utils/userAuth');

// Optional auth helper (Allows guests or logged-in users to view public feeds)
const optionalUserAuth = async (req, res, next) => {
    try {
        const token = req?.cookies?.token;
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
// 2. UPDATE PROFILE API
// Kaam: User ka bio, skills, location, interests, photos, aur goals update karta hai.
// Kab use hota hai: Jab user 'Edit Profile' screen par details save karta hai.
// =========================================================================
router.patch('/updateProfile', userAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const allowedFields = [
            "firstName", "lastName", "age", "skills", "profileImage", "phone",
            "bio", "interests", "relationshipGoal", "lookingFor", "location",
            "education", "job", "height", "zodiacSign", "favoriteArtist",
            "favoriteSong", "musicGenre", "gender", "photos"
        ];

        const updateData = {};
        Object.keys(req.body).forEach(key => {
            if (allowedFields.includes(key)) {
                updateData[key] = req.body[key];
            }
        });

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
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});


// =========================================================================
// 3. GET FEED RECOMMENDATIONS (Swipe Deck)
// Kaam: User ko swipe karne ke liye naye matching profiles return karta hai.
// Kab use hota hai: Feed / Dating swipe screen par card stack load karne ke liye.
// =========================================================================
router.get('/allUser', optionalUserAuth, async (req, res) => {
    try {
        const currentUserId = req.userId;

        let excludedUserIds = [];

        if (currentUserId) {
            excludedUserIds.push(currentUserId);

            // Hide already interacted profiles (passed, liked, accepted)
            const existingConnections = await connectionModel.find({
                $or: [{ fromUserId: currentUserId }, { toUserId: currentUserId }]
            });

            existingConnections.forEach(conn => {
                if (conn.fromUserId.toString() === currentUserId.toString()) {
                    excludedUserIds.push(conn.toUserId);
                } else {
                    excludedUserIds.push(conn.fromUserId);
                }
            });

            // Hide blocked users
            const blocks = await blockModel.find({
                $or: [{ blockerId: currentUserId }, { blockedId: currentUserId }]
            });

            blocks.forEach(b => {
                excludedUserIds.push(b.blockerId);
                excludedUserIds.push(b.blockedId);
            });
        }

        const feedUsers = await userModel.find({
            _id: { $nin: excludedUserIds },
            role: 'user',
            accountStatus: 'active'
        })
        .select('-password')
        .limit(20);

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
// 4. RESET FEED API
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
// Kaam: Keywords (Name, Skills, Job, Location) ke hisab se profiles filter karta hai.
// Kab use hota hai: Search page ya Explore filter bar me.
// =========================================================================
router.get('/searchUsers', userAuth, async (req, res) => {
    try {
        const { query = '', gender = '', minAge, maxAge, skills = '', location = '' } = req.query;
        const currentUserId = req.userId;

        const filter = {
            _id: { $ne: currentUserId },
            role: 'user',
            accountStatus: 'active'
        };

        if (query.trim()) {
            const regex = new RegExp(query.trim(), 'i');
            filter.$or = [
                { firstName: regex },
                { lastName: regex },
                { job: regex },
                { location: regex },
                { bio: regex }
            ];
        }

        if (gender && gender !== 'all') {
            filter.gender = gender;
        }

        if (minAge || maxAge) {
            filter.age = {};
            if (minAge) filter.age.$gte = Number(minAge);
            if (maxAge) filter.age.$lte = Number(maxAge);
        }

        if (location) {
            filter.location = new RegExp(location, 'i');
        }

        if (skills) {
            const skillList = skills.split(',').map(s => s.trim()).filter(Boolean);
            if (skillList.length > 0) {
                filter.skills = { $in: skillList };
            }
        }

        const results = await userModel.find(filter).select('-password').limit(30);

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

module.exports = router;