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

// Helper function to record admin activity logs
const logAdminAction = async (admin, action, targetType, targetId, details, req) => {
    try {
        await adminActivityLog.create({
            adminId: admin._id,
            adminEmail: admin.email,
            adminRole: admin.role,
            action: action,
            targetType: targetType,
            targetId: targetId,
            details: details,
            ipAddress: req?.ip || ''
        });
    } catch (error) {
        console.log("Log error:", error.message);
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
            data: req.admin
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});


// ==========================================
// 2. DASHBOARD ANALYTICS & STATS
// ==========================================
router.get('/dashboard', async (req, res) => {
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
            .select('-password');

        const recentLogs = await adminActivityLog.find()
            .sort({ createdAt: -1 })
            .limit(8);

        const genderDistribution = await userModel.aggregate([
            { $match: { role: 'user' } },
            { $group: { _id: '$gender', count: { $sum: 1 } } }
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
                    pendingVerifications
                },
                genderDistribution,
                recentUsers,
                recentLogs
            }
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});


// ==========================================
// 3. USER MANAGEMENT
// ==========================================

// Get all users with search, filter & pagination
router.get('/users', async (req, res) => {
    try {
        const { page = 1, limit = 12, search = '', role = '', status = '', verification = '', gender = '' } = req.query;

        const query = {};

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query.$or = [
                { firstName: searchRegex },
                { lastName: searchRegex },
                { email: searchRegex },
                { location: searchRegex },
                { job: searchRegex }
            ];
        }

        if (role) {
            query.role = role;
        }

        if (status) {
            query.accountStatus = status;
        }

        if (verification) {
            query.verificationStatus = verification;
        }

        if (gender) {
            query.gender = gender;
        }

        const pageNumber = Number(page);
        const limitNumber = Number(limit);
        const skip = (pageNumber - 1) * limitNumber;

        const users = await userModel.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNumber)
            .select('-password');

        const totalUsers = await userModel.countDocuments(query);

        res.send({
            status: true,
            data: {
                users,
                pagination: {
                    total: totalUsers,
                    page: pageNumber,
                    limit: limitNumber,
                    totalPages: Math.ceil(totalUsers / limitNumber)
                }
            }
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});

// Get single user full details
router.get('/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        const user = await userModel.findById(userId).select('-password');
        if (!user) {
            return res.status(404).send({
                status: false,
                message: "User not found"
            });
        }

        const matchesCount = await connectionModel.countDocuments({
            $or: [{ fromUserId: user._id }, { toUserId: user._id }],
            status: 'accepted'
        });

        const reportsCount = await reportModel.countDocuments({
            reportedUserId: user._id
        });

        res.send({
            status: true,
            data: {
                user,
                stats: {
                    matchesCount,
                    reportsCount
                }
            }
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});

// Update user status (active, suspended, banned)
router.patch('/users/:id/status', async (req, res) => {
    try {
        const userId = req.params.id;
        const { status, reason = '' } = req.body;

        const user = await userModel.findByIdAndUpdate(
            userId,
            { accountStatus: status },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).send({
                status: false,
                message: "User not found"
            });
        }

        await logAdminAction(req.admin, `status_change_to_${status}`, 'user', user._id, reason, req);

        res.send({
            status: true,
            message: `User status changed to ${status}`,
            data: user
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});

// Update user role (SuperAdmin only)
router.patch('/users/:id/role', requireRoles(['super-admin']), async (req, res) => {
    try {
        const userId = req.params.id;
        const { role } = req.body;

        const user = await userModel.findByIdAndUpdate(
            userId,
            { role: role },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).send({
                status: false,
                message: "User not found"
            });
        }

        await logAdminAction(req.admin, `role_change_to_${role}`, 'user', user._id, `Role changed to ${role}`, req);

        res.send({
            status: true,
            message: `User role updated to ${role}`,
            data: user
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});

// Approve or Reject verification request
router.patch('/users/:id/verify', async (req, res) => {
    try {
        const userId = req.params.id;
        const { approved, rejectionReason = '' } = req.body;

        let updateData = {};
        if (approved) {
            updateData = {
                isVerified: true,
                verificationStatus: 'approved'
            };
        } else {
            updateData = {
                isVerified: false,
                verificationStatus: 'rejected',
                verificationNotes: rejectionReason
            };
        }

        const user = await userModel.findByIdAndUpdate(
            userId,
            updateData,
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).send({
                status: false,
                message: "User not found"
            });
        }

        const actionName = approved ? 'verification_approved' : 'verification_rejected';
        await logAdminAction(req.admin, actionName, 'user', user._id, rejectionReason, req);

        res.send({
            status: true,
            message: `Verification ${approved ? 'approved' : 'rejected'} successfully`,
            data: user
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});

// Delete user permanently
router.delete('/users/:id', requireRoles(['super-admin', 'admin']), async (req, res) => {
    try {
        const userId = req.params.id;

        const user = await userModel.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).send({
                status: false,
                message: "User not found"
            });
        }

        // Clean up connections, messages and reports
        await connectionModel.deleteMany({
            $or: [{ fromUserId: user._id }, { toUserId: user._id }]
        });

        await messageModel.deleteMany({
            $or: [{ senderId: user._id }, { receiverId: user._id }]
        });

        await reportModel.deleteMany({
            $or: [{ reportedUserId: user._id }, { reporterId: user._id }]
        });

        await logAdminAction(req.admin, 'delete_user', 'user', user._id, `Deleted user ${user.email}`, req);

        res.send({
            status: true,
            message: "User deleted successfully"
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});


// ==========================================
// 4. REPORTS & MODERATION
// ==========================================

// Get reports list
router.get('/reports', async (req, res) => {
    try {
        const { status = '', reason = '', page = 1, limit = 15 } = req.query;

        const query = {};
        if (status) query.status = status;
        if (reason) query.reason = reason;

        const pageNumber = Number(page);
        const limitNumber = Number(limit);
        const skip = (pageNumber - 1) * limitNumber;

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
                    totalPages: Math.ceil(totalReports / limitNumber)
                }
            }
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});

// Update report resolution
router.patch('/reports/:id', async (req, res) => {
    try {
        const reportId = req.params.id;
        const { status, resolutionNotes = '', actionTaken = 'none' } = req.body;

        const report = await reportModel.findByIdAndUpdate(
            reportId,
            {
                status: status,
                resolutionNotes: resolutionNotes,
                actionTaken: actionTaken,
                resolvedBy: req.admin._id,
                resolvedAt: new Date()
            },
            { new: true }
        );

        if (!report) {
            return res.status(404).send({
                status: false,
                message: "Report not found"
            });
        }

        res.send({
            status: true,
            message: `Report marked as ${status}`,
            data: report
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});

// Get pending verifications
router.get('/verifications', async (req, res) => {
    try {
        const users = await userModel.find({ verificationStatus: 'pending' })
            .sort({ createdAt: -1 })
            .select('firstName lastName email profileImage photos gender age createdAt location');

        res.send({
            status: true,
            data: users
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});

// Get all photos for photo moderation
router.get('/moderation/photos', async (req, res) => {
    try {
        const users = await userModel.find({
            photos: { $exists: true, $not: { $size: 0 } }
        })
        .select('firstName lastName email profileImage photos accountStatus isVerified')
        .limit(60)
        .lean();

        const allPhotos = [];
        users.forEach((user) => {
            if (user.photos && Array.isArray(user.photos)) {
                user.photos.forEach((photoUrl) => {
                    allPhotos.push({
                        photoUrl: photoUrl,
                        user: {
                            _id: user._id,
                            name: `${user.firstName} ${user.lastName}`,
                            email: user.email
                        }
                    });
                });
            }
        });

        res.send({
            status: true,
            data: {
                photos: allPhotos
            }
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});

// Delete inappropriate user photo
router.delete('/moderation/photo', async (req, res) => {
    try {
        const { userId, photoUrl } = req.body;

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).send({
                status: false,
                message: "User not found"
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
            message: "Photo removed successfully",
            data: {
                photos: user.photos,
                profileImage: user.profileImage
            }
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});

// Reset abusive user bio
router.patch('/moderation/bio', async (req, res) => {
    try {
        const { userId, reason = 'Bio removed by admin' } = req.body;

        const user = await userModel.findByIdAndUpdate(
            userId,
            { bio: '' },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).send({
                status: false,
                message: "User not found"
            });
        }

        await logAdminAction(req.admin, 'reset_bio_moderation', 'user', user._id, reason, req);

        res.send({
            status: true,
            message: "Bio reset successfully",
            data: user
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});


// ==========================================
// 5. ANNOUNCEMENTS
// ==========================================

// Get all announcements
router.get('/announcements', async (req, res) => {
    try {
        const announcements = await announcementModel.find().sort({ createdAt: -1 });
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

// Create new announcement & broadcast
router.post('/announcements', async (req, res) => {
    try {
        const { title, message, type = 'info', expiresAt } = req.body;

        const announcement = await announcementModel.create({
            title: title,
            message: message,
            type: type,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            createdBy: req.admin._id,
            isActive: true
        });

        const io = req.app.get('io');
        if (io) {
            io.emit('new-announcement', announcement);
        }

        await logAdminAction(req.admin, 'create_announcement', 'announcement', announcement._id, title, req);

        res.send({
            status: true,
            message: "Announcement created successfully",
            data: announcement
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});

// Toggle announcement active status
router.patch('/announcements/:id/toggle', async (req, res) => {
    try {
        const announcementId = req.params.id;

        const announcement = await announcementModel.findById(announcementId);
        if (!announcement) {
            return res.status(404).send({
                status: false,
                message: "Announcement not found"
            });
        }

        announcement.isActive = !announcement.isActive;
        await announcement.save();

        res.send({
            status: true,
            message: `Announcement ${announcement.isActive ? 'activated' : 'deactivated'}`,
            data: announcement
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});

// Delete announcement
router.delete('/announcements/:id', async (req, res) => {
    try {
        const announcementId = req.params.id;

        await announcementModel.findByIdAndDelete(announcementId);

        res.send({
            status: true,
            message: "Announcement deleted successfully"
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});


// ==========================================
// 6. FEATURE FLAGS
// ==========================================

// Get feature flags
router.get('/features', async (req, res) => {
    try {
        const settings = await appSettingModel.findOne({ key: 'feature_flags' });
        res.send({
            status: true,
            data: settings?.value || {}
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});

// Update feature flags
router.patch('/features', requireRoles(['super-admin', 'admin']), async (req, res) => {
    try {
        const settings = await appSettingModel.findOneAndUpdate(
            { key: 'feature_flags' },
            {
                key: 'feature_flags',
                value: req.body,
                updatedBy: req.admin._id
            },
            { upsert: true, new: true }
        );

        res.send({
            status: true,
            message: "Feature flags updated successfully",
            data: settings.value
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});


// ==========================================
// 7. STAFF TEAM MANAGEMENT (SuperAdmin Only)
// ==========================================

// Get staff team
router.get('/team', async (req, res) => {
    try {
        const team = await userModel.find({
            role: { $in: ['admin', 'moderator', 'support', 'super-admin'] }
        }).select('-password');

        res.send({
            status: true,
            data: team
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});

// Create new staff member
router.post('/team', requireRoles(['super-admin']), async (req, res) => {
    try {
        const { firstName, lastName, email, password, role = 'moderator', phone } = req.body;

        const existingUser = await userModel.findOne({ email: email });
        if (existingUser) {
            return res.status(400).send({
                status: false,
                message: "Email is already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newStaff = await userModel.create({
            firstName: firstName,
            lastName: lastName,
            email: email,
            password: hashedPassword,
            role: role,
            phone: phone || '0000000000',
            accountStatus: 'active',
            isVerified: true
        });

        await logAdminAction(req.admin, 'create_staff', 'user', newStaff._id, `Created ${role}: ${email}`, req);

        res.send({
            status: true,
            message: `Staff member created successfully`,
            data: newStaff
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
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
        if (action) query.action = action;

        const pageNumber = Number(page);
        const limitNumber = Number(limit);
        const skip = (pageNumber - 1) * limitNumber;

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
                    totalPages: Math.ceil(totalLogs / limitNumber)
                }
            }
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});


// ==========================================
// 9. PLATFORM SETTINGS
// ==========================================
router.get('/settings', async (req, res) => {
    try {
        const settings = await appSettingModel.findOne({ key: 'platform_settings' });

        res.send({
            status: true,
            data: settings?.value || {
                siteName: 'DevMeet',
                maintenanceMode: false,
                allowSignups: true,
                maxPhotosPerUser: 6
            }
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});

router.patch('/settings', requireRoles(['super-admin', 'admin']), async (req, res) => {
    try {
        const settings = await appSettingModel.findOneAndUpdate(
            { key: 'platform_settings' },
            {
                key: 'platform_settings',
                value: req.body,
                updatedBy: req.admin._id
            },
            { upsert: true, new: true }
        );

        res.send({
            status: true,
            message: "Settings saved successfully",
            data: settings.value
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});

module.exports = router;
