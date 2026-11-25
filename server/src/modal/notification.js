const mongoose = require('mongoose');
const { Types, Schema, model } = mongoose;

const notificationSchema = new Schema({
  userId: {
    type: Types.ObjectId,
    required: true,
    index: true,
    ref: 'user',
  },
  type: {
    type: String,
    required: true,
    enum: ['match', 'like', 'super-like', 'message', 'voice-call', 'video-call', 'missed-call', 'double-date', 'verification', 'system'],
  },
  fromUserId: {
    type: Types.ObjectId,
    ref: 'user',
  },
  title: {
    type: String,
    default: '',
  },
  body: {
    type: String,
    default: '',
  },
  data: {
    type: Schema.Types.Mixed,
    default: {},
  },
  read: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
  versionKey: false,
});

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

module.exports = model('notification', notificationSchema);
