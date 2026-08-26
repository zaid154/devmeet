const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const appSettingSchema = new Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  value: {
    type: Schema.Types.Mixed,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
  versionKey: false,
});

module.exports = model('appSetting', appSettingSchema);
