const mongoose = require('mongoose');
const { Types, Schema, model } = mongoose;

const adminActivityLogSchema = new Schema({
  adminId: {
    type: Types.ObjectId,
    required: true,
    ref: 'user',
    index: true,
  },
  adminEmail: {
    type: String,
    required: true,
  },
  adminRole: {
    type: String,
    default: 'admin',
  },
  action: {
    type: String,
    required: true,
    index: true,
  },
  targetType: {
    type: String,
    enum: ['user', 'report', 'verification', 'photo', 'bio', 'announcement', 'setting', 'feature', 'auth'],
    default: 'user',
  },
  targetId: {
    type: Types.ObjectId,
  },
  details: {
    type: String,
    default: '',
  },
  ipAddress: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
  versionKey: false,
});

adminActivityLogSchema.index({ createdAt: -1 });

module.exports = model('adminActivityLog', adminActivityLogSchema);
