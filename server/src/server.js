const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const compression = require('compression');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();

const dbConnect = require('./config/database');
const userModel = require('./modal/user');
const connectionModel = require('./modal/connection');
const blockModel = require('./modal/block');
const {
    getJwtSecret,
    sanitizeInput,
    parseCookieHeader,
    isValidObjectId,
    authLimiter,
    otpLimiter,
    uploadLimiter,
    apiLimiter,
} = require('./utils/securityMiddleware');

// Routers
const authRouter = require('./router/authRouter');
const profileRouter = require('./router/profileRouter');
const requestRouter = require('./router/request');
const chatRouter = require('./router/chatRouter');
const notificationRouter = require('./router/notificationRouter');
const blockRouter = require('./router/blockRouter');
const reportRouter = require('./router/reportRouter');
const adminRouter = require('./router/adminRouter');
const announcementRouter = require('./router/announcementRouter');
const uploadRouter = require('./router/uploadRouter');
const adminMediaRouter = require('./router/adminMediaRouter');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust reverse proxy (Render / Cloudflare) for accurate rate limiting IP
app.set('trust proxy', 1);

const defaultOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'https://devmeet-pro.vercel.app',
];
const envOrigins = (process.env.FRONTEND_URL || process.env.CORS_ORIGIN || process.env.CLIENT_URL || '')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);

const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        const cleanOrigin = origin.replace(/\/$/, '');
        const isLocal = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin);
        const isVercelPreview = cleanOrigin.endsWith('.vercel.app') && cleanOrigin.startsWith('https://');
        if (allowedOrigins.includes(cleanOrigin) || isLocal || isVercelPreview) {
            return callback(null, true);
        }
        return callback(new Error(`CORS policy violation: Origin ${origin} not allowed`));
    },
    credentials: true,
};

app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(sanitizeInput);

// Apply rate limiters to sensitive auth, OTP, upload & general API routes
app.use('/login', authLimiter);
app.use('/admin/login', authLimiter);
app.use('/user', authLimiter);
app.use('/forgot-password', otpLimiter);
app.use('/reset-password', authLimiter);
app.use('/send-otp', otpLimiter);
app.use('/verify-otp', otpLimiter);
app.use('/onboarding', authLimiter);
app.use('/upload', uploadLimiter);
app.use('/api/upload', uploadLimiter);
app.use(apiLimiter);

// Serve uploaded files safely without sniffing
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
    maxAge: '7d',
    etag: true,
    setHeaders: (res) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
    }
}));

// Health check routes
app.get('/', (_req, res) => {
    res.json({ status: 'ok', service: 'devmeet-server', uptime: Math.round(process.uptime()) });
});

app.get('/health', (_req, res) => {
    const mongoose = require('mongoose');
    res.json({ status: 'ok', service: 'devmeet-server', dbState: mongoose.connection.readyState });
});

// Mount routes
app.use('/', authRouter);
app.use('/', profileRouter);
app.use('/', requestRouter);
app.use('/', chatRouter);
app.use('/chat', chatRouter);
app.use('/', notificationRouter);
app.use('/', blockRouter);
app.use('/', reportRouter);
app.use('/', announcementRouter);
app.use('/admin', adminRouter);
app.use('/admin/media', adminMediaRouter);
app.use('/api/admin/media', adminMediaRouter);
app.use('/upload', uploadRouter);
app.use('/api/upload', uploadRouter);

// Unified error handler (CORS, Multer size/type errors, JSON syntax errors)
app.use((err, _req, res, _next) => {
    const status = err.status || (err.message?.includes('CORS') ? 403 : 400);
    res.status(status).json({
        status: false,
        success: false,
        message: err.message || 'Request failed',
    });
});

// Create HTTP server for Socket.IO
const server = http.createServer(app);

// Socket.IO setup with mandatory JWT authentication
const io = new Server(server, {
    cors: corsOptions,
});

io.use(async (socket, next) => {
    try {
        const cookies = parseCookieHeader(socket.handshake.headers?.cookie);
        const token = socket.handshake.auth?.token || cookies.token || cookies.adminToken;
        if (!token || typeof token !== 'string') {
            return next(new Error('Authentication required'));
        }
        const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });
        if (!decoded?.userId || !isValidObjectId(decoded.userId)) {
            return next(new Error('Invalid session'));
        }
        const userExist = await userModel
            .findById(decoded.userId)
            .select('_id accountStatus passwordChangedAt');
        if (!userExist || userExist.accountStatus !== 'active') {
            return next(new Error('Account unavailable'));
        }
        if (userExist.passwordChangedAt && decoded.iat) {
            const changedTs = Math.floor(userExist.passwordChangedAt.getTime() / 1000);
            if (decoded.iat < changedTs) {
                return next(new Error('Session expired'));
            }
        }
        socket.userId = userExist._id.toString();
        next();
    } catch (_err) {
        next(new Error('Authentication failed'));
    }
});

// Track active user sockets: userId -> Set of socketIds
const activeUserSockets = new Map();

async function canUsersInteract(userA, userB) {
    if (!isValidObjectId(userA) || !isValidObjectId(userB) || userA === userB) return false;
    const blocked = await blockModel.findOne({
        $or: [
            { blockerId: userA, blockedId: userB },
            { blockerId: userB, blockedId: userA },
        ],
    }).lean();
    if (blocked) return false;

    const matched = await connectionModel.findOne({
        status: 'accepted',
        $or: [
            { fromUserId: userA, toUserId: userB },
            { fromUserId: userB, toUserId: userA },
        ],
    }).lean();
    return Boolean(matched);
}

io.on('connection', (socket) => {
    const uid = socket.userId;
    socket.join(uid);

    if (!activeUserSockets.has(uid)) {
        activeUserSockets.set(uid, new Set());
    }
    activeUserSockets.get(uid).add(socket.id);
    io.emit('user-online', { userId: uid, isOnline: true });

    // Only allow joining authenticated user's own room
    socket.on('join', () => {
        socket.join(uid);
    });

    socket.on('send-message', async (data) => {
        const receiverId = data?.receiverId?.toString();
        if (!receiverId || !(await canUsersInteract(uid, receiverId))) return;
        io.to(receiverId).emit('new-message', data.message);
    });

    socket.on('typing', async (data) => {
        const receiverId = data?.receiverId?.toString();
        if (!receiverId || !(await canUsersInteract(uid, receiverId))) return;
        io.to(receiverId).emit('user-typing', { senderId: uid, isTyping: Boolean(data?.isTyping) });
    });

    socket.on('call-offer', async (data) => {
        const targetId = data?.targetUserId?.toString();
        if (!targetId || !(await canUsersInteract(uid, targetId))) return;
        io.to(targetId).emit('incoming-call', {
            offer: data.offer,
            callerInfo: data.callerInfo,
            callType: data.callType,
            callerId: uid,
        });
    });

    socket.on('call-answer', async (data) => {
        const targetId = data?.targetUserId?.toString();
        if (!targetId || !(await canUsersInteract(uid, targetId))) return;
        io.to(targetId).emit('call-answered', { answer: data.answer });
    });

    socket.on('ice-candidate', async (data) => {
        const targetId = data?.targetUserId?.toString();
        if (!targetId || !(await canUsersInteract(uid, targetId))) return;
        io.to(targetId).emit('ice-candidate', { candidate: data.candidate });
    });

    socket.on('call-reject', (data) => {
        const targetId = data?.targetUserId?.toString();
        if (targetId && isValidObjectId(targetId)) {
            io.to(targetId).emit('call-rejected', { userId: uid });
        }
    });

    socket.on('call-end', (data) => {
        const targetId = data?.targetUserId?.toString();
        if (targetId && isValidObjectId(targetId)) {
            io.to(targetId).emit('call-ended', { userId: uid });
        }
    });

    socket.on('new-match', async (data) => {
        const targetId = data?.targetUserId?.toString();
        if (!targetId || !(await canUsersInteract(uid, targetId))) return;
        io.to(targetId).emit('match-notification', data.matchData);
    });

    socket.on('check-online', (userIds) => {
        if (!Array.isArray(userIds)) return;
        const statuses = {};
        userIds.slice(0, 100).forEach((id) => {
            const target = id ? id.toString() : '';
            statuses[target] = activeUserSockets.has(target) && activeUserSockets.get(target).size > 0;
        });
        socket.emit('online-statuses', statuses);
    });

    socket.on('disconnect', () => {
        if (activeUserSockets.has(uid)) {
            activeUserSockets.get(uid).delete(socket.id);
            if (activeUserSockets.get(uid).size === 0) {
                activeUserSockets.delete(uid);
                io.emit('user-online', { userId: uid, isOnline: false });
            }
        }
    });
});

// Make io accessible to routes
app.set('io', io);
app.set('onlineUsers', activeUserSockets);

// Fail fast at boot if JWT secret is missing from environment
getJwtSecret();

dbConnect()
    .then(() => {
        console.log('Connection Established successfully');
        server.listen(PORT, '0.0.0.0', () => {
            console.log(`Server is running on 0.0.0.0:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Connection not created:', err.message);
        if (!process.env.MONGO_URI) {
            process.exit(1);
        }
        server.listen(PORT, '0.0.0.0', () => {
            console.log(`Server started on 0.0.0.0:${PORT} (DB connection pending)`);
        });
    });
