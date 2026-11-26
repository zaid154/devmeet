const jwt = require('jsonwebtoken');
const userModel = require('./../modal/user');
const { getJwtSecret, extractToken } = require('./securityMiddleware');

const userAuth = async (req, res, next) => {
    try {
        const token = extractToken(req, false);

        if (!token) {
            return res.status(200).json({
                status: false,
                unauthenticated: true,
                message: "Authentication required. Please log in.",
            });
        }

        const secret = getJwtSecret();
        let decodeToken;
        try {
            decodeToken = jwt.verify(token, secret, { algorithms: ['HS256'] });
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

        const userExist = await userModel
            .findById(decodeToken.userId)
            .select('-password -resetPasswordToken -resetPasswordExpires');

        if (!userExist) {
            return res.status(200).json({
                status: false,
                unauthenticated: true,
                message: "User account not found.",
            });
        }

        if (userExist.passwordChangedAt && decodeToken.iat) {
            const changedTimestamp = Math.floor(userExist.passwordChangedAt.getTime() / 1000);
            if (decodeToken.iat < changedTimestamp) {
                return res.status(200).json({
                    status: false,
                    unauthenticated: true,
                    message: "Password was changed. Please log in again.",
                });
            }
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
