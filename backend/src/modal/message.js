const mongoose = require('mongoose');
const { Types, Schema, model } = mongoose;

const messageSchema = new Schema({
  senderId: {
    type: Types.ObjectId,
    required: true,
    index: true,
    ref: 'user',
  },
  receiverId: {
    type: Types.ObjectId,
    required: true,
    index: true,
    ref: 'user',
  },
  text: {
    type: String,
    trim: true,
    default: '',
  },
  type: {
    type: String,
    enum: ['text', 'image', 'gif', 'voice_note', 'call', 'system'],
    default: 'text',
  },
  mediaUrl: {
    type: String,
    default: '',
  },
  duration: {
    type: Number,
    default: 0,
  },
  callInfo: {
    callType: { type: String, enum: ['audio', 'video'] },
    duration: { type: String },
    status: { type: String, enum: ['completed', 'missed', 'declined'] },
  },
  read: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
  versionKey: false,
});

messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });

module.exports = model('message', messageSchema);
