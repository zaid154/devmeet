const mongoose = require('mongoose');
const { Types, Schema, model } = mongoose;

const blockSchema = new Schema({
  blockerId: {
    type: Types.ObjectId,
    required: true,
    index: true,
    ref: 'user',
  },
  blockedId: {
    type: Types.ObjectId,
    required: true,
    index: true,
    ref: 'user',
  },
}, {
  timestamps: true,
  versionKey: false,
});

blockSchema.index({ blockerId: 1, blockedId: 1 }, { unique: true });

module.exports = model('block', blockSchema);
