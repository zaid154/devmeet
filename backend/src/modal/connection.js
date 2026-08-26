const mongoose = require('mongoose')
const { Types, Schema, model } = mongoose


const connectionSchema = new Schema({
    fromUserId: {
        type: Types.ObjectId,
        required: true,
        index: true,
        ref: 'user'
    },
    toUserId: {
        type: Types.ObjectId,
        required: true,
        index: true,
        ref: 'user'
    },
    status: {
        type: String,
        required: true,
        enum: ["pending", "accepted", "rejected", "intrested", "ignore", "super-like"]
    }
}, {
    timestamps: true,
    versionKey: false
})

connectionSchema.pre('save', function (next) {
    const connection = this
    if (connection.fromUserId.toString() === connection.toUserId.toString()) {
        throw new Error("You can not send request yourself")
    }
    if (typeof next === 'function') {
        next()
    }
})

connectionSchema.index({ fromUserId: 1, toUserId: 1 }, { unique: true })

module.exports = model('connection', connectionSchema)