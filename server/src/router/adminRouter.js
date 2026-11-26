const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const userModel = require('../modal/user');
const connectionModel = require('../modal/connection');
const messageModel = require('../modal/message');
const reportModel = require('../modal/report');
const adminActivityLog = require('../modal/adminActivityLog');
const announcementModel = require('../modal/announcement');
const appSettingModel = require('../modal/appSetting');
const { adminAuth, requireRoles } = require('../utils/adminAuth');
const { escapeRegex, isValidObjectId, parsePagination } = require('../utils/securityMiddleware');

const FEATURE_KEYS = [
    'dating', 'superLike', 'doubleDate', 'musicMode', 'astrology',
    'passport', 'voiceCall', 'videoCall', 'gif', 'voiceNotes', 'verification',
];

const SETTING_KEYS = [
    'appName', 'siteName', 'supportEmail', 'maintenanceMode', 'allowSignups',
    'maxPhotosPerUser', 'minAgeRequirement', 'maxAgeRequirement', 'requirePhoneVerification',
];

// Helper function to record admin activity logs
const logAdminAction = async (admin, action, targetType, targetId, details, req) => {
    try {
        await adminActivityLog.create({
            adminId: admin._id,
            adminEmail: admin.email,
            adminRole: admin.role,
            action,
            targetType,
            targetId,
            details,
            ipAddress: req?.ip || '',
        });
    } catch (error) {
        console.log('Log error:', error.message);
    }
};

// Protect all admin endpoints with adminAuth middleware
router.use(adminAuth);

// ==========================================
// 1. ADMIN PROFILE
// ==========================================
router.get('/me', async (req, res) => {
    try {
        res.send({
            status: true,
            data: req.admin,
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message,
        });
    }
});

// ==========================================
// 2. DASHBOARD ANALYTICS & STATS
// ==========================================
router.get('/dashboard', async (_req, res) => {
    try {
        const totalUsers = await userModel.countDocuments({ role: 'user' });
        const activeUsers = await userModel.countDocuments({ role: 'user', accountStatus: 'active' });
        const verifiedUsers = await userModel.countDocuments({ role: 'user', isVerified: true });
        const suspendedUsers = await userModel.countDocuments({ accountStatus: 'suspended' });
        const bannedUsers = await userModel.countDocuments({ accountStatus: 'banned' });

        const totalMatches = await connectionModel.countDocuments({ status: 'accepted' });
        const totalMessages = await messageModel.countDocuments();
        const totalReports = await reportModel.countDocuments();
        const pendingReports = await reportModel.countDocuments({ status: 'pending' });
        const pendingVerifications = await userModel.countDocuments({ verificationStatus: 'pending' });

        const recentUsers = await userModel.find({ role: 'user' })
            .sort({ createdAt: -1 })
            .limit(6)
            .select('-password -resetPasswordToken -resetPasswordExpires');

        const recentLogs = await adminActivityLog.find()
            .sort({ createdAt: -1 })
            .limit(8);

        const genderDistribution = await userModel.aggregate([
            { $match: { role: 'user' } },
            { $group: { _id: '$gender', count: { $sum: 1 } } },
        ]);

        res.send({
            status: true,
            data: {
                metrics: {
                    totalUsers,
                    activeUsers,
                    verifiedUsers,
                    suspendedUsers,
                    bannedUsers,
                    totalMatches,
                    totalMessages,
                    totalReports,
                    pendingReports,
                    pendingVerifications,
                },
                genderDistribution,
                recentUsers,
                recentLogs,
            },
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message,
        });
    }
});

// ==========================================
// 3. USER MANAGEMENT
// ==========================================
router.get('/users', async (req, res) => {
    try {
        const { page = 1, limit = 12, search = '', role = '', status = '', verification = '', gender = '' } = req.query;

        const query = {};
        if (typeof search === 'string' && search.trim()) {
            const searchRegex = new RegExp(escapeRegex(search.trim().slice(0, 80)), 'i');
            query.$or = [
                { firstName: searchRegex },
                { lastName: searchRegex },
                { email: searchRegex },
                { location: searchRegex },
                { job: searchRegex },
            ];
        }

        if (typeof role === 'string' && role) query.role = role;
        if (typeof status === 'string' && status) query.accountStatus = status;
        if (typeof verification === 'string' && verification) query.verificationStatus = verification;
        if (typeof gender === 'string' && gender) query.gender = gender;

        const { page: pageNumber, limit: limitNumber, skip } = parsePagination(page, limit, 100);

        const users = await userModel.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNumber)
            .select('-password -resetPasswordToken -resetPasswordExpires');

        const totalUsers = await userModel.countDocuments(query);

        res.send({
            status: true,
            data: {
                users,
                pagination: {
                    total: totalUsers,
                    page: pageNumber,
                    limit: limitNumber,
                    totalPages: Math.ceil(totalUsers / limitNumber),
                },
            },
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message,
        });
    }
});

router.get('/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: 'Invalid user ID' });
        }

        const user = await userModel.findById(userId).select('-password -resetPasswordToken -resetPasswordExpires');
        if (!user) {
            return res.status(404).send({
                status: false,
                message: 'User not found',
            });
        }

        const matchesCount = await connectionModel.countDocuments({
            $or: [{ fromUserId: user._id }, { toUserId: user._id }],
            status: 'accepted',
        });

        const reportsCount = await reportModel.countDocuments({
            reportedUserId: user._id,
        });

        res.send({
            status: true,
            data: {
                user,
                stats: {
                    matchesCount,
                    reportsCount,
                },
            },
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message,
        });
    }
});

router.patch('/users/:id/status', requireRoles(['super-admin', 'admin']), async (req, res) => {
    try {
        const userId = req.params.id;
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: 'Invalid user ID' });
        }

        const { status, reason = '' } = req.body || {};
        const allowedStatuses = ['active', 'suspended', 'banned', 'deleted'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).send({ status: false, message: 'Invalid account status' });
        }

        const user = await userModel.findByIdAndUpdate(
            userId,
            { accountStatus: status, statusReason: String(reason || '') },
            { new: true }
        ).select('-password -resetPasswordToken -resetPasswordExpires');

        if (!user) {
            return res.status(404).send({
                status: false,
                message: 'User not found',
            });
        }

        await logAdminAction(req.admin, `status_change_to_${status}`, 'user', user._id, String(reason || ''), req);

        res.send({
            status: true,
            message: `User status changed to ${status}`,
            data: user,
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message,
        });
    }
});

router.patch('/users/:id/role', requireRoles(['super-admin']), async (req, res) => {
    try {
        const userId = req.params.id;
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: 'Invalid user ID' });
        }

        const { role } = req.body || {};
        const allowedRoles = ['user', 'moderator', 'support', 'admin', 'super-admin'];
        if (!allowedRoles.includes(role)) {
            return res.status(400).send({ status: false, message: 'Invalid role' });
        }

        const user = await userModel.findByIdAndUpdate(
            userId,
            { role },
            { new: true }
        ).select('-password -resetPasswordToken -resetPasswordExpires');

        if (!user) {
            return res.status(404).send({
                status: false,
                message: 'User not found',
            });
        }

        await logAdminAction(req.admin, `role_change_to_${role}`, 'user', user._id, `Role changed to ${role}`, req);

        res.send({
            status: true,
            message: `User role updated to ${role}`,
            data: user,
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message,
        });
    }
});

router.patch('/users/:id/verify', requireRoles(['super-admin', 'admin', 'moderator']), async (req, res) => {
    try {
        const userId = req.params.id;
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: 'Invalid user ID' });
        }

        const { approved, isVerified, rejectionReason = '' } = req.body || {};
        const shouldApprove = approved !== undefined ? Boolean(approved) : Boolean(isVerified);

        const updateData = shouldApprove
            ? { isVerified: true, verificationStatus: 'approved' }
            : { isVerified: false, verificationStatus: 'rejected', statusReason: String(rejectionReason || '') };

        const user = await userModel.findByIdAndUpdate(
            userId,
            updateData,
            { new: true }
        ).select('-password -resetPasswordToken -resetPasswordExpires');

        if (!user) {
            return res.status(404).send({
                status: false,
                message: 'User not found',
            });
        }

        const actionName = shouldApprove ? 'verification_approved' : 'verification_rejected';
        await logAdminAction(req.admin, actionName, 'user', user._id, String(rejectionReason || ''), req);

        res.send({
            status: true,
            message: `Verification ${shouldApprove ? 'approved' : 'rejected'} successfully`,
            data: user,
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message,
        });
    }
});

router.delete('/users/:id', requireRoles(['super-admin', 'admin']), async (req, res) => {
    try {
        const userId = req.params.id;
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: 'Invalid user ID' });
        }

        if (userId === req.admin._id.toString()) {
            return res.status(400).send({ status: false, message: 'Cannot delete your own admin account' });
        }

        const user = await userModel.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).send({
                status: false,
                message: 'User not found',
            });
        }

        await connectionModel.deleteMany({
            $or: [{ fromUserId: user._id }, { toUserId: user._id }],
        });

        await messageModel.deleteMany({
            $or: [{ senderId: user._id }, { receiverId: user._id }],
        });

        await reportModel.deleteMany({
            $or: [{ reportedUserId: user._id }, { reporterId: user._id }],
        });

        await logAdminAction(req.admin, 'delete_user', 'user', user._id, `Deleted user ${user.email}`, req);

        res.send({
            status: true,
            message: 'User deleted successfully',
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message,
        });
    }
});

// ==========================================
// 4. REPORTS & MODERATION
// ==========================================
router.get('/reports', async (req, res) => {
    try {
        const { status = '', reason = '', page = 1, limit = 15 } = req.query;

        const query = {};
        if (typeof status === 'string' && status) query.status = status;
        if (typeof reason === 'string' && reason) query.reason = reason;

        const { page: pageNumber, limit: limitNumber, skip } = parsePagination(page, limit, 100);

        const reports = await reportModel.find(query)
            .populate('reporterId', 'firstName lastName email profileImage')
            .populate('reportedUserId', 'firstName lastName email profileImage accountStatus')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNumber);

        const totalReports = await reportModel.countDocuments(query);

        res.send({
            status: true,
            data: {
                reports,
                pagination: {
                    total: totalReports,
                    page: pageNumber,
                    limit: limitNumber,
                    totalPages: Math.ceil(totalReports / limitNumber),
                },
            },
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message,
        });
    }
});

router.patch('/reports/:id', requireRoles(['super-admin', 'admin', 'moderator']), async (req, res) => {
    try {
        const reportId = req.params.id;
        if (!isValidObjectId(reportId)) {
            return res.status(400).send({ status: false, message: 'Invalid report ID' });
        }

        const { status, resolutionNotes = '', actionTaken = 'none' } = req.body || {};
        const allowedStatuses = ['pending', 'reviewed', 'resolved', 'dismissed'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).send({ status: false, message: 'Invalid report status' });
        }

        const report = await reportModel.findByIdAndUpdate(
            reportId,
            {
                status,
                resolutionNotes: String(resolutionNotes || ''),
                actionTaken: String(actionTaken || 'none'),
                resolvedBy: req.admin._id,
                resolvedAt: new Date(),
            },
            { new: true }
        );

        if (!report) {
            return res.status(404).send({
                status: false,
                message: 'Report not found',
            });
        }

        res.send({
            status: true,
            message: `Report marked as ${status}`,
            data: report,
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message,
        });
    }
});

router.get('/verifications', async (_req, res) => {
    try {
        const users = await userModel.find({ verificationStatus: 'pending' })
            .sort({ createdAt: -1 })
            .select('firstName lastName email profileImage photos gender age createdAt location');

        res.send({
            status: true,
            data: users,
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message,
        });
    }
});

router.get('/moderation/photos', async (_req, res) => {
    try {
        const users = await userModel.find({
            photos: { $exists: true, $not: { $size: 0 } },
        })
            .select('firstName lastName email profileImage photos accountStatus isVerified')
            .limit(60)
            .lean();

        const allPhotos = [];
        users.forEach((user) => {
            if (user.photos && Array.isArray(user.photos)) {
                user.photos.forEach((photoUrl) => {
                    allPhotos.push({
                        photoUrl,
                        user: {
                            _id: user._id,
                            name: `${user.firstName} ${user.lastName}`,
                            email: user.email,
                        },
                    });
                });
            }
        });

        res.send({
            status: true,
            data: { photos: allPhotos },
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message,
        });
    }
});

router.delete('/moderation/photo', requireRoles(['super-admin', 'admin', 'moderator']), async (req, res) => {
    try {
        const { userId, photoUrl } = req.body || {};
        if (!isValidObjectId(userId) || typeof photoUrl !== 'string') {
            return res.status(400).send({ status: false, message: 'Valid userId and photoUrl are required' });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).send({
                status: false,
                message: 'User not found',
            });
        }

        user.photos = (user.photos || []).filter((p) => p !== photoUrl);
        if (user.profileImage === photoUrl) {
            user.profileImage = user.photos[0] || '';
        }
        await user.save();

        await logAdminAction(req.admin, 'delete_photo_moderation', 'user', user._id, `Deleted photo: ${photoUrl}`, req);

        res.send({
            status: true,
            message: 'Photo removed successfully',
            data: {
                photos: user.photos,
                profileImage: user.profileImage,
            },
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message,
        });
    }
});

router.patch('/moderation/bio', requireRoles(['super-admin', 'admin', 'moderator']), async (req, res) => {
    try {
        const { userId, reason = 'Bio removed by admin' } = req.body || {};
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: 'Invalid user ID' });
        }

        const user = await userModel.findByIdAndUpdate(
            userId,
            { bio: '' },
            { new: true }
        ).select('-password -resetPasswordToken -resetPasswordExpires');

        if (!user) {
            return res.status(404).send({
                status: false,
                message: 'User not found',
            });
        }

        await logAdminAction(req.admin, 'reset_bio_moderation', 'user', user._id, String(reason || ''), req);

        res.send({
            status: true,
            message: 'Bio reset successfully',
            data: user,
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message,
        });
    }
});

// ==========================================
// 5. ANNOUNCEMENTS
// ==========================================
router.get('/announcements', async (_req, res) => {
    try {
        const announcements = await announcementModel.find().sort({ createdAt: -1 });
        res.send({
            status: true,
            data: announcements,
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message,
        });
    }
});

router.post('/announcements', requireRoles(['super-admin', 'admin']), async (req, res) => {
    try {
        const { title, message, type = 'info', expiresAt } = req.body || {};
        if (typeof title !== 'string' || typeof message !== 'string' || !title.trim() || !message.trim()) {
            return res.status(400).send({ status: false, message: 'Title and message are required' });
        }

        const announcement = await announcementModel.create({
            title: title.trim(),
            message: message.trim(),
            type: ['info', 'warning', 'success', 'danger'].includes(type) ? type : 'info',
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            createdBy: req.admin._id,
            isActive: true,
        });

        const io = req.app.get('io');
        if (io) {
            io.emit('new-announcement', announcement);
        }

        await logAdminAction(req.admin, 'create_announcement', 'announcement', announcement._id, title.trim(), req);

        res.send({
            status: true,
            message: 'Announcement created successfully',
            data: announcement,
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message,
        });
    }
});

router.patch('/announcements/:id/toggle', requireRoles(['super-admin', 'admin']), async (req, res) => {
    try {
        const announcementId = req.params.id;
        if (!isValidObjectId(announcementId)) {
            return res.status(400).send({ status: false, message: 'Invalid announcement ID' });
        }

        const announcement = await announcementModel.findById(announcementId);
        if (!announcement) {
            return res.status(404).send({
                status: false,
                message: 'Announcement not found',
            });
        }

        announcement.isActive = !announcement.isActive;
        await announcement.save();

        res.send({
            status: true,
            message: `Announcement ${announcement.isActive ? 'activated' : 'deactivated'}`,
            data: announcement,
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message,
        });
    }
});

router.delete('/announcements/:id', requireRoles(['super-admin', 'admin']), async (req, res) => {
    try {
        const announcementId = req.params.id;
        if (!isValidObjectId(announcementId)) {
            return res.status(400).send({ status: false, message: 'Invalid announcement ID' });
        }

        await announcementModel.findByIdAndDelete(announcementId);

        res.send({
            status: true,
            message: 'Announcement deleted successfully',
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message,
        });
    }
});

// ==========================================
// 6. FEATURE FLAGS
// ==========================================
router.get('/features', async (_req, res) => {
    try {
        const settings = await appSettingModel.findOne({ key: 'feature_flags' });
        res.send({
            status: true,
            data: settings?.value || {},
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message,
        });
    }
});

router.patch('/features', requireRoles(['super-admin', 'admin']), async (req, res) => {
    try {
        const rawFlags = (req.body && typeof req.body.features === 'object') ? req.body.features : (req.body || {});
        const safeFlags = {};
        for (const k of FEATURE_KEYS) {
            if (Object.prototype.hasOwnProperty.call(rawFlags, k)) {
                safeFlags[k] = Boolean(rawFlags[k]);
            }
        }

        const settings = await appSettingModel.findOneAndUpdate(
            { key: 'feature_flags' },
            {
                key: 'feature_flags',
                value: safeFlags,
                updatedBy: req.admin._id,
            },
            { upsert: true, new: true }
        );

        res.send({
            status: true,
            message: 'Feature flags updated successfully',
            data: settings.value,
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message,
        });
    }
});

// ==========================================
// 7. STAFF TEAM MANAGEMENT (SuperAdmin Only)
// ==========================================
router.get('/team', async (_req, res) => {
    try {
        const team = await userModel.find({
            role: { $in: ['admin', 'moderator', 'support', 'super-admin'] },
        }).select('-password -resetPasswordToken -resetPasswordExpires');

        res.send({
            status: true,
            data: team,
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message,
        });
    }
});

router.post('/team', requireRoles(['super-admin']), async (req, res) => {
    try {
        const { firstName, lastName, email, password, role = 'moderator', phone } = req.body || {};
        if (typeof firstName !== 'string' || typeof email !== 'string' || typeof password !== 'string' || !firstName.trim() || !email.trim() || password.length < 8) {
            return res.status(400).send({
                status: false,
                message: 'Valid name, email, and password (min 8 chars) are required',
            });
        }

        const allowedStaffRoles = ['moderator', 'support', 'admin', 'super-admin'];
        if (!allowedStaffRoles.includes(role)) {
            return res.status(400).send({ status: false, message: 'Invalid staff role' });
        }

        const cleanEmail = email.trim().toLowerCase();
        const existingUser = await userModel.findOne({ email: cleanEmail });
        if (existingUser) {
            return res.status(400).send({
                status: false,
                message: 'Email is already registered',
            });
        }

        const saltRounds = Number(process.env.SALT_ROUND) || 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newStaff = await userModel.create({
            firstName: firstName.trim(),
            lastName: typeof lastName === 'string' ? lastName.trim() : '',
            email: cleanEmail,
            password: hashedPassword,
            role,
            phone: typeof phone === 'string' && phone.trim() ? phone.trim() : '0000000000',
            accountStatus: 'active',
            isVerified: true,
        });

        await logAdminAction(req.admin, 'create_staff', 'user', newStaff._id, `Created ${role}: ${cleanEmail}`, req);

        res.send({
            status: true,
            message: 'Staff member created successfully',
            data: newStaff,
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message,
        });
    }
});

// ==========================================
// 8. ACTIVITY LOGS
// ==========================================
router.get('/activity-logs', async (req, res) => {
    try {
        const { page = 1, limit = 20, action = '' } = req.query;

        const query = {};
        if (typeof action === 'string' && action) query.action = action;

        const { page: pageNumber, limit: limitNumber, skip } = parsePagination(page, limit, 100);

        const logs = await adminActivityLog.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNumber);

        const totalLogs = await adminActivityLog.countDocuments(query);

        res.send({
            status: true,
            data: {
                logs,
                pagination: {
                    total: totalLogs,
                    page: pageNumber,
                    limit: limitNumber,
                    totalPages: Math.ceil(totalLogs / limitNumber),
                },
            },
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message,
        });
    }
});

// ==========================================
// 9. PLATFORM SETTINGS
// ==========================================
router.get('/settings', async (_req, res) => {
    try {
        const settings = await appSettingModel.findOne({ key: 'platform_settings' });

        res.send({
            status: true,
            data: settings?.value || {
                siteName: 'DevMeet',
                maintenanceMode: false,
                allowSignups: true,
                maxPhotosPerUser: 6,
            },
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message,
        });
    }
});

router.patch('/settings', requireRoles(['super-admin', 'admin']), async (req, res) => {
    try {
        const rawSettings = (req.body && typeof req.body.settings === 'object') ? req.body.settings : (req.body || {});
        const safeSettings = {};
        for (const k of SETTING_KEYS) {
            if (Object.prototype.hasOwnProperty.call(rawSettings, k)) {
                safeSettings[k] = rawSettings[k];
            }
        }

        const settings = await appSettingModel.findOneAndUpdate(
            { key: 'platform_settings' },
            {
                key: 'platform_settings',
                value: safeSettings,
                updatedBy: req.admin._id,
            },
            { upsert: true, new: true }
        );

        res.send({
            status: true,
            message: 'Settings saved successfully',
            data: settings.value,
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message,
        });
    }
});

module.exports = router;
