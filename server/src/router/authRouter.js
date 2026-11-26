const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const userModel = require('../modal/user');
const { validateUser } = require('../utils/validation');
const { sendEmail } = require('../utils/emailService');
const {
    getJwtSecret,
    getCookieOptions,
    escapeHtml,
    extractToken,
} = require('../utils/securityMiddleware');

// Temporary in-memory OTP store: identifier -> { otp, expiresAt, attempts }
const otpCache = new Map();
const MAX_OTP_ATTEMPTS = 5;

function sha256(val) {
    return crypto.createHash('sha256').update(String(val)).digest('hex');
}

// =========================================================================
// 1. USER LOGIN API
// =========================================================================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body || {};

        if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
            return res.status(400).send({
                status: false,
                message: 'Email and password are required',
            });
        }

        const user = await userModel.findOne({ email: email.trim().toLowerCase() });
        if (!user || !(await user.validatePassword(password))) {
            return res.status(400).send({
                status: false,
                message: 'Invalid Credentials',
            });
        }

        if (user.accountStatus === 'banned') {
            return res.status(403).send({
                status: false,
                accountStatus: 'banned',
                message: `Account is banned: ${user.statusReason || 'Violation of community guidelines'}`,
            });
        }

        if (user.accountStatus === 'suspended') {
            return res.status(403).send({
                status: false,
                accountStatus: 'suspended',
                message: `Account is suspended: ${user.statusReason || 'Under administrative review'}`,
            });
        }

        if (user.accountStatus === 'deleted') {
            return res.status(403).send({
                status: false,
                accountStatus: 'deleted',
                message: 'This account has been deleted.',
            });
        }

        const token = await user.getToken();
        res.cookie('token', token, getCookieOptions(false));

        res.send({
            status: true,
            message: 'Login Successful',
            token,
            data: user,
        });
    } catch (error) {
        console.log('Login error:', error.message);
        res.status(500).send({
            status: false,
            message: error.message || 'Internal server error',
        });
    }
});

// =========================================================================
// 2. ADMIN LOGIN API
// =========================================================================
router.post('/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body || {};

        if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
            return res.status(400).send({
                status: false,
                message: 'Admin email and password are required',
            });
        }

        const adminUser = await userModel.findOne({ email: email.trim().toLowerCase() });
        if (!adminUser) {
            return res.status(400).send({
                status: false,
                message: 'Invalid Admin Credentials',
            });
        }

        const staffRoles = ['moderator', 'support', 'admin', 'super-admin'];
        if (!staffRoles.includes(adminUser.role)) {
            return res.status(403).send({
                status: false,
                message: 'Access Denied: You do not have administrative privileges.',
            });
        }

        if (adminUser.accountStatus !== 'active') {
            return res.status(403).send({
                status: false,
                message: 'Access Denied: Staff account is suspended or inactive.',
            });
        }

        const isPasswordCorrect = await adminUser.validatePassword(password);
        if (!isPasswordCorrect) {
            return res.status(400).send({
                status: false,
                message: 'Invalid Admin Credentials',
            });
        }

        const token = await adminUser.getToken();
        const cookieOpts = getCookieOptions(false);
        res.cookie('token', token, cookieOpts);
        res.cookie('adminToken', token, cookieOpts);

        res.send({
            status: true,
            message: `Admin Login Successful (${adminUser.role})`,
            token,
            data: adminUser,
        });
    } catch (error) {
        console.log('Admin login error:', error.message);
        res.status(500).send({
            status: false,
            message: error.message || 'Internal server error',
        });
    }
});

// =========================================================================
// 3. USER REGISTRATION API
// =========================================================================
router.post('/user', async (req, res) => {
    try {
        validateUser(req);

        const {
            firstName,
            lastName,
            email,
            password,
            gender,
            interestedIn,
            lookingFor,
            age,
            profileImage,
            phone,
            job,
            location,
            bio,
            skills,
            interests,
        } = req.body;

        if (typeof password !== 'string' || password.length < 6) {
            return res.status(400).send({
                status: false,
                message: 'Password must be at least 6 characters',
            });
        }

        const normalizedEmail = email.toString().toLowerCase().trim();
        const existingEmail = await userModel.findOne({ email: normalizedEmail });
        if (existingEmail) {
            return res.status(400).send({
                status: false,
                message: 'Email is already registered. Please login instead.',
            });
        }

        const saltRounds = Number(process.env.SALT_ROUND) || 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const targetInterest = ['male', 'female', 'everyone'].includes(interestedIn || lookingFor)
            ? (interestedIn || lookingFor)
            : 'everyone';

        const newUser = new userModel({
            firstName: String(firstName).trim(),
            lastName: lastName ? String(lastName).trim() : '',
            email: normalizedEmail,
            password: hashedPassword,
            age: age !== undefined ? Number(age) : 24,
            gender: ['male', 'female', 'other'].includes(gender) ? gender : 'male',
            interestedIn: targetInterest,
            lookingFor: targetInterest,
            preferences: {
                gender: targetInterest,
                ageMin: 18,
                ageMax: 50,
            },
            phone: typeof phone === 'string' ? phone.trim() : '',
            job: typeof job === 'string' ? job.trim() : '',
            location: typeof location === 'string' ? location.trim() : '',
            bio: typeof bio === 'string' ? bio.trim() : '',
            skills: Array.isArray(skills) ? skills.filter((s) => typeof s === 'string').slice(0, 20) : [],
            interests: Array.isArray(interests) ? interests.filter((s) => typeof s === 'string').slice(0, 20) : [],
            profileImage: typeof profileImage === 'string' ? profileImage.trim() : '',
            photos: typeof profileImage === 'string' && profileImage.trim() ? [profileImage.trim()] : [],
            role: 'user',
            accountStatus: 'active',
            isVerified: false,
            verificationStatus: 'none',
        });

        await newUser.save();

        const token = await newUser.getToken();
        res.cookie('token', token, getCookieOptions(false));

        res.send({
            status: true,
            message: 'User registered successfully! 🎉',
            token,
            data: newUser,
        });
    } catch (error) {
        res.status(400).send({
            status: false,
            message: error.message,
        });
    }
});

// =========================================================================
// 4. USER LOGOUT API
// =========================================================================
router.patch('/logout', (_req, res) => {
    const clearOpts = getCookieOptions(true);
    res.cookie('token', '', clearOpts);
    res.cookie('adminToken', '', clearOpts);

    res.send({
        status: true,
        message: 'Logged out successfully',
    });
});

// =========================================================================
// 5. FORGOT PASSWORD API (Hashed token stored in DB, never returned in HTTP)
// =========================================================================
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body || {};
        if (typeof email !== 'string' || !email.trim()) {
            return res.status(400).send({
                status: false,
                message: 'Email is required',
            });
        }

        const genericMsg = 'If an account with that email exists, a password reset link has been sent.';
        const user = await userModel.findOne({ email: email.trim().toLowerCase() });
        if (!user) {
            return res.send({
                status: true,
                message: genericMsg,
            });
        }

        // Generate 32-byte crypto token; store only its SHA-256 hash in MongoDB
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = sha256(resetToken);
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour validity
        await user.save();

        try {
            const frontendUrl = (process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173')
                .split(',')[0]
                .trim()
                .replace(/\/$/, '');
            const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
            const safeName = escapeHtml(user.firstName || 'there');

            await sendEmail({
                to: user.email,
                subject: 'Reset your DevMeet password',
                text: `Hi ${user.firstName || 'there'}, you requested to reset your password. Click here: ${resetUrl}. This link expires in 1 hour.`,
                html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 20px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:460px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
<tr><td style="background:linear-gradient(135deg,#c8102e 0%,#ff4458 100%);padding:32px 24px;text-align:center;">
<h1 style="margin:0;font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">Dev<span style="opacity:0.9;">Meet</span></h1>
<p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.8);font-weight:500;letter-spacing:0.5px;">PASSWORD RESET</p>
</td></tr>
<tr><td style="padding:36px 32px 20px;">
<p style="margin:0 0 6px;font-size:15px;color:#333;font-weight:600;">Hi ${safeName},</p>
<p style="margin:0 0 28px;font-size:14px;color:#666;line-height:1.6;">We received a request to reset your DevMeet account password. Click the button below to set a new password.</p>
<div style="text-align:center;margin:0 0 28px;">
<a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#c8102e,#ff4458);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:30px;font-weight:700;font-size:14px;letter-spacing:0.3px;">Reset Password</a>
</div>
<div style="background:#fff8f0;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:12px 16px;margin:0 0 24px;">
<p style="margin:0;font-size:12px;color:#92400e;line-height:1.5;">This link will expire in <strong>1 hour</strong>. If you didn't request this, please ignore this email.</p>
</div>
</td></tr>
<tr><td style="padding:20px 32px 28px;border-top:1px solid #f0f0f3;">
<table width="100%" cellpadding="0" cellspacing="0"><tr>
<td style="font-size:11px;color:#bbb;">© 2026 DevMeet</td>
<td align="right" style="font-size:11px;color:#bbb;">Made with ❤️ in India</td>
</tr></table>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`,
            });
        } catch (emailErr) {
            console.log('Email send warning:', emailErr.message);
        }

        res.send({
            status: true,
            message: genericMsg,
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message,
        });
    }
});

// =========================================================================
// 6. RESET PASSWORD API
// =========================================================================
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body || {};
        if (typeof token !== 'string' || typeof newPassword !== 'string' || !token.trim() || !newPassword) {
            return res.status(400).send({
                status: false,
                message: 'Token and new password are required',
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).send({
                status: false,
                message: 'New password must be at least 8 characters long',
            });
        }

        const hashedToken = sha256(token.trim());
        const user = await userModel.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).send({
                status: false,
                message: 'Password reset token is invalid or has expired',
            });
        }

        const saltRounds = Number(process.env.SALT_ROUND) || 10;
        user.password = await bcrypt.hash(newPassword, saltRounds);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        user.passwordChangedAt = new Date();
        await user.save();

        res.send({
            status: true,
            message: 'Password reset successfully! You can now login with your new password.',
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message,
        });
    }
});

// =========================================================================
// 7. SEND OTP API (Cryptographically random + single-use + attempt lockout)
// =========================================================================
router.post('/send-otp', async (req, res) => {
    try {
        const { identifier } = req.body || {};
        if (typeof identifier !== 'string' || !identifier.trim()) {
            return res.status(400).send({
                status: false,
                message: 'Email address is required',
            });
        }

        const cleanIdentifier = identifier.trim().toLowerCase();
        const otp = crypto.randomInt(100000, 1000000).toString();

        otpCache.set(cleanIdentifier, {
            otp,
            expiresAt: Date.now() + 10 * 60 * 1000,
            attempts: 0,
        });

        let emailSent = false;
        if (cleanIdentifier.includes('@')) {
            try {
                const result = await sendEmail({
                    to: cleanIdentifier,
                    subject: `${otp} is your DevMeet verification code`,
                    text: `Your DevMeet verification code is: ${otp}. It expires in 10 minutes. Do not share this code with anyone.`,
                    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 20px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:460px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
<tr><td style="background:linear-gradient(135deg,#c8102e 0%,#ff4458 100%);padding:32px 24px;text-align:center;">
<h1 style="margin:0;font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">Dev<span style="opacity:0.9;">Meet</span></h1>
<p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.8);font-weight:500;letter-spacing:0.5px;">VERIFICATION CODE</p>
</td></tr>
<tr><td style="padding:36px 32px 20px;">
<p style="margin:0 0 6px;font-size:15px;color:#333;font-weight:600;">Hi there!</p>
<p style="margin:0 0 28px;font-size:14px;color:#666;line-height:1.6;">Use the verification code below to complete your sign-in to DevMeet.</p>
<div style="background:#f8f9fb;border:2px dashed #e0e3e8;border-radius:14px;padding:24px;text-align:center;margin:0 0 28px;">
<p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:2px;">Your 6-Digit Code</p>
<div style="font-size:36px;font-weight:900;letter-spacing:10px;color:#c8102e;font-family:'Courier New',monospace;">${otp}</div>
<p style="margin:12px 0 0;font-size:12px;color:#aaa;">Expires in 10 minutes</p>
</div>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`,
                });
                emailSent = Boolean(result && result.success);
            } catch (mailErr) {
                console.error('[AUTH OTP] Send error:', mailErr.message);
            }
        }

        res.send({
            status: true,
            emailSent,
            message: emailSent
                ? `Verification passcode sent to ${cleanIdentifier}`
                : `OTP generated for ${cleanIdentifier}. Check your email (may take a moment).`,
            expiresInSeconds: 600,
        });
    } catch (error) {
        console.error('[AUTH OTP] Route error:', error.message);
        res.status(500).send({
            status: false,
            message: error.message,
        });
    }
});

// =========================================================================
// 8. VERIFY OTP API
// =========================================================================
router.post('/verify-otp', async (req, res) => {
    try {
        const { identifier, otp } = req.body || {};
        if (typeof identifier !== 'string' || typeof otp !== 'string' || !identifier.trim() || !otp.trim()) {
            return res.status(400).send({
                status: false,
                message: 'Identifier and OTP passcode are required',
            });
        }

        const cleanIdentifier = identifier.trim().toLowerCase();
        const cleanOtp = otp.trim();
        const cached = otpCache.get(cleanIdentifier);

        if (!cached || cached.expiresAt <= Date.now()) {
            otpCache.delete(cleanIdentifier);
            return res.status(400).send({
                status: false,
                message: 'Invalid or expired passcode. Please try again.',
            });
        }

        if (cached.attempts >= MAX_OTP_ATTEMPTS) {
            otpCache.delete(cleanIdentifier);
            return res.status(429).send({
                status: false,
                message: 'Too many invalid OTP attempts. Please request a new code.',
            });
        }

        if (cached.otp !== cleanOtp) {
            cached.attempts += 1;
            return res.status(400).send({
                status: false,
                message: 'Invalid or expired passcode. Please try again.',
            });
        }

        // Single-use: consume OTP immediately
        otpCache.delete(cleanIdentifier);

        const existingUser = await userModel.findOne({
            $or: [
                { email: cleanIdentifier },
                { phone: cleanIdentifier },
            ],
        });

        if (existingUser) {
            if (existingUser.accountStatus !== 'active') {
                return res.status(403).send({
                    status: false,
                    message: `Account is ${existingUser.accountStatus}.`,
                });
            }
            const token = await existingUser.getToken();
            res.cookie('token', token, getCookieOptions(false));

            return res.send({
                status: true,
                isNewUser: false,
                message: 'Welcome back! Login successful.',
                token,
                data: existingUser,
            });
        }

        const onboardingToken = jwt.sign(
            { identifier: cleanIdentifier, purpose: 'onboarding' },
            getJwtSecret(),
            { algorithm: 'HS256', expiresIn: '15m' }
        );

        res.send({
            status: true,
            isNewUser: true,
            message: 'Passcode verified! Please complete your profile onboarding.',
            identifier: cleanIdentifier,
            onboardingToken,
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message,
        });
    }
});

// =========================================================================
// 9. ONBOARDING API (Auth required for existing accounts; safe create for new)
// =========================================================================
router.post('/onboarding', async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            password,
            gender,
            interestedIn,
            lookingFor,
            age,
            phone,
            job,
            location,
            bio,
            interests,
            skills,
            photos,
            profileImage,
            relationshipGoal,
        } = req.body || {};

        if (typeof firstName !== 'string' || typeof email !== 'string' || !firstName.trim() || !email.trim()) {
            return res.status(400).send({
                status: false,
                message: 'First name and email are required',
            });
        }

        const cleanEmail = email.trim().toLowerCase();
        const allPhotos = Array.isArray(photos)
            ? photos.filter((p) => typeof p === 'string' && p.trim()).slice(0, 6)
            : typeof profileImage === 'string' && profileImage.trim()
                ? [profileImage.trim()]
                : [];
        const mainImage = (typeof profileImage === 'string' && profileImage.trim()) || allPhotos[0] || '';
        const rawInterest = interestedIn || lookingFor || 'everyone';
        const targetInterest = ['male', 'female', 'everyone', 'men', 'women', 'both', 'all', 'other'].includes(rawInterest)
            ? rawInterest
            : 'everyone';
        const safeGender = ['male', 'female', 'other', 'man', 'woman'].includes(gender) ? gender : 'male';

        let targetUser = await userModel.findOne({ email: cleanEmail });
        if (targetUser) {
            // Prevent unauthenticated account takeover/overwrite of an existing account
            const callerToken = extractToken(req, false);
            if (!callerToken) {
                return res.status(409).send({
                    status: false,
                    message: 'An account with this email already exists. Please log in instead.',
                });
            }
            let decoded;
            try {
                decoded = jwt.verify(callerToken, getJwtSecret(), { algorithms: ['HS256'] });
            } catch {
                return res.status(401).send({
                    status: false,
                    message: 'Invalid or expired session. Please log in again.',
                });
            }
            if (!decoded?.userId || decoded.userId !== targetUser._id.toString()) {
                return res.status(403).send({
                    status: false,
                    message: 'You are not authorized to modify this account.',
                });
            }

            targetUser.firstName = firstName.trim();
            if (typeof lastName === 'string' && lastName.trim()) targetUser.lastName = lastName.trim();
            targetUser.gender = safeGender;
            targetUser.interestedIn = targetInterest;
            targetUser.lookingFor = targetInterest;
            if (!targetUser.preferences) targetUser.preferences = {};
            targetUser.preferences.gender = targetInterest;
            if (age !== undefined && !Number.isNaN(Number(age))) {
                targetUser.age = Math.min(99, Math.max(18, Number(age)));
            }
            if (typeof phone === 'string' && phone.trim()) targetUser.phone = phone.trim();
            if (allPhotos.length) targetUser.photos = allPhotos;
            if (mainImage) targetUser.profileImage = mainImage;
            if (typeof relationshipGoal === 'string' && relationshipGoal) targetUser.relationshipGoal = relationshipGoal;
            if (Array.isArray(interests)) targetUser.interests = interests.filter((i) => typeof i === 'string').slice(0, 20);
            if (Array.isArray(skills)) targetUser.skills = skills.filter((s) => typeof s === 'string').slice(0, 20);
            await targetUser.save();
        } else {
            const rawPassword = typeof password === 'string' && password.length >= 6
                ? password
                : crypto.randomBytes(16).toString('hex');
            const saltRounds = Number(process.env.SALT_ROUND) || 10;
            const hashedPassword = await bcrypt.hash(rawPassword, saltRounds);

            targetUser = await userModel.create({
                firstName: firstName.trim(),
                lastName: typeof lastName === 'string' ? lastName.trim() : '',
                email: cleanEmail,
                password: hashedPassword,
                gender: safeGender,
                interestedIn: targetInterest,
                lookingFor: targetInterest,
                preferences: {
                    gender: targetInterest,
                    ageMin: 18,
                    ageMax: 50,
                },
                age: Math.min(99, Math.max(18, Number(age) || 24)),
                phone: typeof phone === 'string' ? phone.trim() : '',
                job: typeof job === 'string' && job.trim() ? job.trim() : 'Software Engineer',
                location: typeof location === 'string' && location.trim() ? location.trim() : 'India',
                bio: typeof bio === 'string' && bio.trim() ? bio.trim() : 'Excited to connect on DevMeet!',
                interests: Array.isArray(interests) && interests.length
                    ? interests.filter((i) => typeof i === 'string').slice(0, 20)
                    : ['Coding', 'Tech'],
                skills: Array.isArray(skills) && skills.length
                    ? skills.filter((s) => typeof s === 'string').slice(0, 20)
                    : ['JavaScript'],
                photos: allPhotos,
                profileImage: mainImage,
                relationshipGoal: typeof relationshipGoal === 'string' ? relationshipGoal : 'long-term',
                role: 'user',
                accountStatus: 'active',
                isVerified: false,
                verificationStatus: 'none',
            });
        }

        const token = await targetUser.getToken();
        res.cookie('token', token, getCookieOptions(false));

        res.send({
            status: true,
            message: 'Onboarding completed successfully! 🎉',
            token,
            data: targetUser,
        });
    } catch (error) {
        console.error('Onboarding error:', error);
        res.status(500).send({
            status: false,
            message: error.message || 'Failed to complete onboarding',
        });
    }
});

module.exports = router;
