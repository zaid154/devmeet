const mongoose = require('mongoose');
const { Types, Schema, model } = mongoose;

const announcementSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'danger', 'success', 'maintenance'],
    default: 'info',
  },
  target: {
    type: String,
    enum: ['all', 'verified', 'location'],
    default: 'all',
  },
  targetLocation: {
    type: String,
    default: '',
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  createdBy: {
    type: Types.ObjectId,
    ref: 'user',
  },
  expiresAt: {
    type: Date,
  },
}, {
  timestamps: true,
  versionKey: false,
});

announcementSchema.index({ isActive: 1, createdAt: -1 });

module.exports = model('announcement', announcementSchema);
