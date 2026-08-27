const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const dbConnect = require('./src/config/database')
const app = express()
const PORT = process.env.PORT || 3000
const mongoose = require('mongoose')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const path = require('path')

// Routers
const authRouter = require('./src/router/authRouter')
const profileRouter = require('./src/router/profileRouter')
const requestRouter = require('./src/router/request')
const chatRouter = require('./src/router/chatRouter')
const notificationRouter = require('./src/router/notificationRouter')
const blockRouter = require('./src/router/blockRouter')
const reportRouter = require('./src/router/reportRouter')
const adminRouter = require('./src/router/adminRouter')
const announcementRouter = require('./src/router/announcementRouter')
const uploadRouter = require('./src/router/uploadRouter')
const adminMediaRouter = require('./src/router/adminMediaRouter')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();

const defaultOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173'];
const envOrigins = (process.env.FRONTEND_URL || process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const allowedOrigins = [...defaultOrigins, ...envOrigins];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com')) {
            callback(null, true);
        } else {
            callback(null, true);
        }
    },
    credentials: true
}

const compression = require('compression')

app.use(compression())
app.use(cors(corsOptions))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))
app.use(cookieParser())

// Serve uploaded files with cache headers
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { maxAge: '7d', etag: true }))

// Mount routes
app.use('/', authRouter)
app.use('/', profileRouter)
app.use('/', requestRouter)
app.use('/', chatRouter)
app.use('/chat', chatRouter)
app.use('/', notificationRouter)
app.use('/', blockRouter)
app.use('/', reportRouter)
app.use('/', announcementRouter)
app.use('/admin', adminRouter)
app.use('/admin/media', adminMediaRouter)
app.use('/api/admin/media', adminMediaRouter)
app.use('/upload', uploadRouter)
app.use('/api/upload', uploadRouter)

// Create HTTP server for Socket.IO
const server = http.createServer(app)

// Socket.IO setup
const io = new Server(server, {
    cors: corsOptions
})

// Track active user sockets: userId -> Set of socketIds
const activeUserSockets = new Map();

io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // User joins with their userId
    socket.on('join', (userId) => {
        if (!userId) return;
        const uid = userId.toString();
        socket.userId = uid;
        socket.join(uid); // Join private room for this user

        if (!activeUserSockets.has(uid)) {
            activeUserSockets.set(uid, new Set());
        }
        activeUserSockets.get(uid).add(socket.id);

        // Broadcast online status
        io.emit('user-online', { userId: uid, isOnline: true });
        console.log(`User ${uid} joined room, active users: ${activeUserSockets.size}`);
    });

    // New message - relay to receiver room
    socket.on('send-message', (data) => {
        const { receiverId, message } = data;
        if (receiverId) {
            io.to(receiverId.toString()).emit('new-message', message);
        }
    });

    // Typing indicator
    socket.on('typing', (data) => {
        const { receiverId, senderId, isTyping } = data;
        if (receiverId) {
            io.to(receiverId.toString()).emit('user-typing', { senderId, isTyping });
        }
    });

    // WebRTC Signaling - Call offer
    socket.on('call-offer', (data) => {
        const { targetUserId, offer, callerInfo, callType } = data;
        const targetId = targetUserId?.toString();
        if (targetId) {
            io.to(targetId).emit('incoming-call', {
                offer,
                callerInfo,
                callType,
                callerId: socket.userId
            });
        }
    });

    // WebRTC Signaling - Call answer
    socket.on('call-answer', (data) => {
        const { targetUserId, answer } = data;
        const targetId = targetUserId?.toString();
        if (targetId) {
            io.to(targetId).emit('call-answered', { answer });
        }
    });

    // WebRTC Signaling - ICE candidate
    socket.on('ice-candidate', (data) => {
        const { targetUserId, candidate } = data;
        const targetId = targetUserId?.toString();
        if (targetId) {
            io.to(targetId).emit('ice-candidate', { candidate });
        }
    });

    // Call rejected
    socket.on('call-reject', (data) => {
        const { targetUserId } = data;
        const targetId = targetUserId?.toString();
        if (targetId) {
            io.to(targetId).emit('call-rejected', { userId: socket.userId });
        }
    });

    // Call ended
    socket.on('call-end', (data) => {
        const { targetUserId } = data;
        const targetId = targetUserId?.toString();
        if (targetId) {
            io.to(targetId).emit('call-ended', { userId: socket.userId });
        }
    });

    // Match notification
    socket.on('new-match', (data) => {
        const { targetUserId, matchData } = data;
        const targetId = targetUserId?.toString();
        if (targetId) {
            io.to(targetId).emit('match-notification', matchData);
        }
    });

    // Notification
    socket.on('send-notification', (data) => {
        const { targetUserId, notification } = data;
        const targetId = targetUserId?.toString();
        if (targetId) {
            io.to(targetId).emit('new-notification', notification);
        }
    });

    // Check online status of specific users
    socket.on('check-online', (userIds) => {
        if (!Array.isArray(userIds)) return;
        const statuses = {};
        userIds.forEach((id) => {
            const uid = id ? id.toString() : '';
            statuses[uid] = activeUserSockets.has(uid) && activeUserSockets.get(uid).size > 0;
        });
        socket.emit('online-statuses', statuses);
    });

    // Disconnect
    socket.on('disconnect', () => {
        if (socket.userId) {
            const uid = socket.userId;
            if (activeUserSockets.has(uid)) {
                activeUserSockets.get(uid).delete(socket.id);
                if (activeUserSockets.get(uid).size === 0) {
                    activeUserSockets.delete(uid);
                    io.emit('user-online', { userId: uid, isOnline: false });
                }
            }
        }
        console.log('Socket disconnected:', socket.id);
    });
});

// Make io accessible to routes
app.set('io', io)
app.set('onlineUsers', activeUserSockets)

dbConnect().then(() => {
    console.log("Connection Stablished successfully")
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`Server is running on 0.0.0.0:${PORT}`)
    })
}).catch((err) => {
    console.log("Connection not created:", err.message)
    // Start server anyway so Render doesn't kill the process
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`Server started on 0.0.0.0:${PORT} (DB connection pending)`)
    })
})
