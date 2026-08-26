const mongoose = require('mongoose');
const { Types, Schema, model } = mongoose;

const reportSchema = new Schema({
  reporterId: {
    type: Types.ObjectId,
    required: true,
    index: true,
    ref: 'user',
  },
  reportedId: {
    type: Types.ObjectId,
    required: true,
    index: true,
    ref: 'user',
  },
  reason: {
    type: String,
    required: true,
    enum: ['fake-profile', 'spam', 'harassment', 'inappropriate-content', 'scam', 'other'],
  },
  description: {
    type: String,
    maxLength: 500,
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'resolved', 'rejected'],
    default: 'pending',
    index: true,
  },
  actionTaken: {
    type: String,
    default: '',
  },
  resolvedBy: {
    type: Types.ObjectId,
    ref: 'user',
  },
  resolvedAt: {
    type: Date,
  },
}, {
  timestamps: true,
  versionKey: false,
});

module.exports = model('report', reportSchema);
