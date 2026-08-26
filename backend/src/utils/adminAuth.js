const jwt = require('jsonwebtoken');
const userModel = require('./../modal/user');
require('dotenv').config();

const STAFF_ROLES = ['moderator', 'support', 'admin', 'super-admin'];

const adminAuth = async (req, res, next) => {
    try {
        let token = req?.cookies?.token || req?.cookies?.adminToken;
        if (!token && req.headers.authorization) {
            token = req.headers.authorization.replace('Bearer ', '');
        }

        if (!token) {
            return res.status(200).json({
                status: false,
                unauthenticated: true,
                message: "Admin authentication required.",
            });
        }

        const secret = process.env.JWT_PVT_KEY || process.env.JWT_SECRET || 'dev_super_secret_change_me_0123456789abcdef';
        let decodeToken;
        try {
            decodeToken = await jwt.verify(token, secret);
        } catch (jwtErr) {
            return res.status(200).json({
                status: false,
                unauthenticated: true,
                message: "Invalid or expired admin session.",
            });
        }

        if (!decodeToken || !decodeToken.userId) {
            return res.status(200).json({
                status: false,
                unauthenticated: true,
                message: "Invalid or expired admin session.",
            });
        }

        const userExist = await userModel.findById(decodeToken.userId);

        if (!userExist) {
            return res.status(200).json({
                status: false,
                unauthenticated: true,
                message: "Admin user not found.",
            });
        }

        if (!STAFF_ROLES.includes(userExist.role)) {
            return res.status(403).json({
                status: false,
                message: "Access Denied: You do not have administrative privileges.",
            });
        }

        if (userExist.accountStatus !== 'active') {
            return res.status(403).json({
                status: false,
                message: "Access Denied: This staff account is suspended or deactivated.",
            });
        }

        req.admin = userExist;
        req.adminId = userExist._id;
        req.adminRole = userExist.role;
        next();

    } catch (err) {
        return res.status(401).json({
            status: false,
            message: "Admin authentication error: " + err.message,
        });
    }
};

const requireRoles = (allowedRoles = []) => {
    return (req, res, next) => {
        if (!req.admin || !allowedRoles.includes(req.admin.role)) {
            return res.status(403).json({
                status: false,
                message: `Permission denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.admin?.role || 'none'}.`,
            });
        }
        next();
    };
};

module.exports = { adminAuth, requireRoles };
