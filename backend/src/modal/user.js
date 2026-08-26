const mongoose = require('mongoose')
const { Schema, model } = mongoose
const validator = require('validator');
require('dotenv').config()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt');

const userSchema = new Schema({
    firstName: {
        type: String,
        minLength: 2,
        maxLength: 50,
        trim: true
    },
    lastName: {
        type: String,
        maxLength: 50,
        trim: true,
        default: ''
    },
    email: {
        type: String,
        lowercase: true,
        trim: true,
        validate: {
            validator: function (value) {
                if (value && !validator.isEmail(value)) {
                    throw new Error("Please provide correct email")
                }
            }
        }
    },
    password: {
        type: String
    },
    gender: {
        type: String,
        enum: ["male", "female", "other", "man", "woman"],
        default: "male"
    },
    age: {
        type: Number,
        min: 18,
        max: 99,
        default: 24
    },
    phone: {
        type: String,
        trim: true,
        default: ''
    },
    profileImage: {
        type: String,
        validate: {
            validator: function (value) {
                if (value && !value.startsWith('/') && !value.startsWith('data:') && !validator.isURL(value)) {
                    throw new Error("Please provide correct image url")
                }
            }
        }
    },
    // Dating profile fields
    bio: {
        type: String,
        maxLength: 500,
        trim: true,
        default: ''
    },
    photos: [{
        type: String,
        validate: {
            validator: function (value) {
                if (value && !value.startsWith('/') && !value.startsWith('data:') && !validator.isURL(value)) {
                    throw new Error("Please provide correct photo url")
                }
            }
        }
    }],
    interests: [{
        type: String,
        trim: true
    }],
    skills: [{
        type: String,
        trim: true
    }],
    relationshipGoal: {
        type: String,
        enum: ["long-term", "long-term-open", "short-term", "short-term-open", "new-friends", "figuring-out", ""],
        default: ""
    },
    lookingFor: {
        type: String,
        enum: ["male", "female", "everyone", ""],
        default: ""
    },
    location: {
        type: String,
        trim: true,
        default: ''
    },
    education: {
        type: String,
        trim: true,
        default: ''
    },
    job: {
        type: String,
        trim: true,
        default: ''
    },
    height: {
        type: String,
        trim: true,
        default: ''
    },
    zodiacSign: {
        type: String,
        enum: ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces", ""],
        default: ""
    },
    favoriteArtist: {
        type: String,
        trim: true,
        default: ''
    },
    favoriteSong: {
        type: String,
        trim: true,
        default: ''
    },
    musicGenre: {
        type: String,
        trim: true,
        default: ''
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationStatus: {
        type: String,
        enum: ["none", "pending", "approved", "rejected"],
        default: "none"
    },
    lastSeen: {
        type: Date,
        default: Date.now
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    // Preferences for discover filters
    preferences: {
        ageMin: { type: Number, default: 18, min: 18, max: 60 },
        ageMax: { type: Number, default: 45, min: 18, max: 60 },
        gender: { type: String, enum: ["male", "female", "everyone", ""], default: "everyone" },
        maxDistance: { type: Number, default: 100 },
        location: { type: String, default: '' }
    },
    // Privacy settings
    privacy: {
        showOnlineStatus: { type: Boolean, default: true },
        showLastSeen: { type: Boolean, default: true },
        showProfile: { type: Boolean, default: true }
    },
    // Role-based Access Control
    role: {
        type: String,
        enum: ["user", "moderator", "support", "admin", "super-admin"],
        default: "user"
    },
    // Account Moderation Status
    accountStatus: {
        type: String,
        enum: ["active", "suspended", "banned", "deleted"],
        default: "active"
    },
    statusReason: {
        type: String,
        trim: true,
        default: ''
    },
    // Verification submission details
    verificationDocument: {
        type: String,
        default: ''
    },
    verificationSubmittedAt: {
        type: Date
    },
    // Passport virtual location
    passportCity: {
        type: String,
        trim: true,
        default: ''
    },
    // Password reset
    resetPasswordToken: String,
    resetPasswordExpires: Date
},
    {
        timestamps: true,
        versionKey: false
    })


userSchema.methods.validatePassword = async function (password) {
    const user = this
    const checkPassword = await bcrypt.compare(password, user.password)
    return checkPassword
}

userSchema.methods.getToken = async function () {
    const user = this;
    const secret = process.env.JWT_PVT_KEY || process.env.JWT_SECRET || 'dev_super_secret_change_me_0123456789abcdef';
    const token = await jwt.sign({ userId: user._id }, secret, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
    return token;
};


module.exports = model('user', userSchema)