const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true
    },
    secure_url: {
      type: String,
      required: true,
      trim: true
    },
    publicId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    resourceType: {
      type: String,
      enum: ['image', 'video', 'raw', 'auto'],
      default: 'image'
    },
    format: {
      type: String,
      trim: true
    },
    width: {
      type: Number,
      default: 0
    },
    height: {
      type: Number,
      default: 0
    },
    bytes: {
      type: Number,
      default: 0
    },
    folder: {
      type: String,
      default: process.env.CLOUDINARY_FOLDER || 'portfolio-cms'
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    entityType: {
      type: String,
      enum: ['profile', 'gallery', 'portfolio', 'project', 'cms', 'chat', 'verification', 'announcement', 'other'],
      default: 'cms',
      index: true
    },
    entityId: {
      type: String,
      trim: true,
      index: true
    },
    title: {
      type: String,
      trim: true,
      default: 'Media Item'
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    tags: [
      {
        type: String,
        trim: true
      }
    ],
    status: {
      type: String,
      enum: ['active', 'restricted', 'archived'],
      default: 'active',
      index: true
    },
    restrictedReason: {
      type: String,
      default: ''
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

// Virtual for file size in human-readable format
mediaSchema.virtual('sizeInKB').get(function () {
  return (this.bytes / 1024).toFixed(2);
});

mediaSchema.virtual('sizeInMB').get(function () {
  return (this.bytes / (1024 * 1024)).toFixed(2);
});

const mediaModel = mongoose.model('Media', mediaSchema);

module.exports = mediaModel;
