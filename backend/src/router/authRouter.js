const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const userModel = require('../modal/user');
const { validateUser } = require('../utils/validation');
const { sendEmail } = require('../utils/emailService');

// Temporary in-memory OTP store for phone / email login
const otpCache = new Map();


// =========================================================================
// 1. USER LOGIN API
// Kaam: User ke email aur password ko verify karke login karta hai aur token deta hai.
// Kab use hota hai: Jab normal user login page par email & password enter karta hai.
// =========================================================================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).send({
                status: false,
                message: "Email and password are required"
            });
        }

        // Database me email search karo
        const user = await userModel.findOne({ email: email.trim().toLowerCase() });
        if (!user) {
            return res.status(400).send({
                status: false,
                message: "Invalid Credentials"
            });
        }

        // Password verify karo
        const isPasswordCorrect = await user.validatePassword(password);
        if (!isPasswordCorrect) {
            return res.status(400).send({
                status: false,
                message: "Invalid Credentials"
            });
        }

        // Account status check karo (Banned ya Suspended toh nahi hai)
        if (user.accountStatus === 'banned') {
            return res.status(403).send({
                status: false,
                accountStatus: 'banned',
                message: `Account is banned: ${user.statusReason || 'Violation of community guidelines'}`
            });
        }

        if (user.accountStatus === 'suspended') {
            return res.status(403).send({
                status: false,
                accountStatus: 'suspended',
                message: `Account is suspended: ${user.statusReason || 'Under administrative review'}`
            });
        }

        // JWT token generate karo
        const token = await user.getToken();

        // Cookie me token set karo
        res.cookie('token', token, { httpOnly: false, sameSite: 'lax' });

        res.send({
            status: true,
            message: "Login Successful",
            token: token,
            data: user
        });
    } catch (error) {
        console.log("Login error:", error.message);
        res.status(500).send({
            status: false,
            message: error.message || "Internal server error"
        });
    }
});


// =========================================================================
// 2. ADMIN LOGIN API
// Kaam: Staff/Admin users ko verify karta hai aur administrative access check karta hai.
// Kab use hota hai: Jab staff member ya admin /admin/login page par login karta hai.
// =========================================================================
router.post('/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).send({
                status: false,
                message: "Admin email and password are required"
            });
        }

        const adminUser = await userModel.findOne({ email: email.trim().toLowerCase() });
        if (!adminUser) {
            return res.status(400).send({
                status: false,
                message: "Invalid Admin Credentials"
            });
        }

        // Check if user has staff role
        const staffRoles = ['moderator', 'support', 'admin', 'super-admin'];
        if (!staffRoles.includes(adminUser.role)) {
            return res.status(403).send({
                status: false,
                message: "Access Denied: You do not have administrative privileges."
            });
        }

        if (adminUser.accountStatus !== 'active') {
            return res.status(403).send({
                status: false,
                message: "Access Denied: Staff account is suspended or inactive."
            });
        }

        const isPasswordCorrect = await adminUser.validatePassword(password);
        if (!isPasswordCorrect) {
            return res.status(400).send({
                status: false,
                message: "Invalid Admin Credentials"
            });
        }

        const token = await adminUser.getToken();

        res.cookie('token', token, { httpOnly: false, sameSite: 'lax' });
        res.cookie('adminToken', token, { httpOnly: false, sameSite: 'lax' });

        res.send({
            status: true,
            message: `Admin Login Successful (${adminUser.role})`,
            token: token,
            data: adminUser
        });
    } catch (error) {
        console.log("Admin login error:", error.message);
        res.status(500).send({
            status: false,
            message: error.message || "Internal server error"
        });
    }
});


// =========================================================================
// 3. USER REGISTRATION API
// Kaam: Naya user create karta hai with hashed password.
// Kab use hota hai: Jab naya user signup form fill karta hai.
// =========================================================================
router.post('/user', async (req, res) => {
    try {
        validateUser(req);

        const { firstName, lastName, email, password, gender, age, profileImage, phone, job, location, bio, skills, interests } = req.body;

        const existingEmail = await userModel.findOne({ email: email.toLowerCase().trim() });
        if (existingEmail) {
            return res.status(400).send({
                status: false,
                message: "Email is already registered. Please login instead."
            });
        }

        const saltRounds = Number(process.env.SALT_ROUND) || 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = new userModel({
            firstName,
            lastName,
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            age,
            gender,
            phone: phone || '',
            job: job || '',
            location: location || '',
            bio: bio || '',
            skills: skills || [],
            interests: interests || [],
            profileImage: profileImage || '',
            photos: profileImage ? [profileImage] : []
        });

        await newUser.save();

        const token = await newUser.getToken();
        res.cookie('token', token, { httpOnly: false, sameSite: 'lax' });

        res.send({
            status: true,
            message: "User registered successfully! 🎉",
            token: token,
            data: newUser
        });
    } catch (error) {
        res.status(400).send({
            status: false,
            message: error.message
        });
    }
});


// =========================================================================
// 4. USER LOGOUT API
// Kaam: Browser cookie se token clear karta hai.
// Kab use hota hai: Jab user ya admin Logout button par click karta hai.
// =========================================================================
router.patch('/logout', (req, res) => {
    res.cookie('token', null, { expires: new Date(Date.now()) });
    res.cookie('adminToken', null, { expires: new Date(Date.now()) });

    res.send({
        status: true,
        message: "Logged out successfully"
    });
});


// =========================================================================
// 5. FORGOT PASSWORD API (Email Reset Link)
// Kaam: Password reset token generate karke user ke email par link bhejta hai.
// Kab use hota hai: Jab user 'Forgot Password' par apna email enter karta hai.
// =========================================================================
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).send({
                status: false,
                message: "Email is required"
            });
        }

        const user = await userModel.findOne({ email: email.trim().toLowerCase() });
        if (!user) {
            return res.status(404).send({
                status: false,
                message: "No user found with this email address"
            });
        }

        // Generate 32-byte crypto token
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour validity
        await user.save();

        // Nodemailer send reset email
        try {
            const frontendUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
            const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

            await sendEmail({
                to: user.email,
                subject: 'Reset your DevMeet password',
                text: `Hi ${user.firstName}, you requested to reset your password. Click here: ${resetUrl}. This link expires in 1 hour.`,
                html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 20px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:460px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#c8102e 0%,#ff4458 100%);padding:32px 24px;text-align:center;">
<h1 style="margin:0;font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">dev<span style="opacity:0.85;">meet</span></h1>
<p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.8);font-weight:500;letter-spacing:0.5px;">PASSWORD RESET</p>
</td></tr>

<!-- Body -->
<tr><td style="padding:36px 32px 20px;">
<p style="margin:0 0 6px;font-size:15px;color:#333;font-weight:600;">Hi ${user.firstName}! 👋</p>
<p style="margin:0 0 28px;font-size:14px;color:#666;line-height:1.6;">We received a request to reset your DevMeet account password. Click the button below to set a new password.</p>

<!-- Reset Button -->
<div style="text-align:center;margin:0 0 28px;">
<a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#c8102e,#ff4458);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:30px;font-weight:700;font-size:14px;letter-spacing:0.3px;">Reset Password</a>
</div>

<div style="background:#f0f9ff;border-left:4px solid #3b82f6;border-radius:0 8px 8px 0;padding:12px 16px;margin:0 0 24px;">
<p style="margin:0;font-size:12px;color:#1e40af;line-height:1.5;">🔗 If the button doesn't work, copy and paste this URL in your browser:<br><span style="word-break:break-all;color:#3b82f6;">${resetUrl}</span></p>
</div>

<div style="background:#fff8f0;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:12px 16px;margin:0 0 24px;">
<p style="margin:0;font-size:12px;color:#92400e;line-height:1.5;">⚠️ This link will expire in <strong>1 hour</strong>. If you didn't request this, please ignore this email — your password will remain unchanged.</p>
</div>
</td></tr>

<!-- Footer -->
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
</html>`
            });
        } catch (emailErr) {
            console.log("Email send warning:", emailErr.message);
        }

        res.send({
            status: true,
            message: "Password reset link sent to your email!",
            resetToken: resetToken
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});


// =========================================================================
// 6. RESET PASSWORD API
// Kaam: Token verify karke naya password set karta hai.
// Kab use hota hai: Jab user reset link par click karke naya password submit karta hai.
// =========================================================================
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(400).send({
                status: false,
                message: "Token and new password are required"
            });
        }

        const user = await userModel.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).send({
                status: false,
                message: "Password reset token is invalid or has expired"
            });
        }

        const saltRounds = Number(process.env.SALT_ROUND) || 10;
        user.password = await bcrypt.hash(newPassword, saltRounds);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.send({
            status: true,
            message: "Password reset successfully! You can now login with your new password."
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});


// =========================================================================
// 7. SEND OTP API (Email OTP via Nodemailer)
// Kaam: 6-digit OTP passcode generate karta hai aur user ke email par send karta hai.
// Kab use hota hai: Modal me login ke time OTP generate karne ke liye.
// =========================================================================
router.post('/send-otp', async (req, res) => {
    try {
        const { identifier } = req.body || {};
        if (!identifier) {
            return res.status(400).send({
                status: false,
                message: "Email address is required"
            });
        }

        const cleanIdentifier = identifier.toString().trim().toLowerCase();

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        otpCache.set(cleanIdentifier, {
            otp: otp,
            expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
        });

        console.log(`[AUTH OTP] Verification OTP for ${cleanIdentifier}: ${otp}`);

        // Send real email via Nodemailer
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

<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#c8102e 0%,#ff4458 100%);padding:32px 24px;text-align:center;">
<h1 style="margin:0;font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">dev<span style="opacity:0.85;">meet</span></h1>
<p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.8);font-weight:500;letter-spacing:0.5px;">VERIFICATION CODE</p>
</td></tr>

<!-- Body -->
<tr><td style="padding:36px 32px 20px;">
<p style="margin:0 0 6px;font-size:15px;color:#333;font-weight:600;">Hi there! 👋</p>
<p style="margin:0 0 28px;font-size:14px;color:#666;line-height:1.6;">Use the verification code below to complete your sign-in to DevMeet.</p>

<!-- OTP Box -->
<div style="background:#f8f9fb;border:2px dashed #e0e3e8;border-radius:14px;padding:24px;text-align:center;margin:0 0 28px;">
<p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:2px;">Your 6-Digit Code</p>
<div style="font-size:36px;font-weight:900;letter-spacing:10px;color:#c8102e;font-family:'Courier New',monospace;">${otp}</div>
<p style="margin:12px 0 0;font-size:12px;color:#aaa;">Expires in 10 minutes</p>
</div>

<div style="background:#fff8f0;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:12px 16px;margin:0 0 24px;">
<p style="margin:0;font-size:12px;color:#92400e;line-height:1.5;">⚠️ <strong>Security tip:</strong> Never share this code with anyone. DevMeet will never ask for your code via call or message.</p>
</div>

<p style="margin:0;font-size:13px;color:#999;line-height:1.5;">If you didn't request this code, you can safely ignore this email. Someone may have entered your email by mistake.</p>
</td></tr>

<!-- Footer -->
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
</html>`
                });
                emailSent = result && result.success;
                if (emailSent) {
                    console.log(`[AUTH OTP] Email successfully sent to ${cleanIdentifier}`);
                } else {
                    console.error(`[AUTH OTP] Email send returned failure for ${cleanIdentifier}`);
                }
            } catch (mailErr) {
                console.error(`[AUTH OTP] Nodemailer send error:`, mailErr.message);
            }
        }

        res.send({
            status: true,
            emailSent: emailSent,
            message: emailSent
                ? `Verification passcode sent to ${cleanIdentifier}`
                : `OTP generated for ${cleanIdentifier}. Check your email (may take a moment).`,
            expiresInSeconds: 600
        });
    } catch (error) {
        console.error('[AUTH OTP] Route error:', error.message);
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});


// =========================================================================
// 8. VERIFY OTP API
// Kaam: User ka enter kiya hua OTP verify karke existing user login ya naya user flow trigger karta hai.
// Kab use hota hai: Jab user 6-digit OTP submit karta hai.
// =========================================================================
router.post('/verify-otp', async (req, res) => {
    try {
        const { identifier, otp } = req.body || {};
        if (!identifier || !otp) {
            return res.status(400).send({
                status: false,
                message: "Identifier and OTP passcode are required"
            });
        }

        const cleanIdentifier = identifier.toString().trim();
        const cleanOtp = otp.toString().trim();

        const cached = otpCache.get(cleanIdentifier);
        const isValidOtp = (cached && cached.otp === cleanOtp && cached.expiresAt > Date.now());

        if (!isValidOtp) {
            return res.status(400).send({
                status: false,
                message: "Invalid or expired passcode. Please try again."
            });
        }

        // Check if user already exists
        const existingUser = await userModel.findOne({
            $or: [
                { email: cleanIdentifier.toLowerCase() },
                { phone: cleanIdentifier }
            ]
        });

        if (existingUser) {
            const token = await existingUser.getToken();
            res.cookie('token', token, { httpOnly: false, sameSite: 'lax' });

            return res.send({
                status: true,
                isNewUser: false,
                message: "Welcome back! Login successful.",
                token: token,
                data: existingUser
            });
        }

        // New user - prompt onboarding
        res.send({
            status: true,
            isNewUser: true,
            message: "Passcode verified! Please complete your profile onboarding.",
            identifier: cleanIdentifier
        });
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
});


// =========================================================================
// 9. ONBOARDING API
// Kaam: First-time user ka complete profile setup karke account create karta hai.
// Kab use hota hai: Naya user OTP verify karne ke baad jab details fill karta hai.
// =========================================================================
router.post('/onboarding', async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            password,
            gender,
            age,
            phone,
            job,
            location,
            bio,
            interests,
            skills,
            photos,
            profileImage,
            relationshipGoal
        } = req.body;

        if (!firstName || !email) {
            return res.status(400).send({
                status: false,
                message: "First name and email are required"
            });
        }

        const allPhotos = Array.isArray(photos) && photos.length ? photos : profileImage ? [profileImage] : [];
        const mainImage = profileImage || allPhotos[0] || '';

        let targetUser = await userModel.findOne({ email: email.toLowerCase().trim() });
        if (targetUser) {
            targetUser.firstName = firstName.trim();
            if (lastName) targetUser.lastName = lastName.trim();
            if (gender) targetUser.gender = gender;
            if (age) targetUser.age = Number(age);
            if (phone) targetUser.phone = phone.trim();
            if (allPhotos.length) targetUser.photos = allPhotos;
            if (mainImage) targetUser.profileImage = mainImage;
            if (relationshipGoal) targetUser.relationshipGoal = relationshipGoal;
            if (interests && Array.isArray(interests)) targetUser.interests = interests;
            if (skills && Array.isArray(skills)) targetUser.skills = skills;
            await targetUser.save();
        } else {
            const rawPassword = password || `Pass@${Math.floor(1000 + Math.random() * 9000)}`;
            const hashedPassword = await bcrypt.hash(rawPassword, 10);

            targetUser = await userModel.create({
                firstName: firstName.trim(),
                lastName: lastName ? lastName.trim() : '',
                email: email.toLowerCase().trim(),
                password: hashedPassword,
                gender: gender || 'male',
                age: Number(age) || 24,
                phone: phone ? phone.trim() : '',
                job: job || 'Software Engineer',
                location: location || 'India',
                bio: bio || 'Excited to connect on DevMeet!',
                interests: Array.isArray(interests) && interests.length ? interests : ['Coding', 'Tech'],
                skills: Array.isArray(skills) && skills.length ? skills : ['JavaScript'],
                photos: allPhotos,
                profileImage: mainImage,
                relationshipGoal: relationshipGoal || 'long-term',
                accountStatus: 'active',
                isVerified: false,
                verificationStatus: 'none'
            });
        }

        const token = await targetUser.getToken();
        res.cookie('token', token, { httpOnly: false, sameSite: 'lax' });

        res.send({
            status: true,
            message: "Onboarding completed successfully! 🎉",
            token: token,
            data: targetUser
        });
    } catch (error) {
        console.error('Onboarding error:', error);
        res.status(500).send({
            status: false,
            message: error.message || "Failed to complete onboarding"
        });
    }
});

module.exports = router;