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

app.use(cors(corsOptions))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))
app.use(cookieParser())

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

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

// Track online users: userId -> socketId
const onlineUsers = new Map()

io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id)

    // User joins with their userId
    socket.on('join', (userId) => {
        if (!userId) return
        onlineUsers.set(userId, socket.id)
        socket.userId = userId
        // Broadcast online status
        io.emit('user-online', { userId, isOnline: true })
        console.log(`User ${userId} joined, online users: ${onlineUsers.size}`)
    })

    // New message - relay to receiver
    socket.on('send-message', (data) => {
        const { receiverId, message } = data
        const receiverSocket = onlineUsers.get(receiverId)
        if (receiverSocket) {
            io.to(receiverSocket).emit('new-message', message)
        }
    })

    // Typing indicator
    socket.on('typing', (data) => {
        const { receiverId, senderId, isTyping } = data
        const receiverSocket = onlineUsers.get(receiverId)
        if (receiverSocket) {
            io.to(receiverSocket).emit('user-typing', { senderId, isTyping })
        }
    })

    // WebRTC Signaling - Call offer
    socket.on('call-offer', (data) => {
        const { targetUserId, offer, callerInfo, callType } = data
        const targetSocket = onlineUsers.get(targetUserId)
        if (targetSocket) {
            io.to(targetSocket).emit('incoming-call', {
                offer,
                callerInfo,
                callType,
                callerId: socket.userId
            })
        }
    })

    // WebRTC Signaling - Call answer
    socket.on('call-answer', (data) => {
        const { targetUserId, answer } = data
        const targetSocket = onlineUsers.get(targetUserId)
        if (targetSocket) {
            io.to(targetSocket).emit('call-answered', { answer })
        }
    })

    // WebRTC Signaling - ICE candidate
    socket.on('ice-candidate', (data) => {
        const { targetUserId, candidate } = data
        const targetSocket = onlineUsers.get(targetUserId)
        if (targetSocket) {
            io.to(targetSocket).emit('ice-candidate', { candidate })
        }
    })

    // Call rejected
    socket.on('call-reject', (data) => {
        const { targetUserId } = data
        const targetSocket = onlineUsers.get(targetUserId)
        if (targetSocket) {
            io.to(targetSocket).emit('call-rejected', { userId: socket.userId })
        }
    })

    // Call ended
    socket.on('call-end', (data) => {
        const { targetUserId } = data
        const targetSocket = onlineUsers.get(targetUserId)
        if (targetSocket) {
            io.to(targetSocket).emit('call-ended', { userId: socket.userId })
        }
    })

    // Match notification
    socket.on('new-match', (data) => {
        const { targetUserId, matchData } = data
        const targetSocket = onlineUsers.get(targetUserId)
        if (targetSocket) {
            io.to(targetSocket).emit('match-notification', matchData)
        }
    })

    // Notification
    socket.on('send-notification', (data) => {
        const { targetUserId, notification } = data
        const targetSocket = onlineUsers.get(targetUserId)
        if (targetSocket) {
            io.to(targetSocket).emit('new-notification', notification)
        }
    })

    // Get online status
    socket.on('check-online', (userIds) => {
        const statuses = {}
        userIds.forEach(id => {
            statuses[id] = onlineUsers.has(id)
        })
        socket.emit('online-statuses', statuses)
    })

    // Disconnect
    socket.on('disconnect', () => {
        if (socket.userId) {
            onlineUsers.delete(socket.userId)
            io.emit('user-online', { userId: socket.userId, isOnline: false })
            console.log(`User ${socket.userId} disconnected`)
        }
    })
})

// Make io accessible to routes
app.set('io', io)
app.set('onlineUsers', onlineUsers)

dbConnect().then(() => {
    console.log("Connection Stablished successfully")
    server.listen(PORT, () => {
        console.log(`Server is running on ${PORT}`)
    })
}).catch((err) => {
    console.log("Connection not created")
})
