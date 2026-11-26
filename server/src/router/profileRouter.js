const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const userModel = require('../modal/user');
const connectionModel = require('../modal/connection');
const messageModel = require('../modal/message');
const userAuth = require('../utils/userAuth');
const { buildDiscoveryQuery } = require('../utils/matchingService');
const {
    getJwtSecret,
    getCookieOptions,
    extractToken,
    escapeRegex,
    isValidObjectId,
} = require('../utils/securityMiddleware');

// Public-safe projection: never expose email, phone, password, reset tokens, role, or moderation notes
const PUBLIC_USER_PROJECTION =
    'firstName lastName age gender bio photos profileImage interests skills job location education height zodiacSign relationshipGoal favoriteArtist favoriteSong musicGenre isVerified isOnline lastSeen passportCity';

// Optional auth helper (Allows guests or logged-in users to view public feeds)
const optionalUserAuth = async (req, _res, next) => {
    try {
        const token = extractToken(req, false);
        if (token) {
            const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });
            if (decoded?.userId && isValidObjectId(decoded.userId)) {
                const user = await userModel
                    .findById(decoded.userId)
                    .select('-password -resetPasswordToken -resetPasswordExpires');
                if (user && user.accountStatus === 'active') {
                    const changedTs = user.passwordChangedAt
                        ? Math.floor(user.passwordChangedAt.getTime() / 1000)
                        : 0;
                    if (!changedTs || !decoded.iat || decoded.iat >= changedTs) {
                        req.user = user;
                        req.userId = user._id;
                    }
                }
            }
        }
    } catch (_e) {}
    next();
};

// =========================================================================
// 1. GET CURRENT LOGGED-IN USER PROFILE
// =========================================================================
router.get('/profile', userAuth, async (req, res) => {
    try {
        const user = await userModel
            .findById(req.userId)
            .select('-password -resetPasswordToken -resetPasswordExpires');
        if (!user) {
            return res.status(404).send({
                status: false,
                message: 'User not found',
            });
        }

        res.send({
            status: true,
            message: 'Profile fetched successfully',
            data: user,
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message,
        });
    }
});

// =========================================================================
// 2. GET USER PROFILE BY ID (Public-safe projection only)
// =========================================================================
router.get('/user/:id', optionalUserAuth, async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).send({
                status: false,
                message: 'Invalid User ID',
            });
        }

        const user = await userModel
            .findOne({ _id: id, accountStatus: 'active' })
            .select(PUBLIC_USER_PROJECTION);
        if (!user) {
            return res.status(404).send({
                status: false,
                message: 'User not found',
            });
        }

        res.send({
            status: true,
            message: 'User found successfully',
            data: user,
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message,
        });
    }
});

// =========================================================================
// 3. UPDATE PROFILE API (Strict field & nested preferences sanitization)
// =========================================================================
router.patch('/updateProfile', userAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const allowedScalarFields = [
            'firstName', 'lastName', 'age', 'skills', 'profileImage', 'phone',
            'bio', 'interests', 'relationshipGoal', 'interestedIn', 'lookingFor', 'location',
            'education', 'job', 'height', 'zodiacSign', 'favoriteArtist',
            'favoriteSong', 'musicGenre', 'gender', 'photos',
        ];

        const updateData = {};
        for (const key of allowedScalarFields) {
            if (req.body && Object.prototype.hasOwnProperty.call(req.body, key)) {
                updateData[key] = req.body[key];
            }
        }

        if (req.body?.preferences && typeof req.body.preferences === 'object') {
            const p = req.body.preferences;
            if (p.ageMin !== undefined) updateData['preferences.ageMin'] = Math.min(60, Math.max(18, Number(p.ageMin) || 18));
            if (p.ageMax !== undefined) updateData['preferences.ageMax'] = Math.min(60, Math.max(18, Number(p.ageMax) || 45));
            if (typeof p.gender === 'string') updateData['preferences.gender'] = p.gender;
            if (typeof p.location === 'string') updateData['preferences.location'] = p.location.trim();
            if (p.maxDistance !== undefined) updateData['preferences.maxDistance'] = Math.min(10000, Math.max(1, Number(p.maxDistance) || 100));
        }

        if (Array.isArray(updateData.photos)) {
            updateData.photos = updateData.photos.filter((p) => typeof p === 'string').slice(0, 6);
        }
        if (Array.isArray(updateData.skills)) {
            updateData.skills = updateData.skills.filter((s) => typeof s === 'string').slice(0, 30);
        }
        if (Array.isArray(updateData.interests)) {
            updateData.interests = updateData.interests.filter((i) => typeof i === 'string').slice(0, 30);
        }

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
        ).select('-password -resetPasswordToken -resetPasswordExpires');

        if (!updatedUser) {
            return res.status(404).send({
                status: false,
                message: 'User not found',
            });
        }

        res.send({
            status: true,
            message: 'Profile updated successfully! 🎉',
            data: updatedUser,
        });
    } catch (error) {
        console.error('updateProfile error:', error.message);
        res.status(500).send({
            status: false,
            message: error.message || 'Failed to update profile',
        });
    }
});

// =========================================================================
// 4. GET FEED RECOMMENDATIONS (Swipe Deck)
// =========================================================================
router.get('/allUser', optionalUserAuth, async (req, res) => {
    try {
        const currentUser = req.user;
        const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 50));

        const discoveryFilter = await buildDiscoveryQuery(currentUser, req.query);

        const feedUsers = await userModel.find(discoveryFilter)
            .select(PUBLIC_USER_PROJECTION)
            .limit(limit);

        res.send({
            status: true,
            message: 'Feed recommendations fetched successfully',
            data: feedUsers,
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message,
        });
    }
});

// =========================================================================
// 5. RESET FEED API
// =========================================================================
router.post('/resetFeed', userAuth, async (req, res) => {
    try {
        await connectionModel.deleteMany({
            fromUserId: req.userId,
            status: 'ignored',
        });

        res.send({
            status: true,
            message: 'Feed has been reset successfully! New profiles are now available.',
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message,
        });
    }
});

// =========================================================================
// 6. SEARCH USERS API (Public-safe projection, never leaks email/phone)
// =========================================================================
router.get(['/searchUsers', '/search/users', '/user/search'], optionalUserAuth, async (req, res) => {
    try {
        const rawQuery = (req.query.query || req.query.q || req.query.username || '').toString().trim().slice(0, 80);
        const currentUserId = req.userId || req.user?._id;

        const filter = { accountStatus: 'active', role: 'user' };

        if (rawQuery) {
            const escaped = escapeRegex(rawQuery);
            const regex = new RegExp(escaped, 'i');
            filter.$or = [
                { firstName: regex },
                { lastName: regex },
                { job: regex },
                { location: regex },
                { skills: regex },
                { interests: regex },
            ];
        }

        if (currentUserId) {
            filter._id = { $ne: currentUserId };
        }

        const results = await userModel.find(filter)
            .select(PUBLIC_USER_PROJECTION)
            .sort({ _id: -1 })
            .limit(50)
            .lean();

        res.send({
            status: true,
            message: 'Search results fetched successfully',
            count: results.length,
            data: results || [],
        });
    } catch (error) {
        console.error('Search error in router:', error.message);
        res.status(200).send({
            status: true,
            count: 0,
            data: [],
            message: 'No results found',
        });
    }
});

// =========================================================================
// 7. GET SINGLE USER PROFILE DETAILS
// =========================================================================
router.get('/user-profile/:id', userAuth, async (req, res) => {
    try {
        const targetUserId = req.params.id;
        if (!isValidObjectId(targetUserId)) {
            return res.status(400).send({
                status: false,
                message: 'Invalid User ID',
            });
        }

        const user = await userModel
            .findOne({ _id: targetUserId, accountStatus: 'active' })
            .select(PUBLIC_USER_PROJECTION);
        if (!user) {
            return res.status(404).send({
                status: false,
                message: 'User not found',
            });
        }

        res.send({
            status: true,
            data: user,
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message,
        });
    }
});

// =========================================================================
// 8. REQUEST PHOTO VERIFICATION BADGE (Enters pending admin review queue)
// =========================================================================
router.post('/verify', userAuth, async (req, res) => {
    try {
        const currentUser = await userModel
            .findById(req.userId)
            .select('-password -resetPasswordToken -resetPasswordExpires');
        if (!currentUser) {
            return res.status(404).send({
                status: false,
                message: 'User not found',
            });
        }

        if (currentUser.isVerified) {
            return res.send({
                status: true,
                message: 'Your profile is already verified.',
                data: currentUser,
            });
        }

        currentUser.verificationStatus = 'pending';
        currentUser.verificationSubmittedAt = new Date();
        if (!currentUser.verificationDocument && currentUser.profileImage) {
            currentUser.verificationDocument = currentUser.profileImage;
        }
        await currentUser.save();

        res.send({
            status: true,
            message: 'Verification request submitted for admin review.',
            data: currentUser,
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message,
        });
    }
});

// =========================================================================
// 9. DELETE USER ACCOUNT PERMANENTLY
// =========================================================================
router.delete('/account', userAuth, async (req, res) => {
    try {
        const currentUserId = req.userId;

        await userModel.findByIdAndDelete(currentUserId);

        await connectionModel.deleteMany({
            $or: [{ fromUserId: currentUserId }, { toUserId: currentUserId }],
        });

        await messageModel.deleteMany({
            $or: [{ senderId: currentUserId }, { receiverId: currentUserId }],
        });

        res.cookie('token', '', getCookieOptions(true));
        res.cookie('adminToken', '', getCookieOptions(true));

        res.send({
            status: true,
            message: 'Account deleted permanently',
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message,
        });
    }
});

// =========================================================================
// 10. GET USER SETTINGS (Preferences & Privacy)
// =========================================================================
router.get('/settings', userAuth, async (req, res) => {
    try {
        const user = await userModel.findById(req.userId).select('preferences privacy interestedIn lookingFor gender');
        if (!user) {
            return res.status(404).send({
                status: false,
                message: 'User not found',
            });
        }

        res.send({
            status: true,
            data: {
                preferences: {
                    ageMin: user.preferences?.ageMin || 18,
                    ageMax: user.preferences?.ageMax || 45,
                    gender: user.interestedIn || user.preferences?.gender || 'everyone',
                    location: user.preferences?.location || '',
                },
                privacy: user.privacy || {
                    showOnlineStatus: true,
                    showLastSeen: true,
                    showProfile: true,
                },
                interestedIn: user.interestedIn || 'everyone',
                gender: user.gender,
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
// 11. UPDATE USER SETTINGS (Preferences & Privacy)
// =========================================================================
router.patch('/settings', userAuth, async (req, res) => {
    try {
        const { preferences, privacy } = req.body || {};
        const updateData = {};

        if (preferences && typeof preferences === 'object') {
            if (preferences.ageMin !== undefined) updateData['preferences.ageMin'] = Math.min(60, Math.max(18, Number(preferences.ageMin) || 18));
            if (preferences.ageMax !== undefined) updateData['preferences.ageMax'] = Math.min(60, Math.max(18, Number(preferences.ageMax) || 45));
            if (typeof preferences.location === 'string') updateData['preferences.location'] = preferences.location.trim();
            if (typeof preferences.gender === 'string' && preferences.gender) {
                updateData['preferences.gender'] = preferences.gender;
                updateData.interestedIn = preferences.gender;
                updateData.lookingFor = preferences.gender;
            }
        }

        if (privacy && typeof privacy === 'object') {
            if (privacy.showOnlineStatus !== undefined) updateData['privacy.showOnlineStatus'] = Boolean(privacy.showOnlineStatus);
            if (privacy.showLastSeen !== undefined) updateData['privacy.showLastSeen'] = Boolean(privacy.showLastSeen);
            if (privacy.showProfile !== undefined) updateData['privacy.showProfile'] = Boolean(privacy.showProfile);
        }

        const updatedUser = await userModel.findByIdAndUpdate(
            req.userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password -resetPasswordToken -resetPasswordExpires');

        res.send({
            status: true,
            message: 'Preferences updated successfully! 🎉',
            data: updatedUser,
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message,
        });
    }
});

module.exports = router;
