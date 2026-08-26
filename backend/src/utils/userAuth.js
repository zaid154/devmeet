const jwt = require('jsonwebtoken');
const userModel = require('./../modal/user');
require('dotenv').config();

const userAuth = async (req, res, next) => {
    try {
        let token = req?.cookies?.token;
        if (!token && req.headers.authorization) {
            token = req.headers.authorization.replace('Bearer ', '');
        }

        if (!token) {
            return res.status(200).json({
                status: false,
                unauthenticated: true,
                message: "Authentication required. Please log in.",
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
                message: "Invalid or expired session.",
            });
        }

        if (!decodeToken || !decodeToken.userId) {
            return res.status(200).json({
                status: false,
                unauthenticated: true,
                message: "Invalid or expired session. Please log in again.",
            });
        }

        const userExist = await userModel.findById(decodeToken.userId);

        if (!userExist) {
            return res.status(200).json({
                status: false,
                unauthenticated: true,
                message: "User account not found.",
            });
        }

        // Check account restriction / moderation status
        if (userExist.accountStatus === 'banned') {
            return res.status(403).json({
                status: false,
                accountStatus: 'banned',
                message: `Your account has been permanently banned. Reason: ${userExist.statusReason || 'Violation of Community Guidelines'}.`,
            });
        }

        if (userExist.accountStatus === 'suspended') {
            return res.status(403).json({
                status: false,
                accountStatus: 'suspended',
                message: `Your account is temporarily suspended. Reason: ${userExist.statusReason || 'Under administrative review'}.`,
            });
        }

        if (userExist.accountStatus === 'deleted') {
            return res.status(403).json({
                status: false,
                accountStatus: 'deleted',
                message: "This account has been deleted.",
            });
        }

        req.user = userExist;
        req.userId = userExist._id;
        next();

    } catch (err) {
        return res.status(401).json({
            status: false,
            message: "Authentication error: " + err.message,
        });
    }
};

module.exports = userAuth;