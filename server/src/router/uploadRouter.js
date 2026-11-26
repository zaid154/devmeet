const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const userAuth = require('../utils/userAuth');
const userModel = require('../modal/user');
const mediaModel = require('../modal/media');
const {
  uploadFromBuffer,
  deleteFromCloudinary,
  replaceCloudinaryAsset,
  extractPublicIdFromUrl,
} = require('../utils/cloudinaryService');
const {
  IMAGE_MIME_TO_EXT,
  CHAT_MEDIA_MIME_TO_EXT,
  createSafeUploader,
  validateUploadedFile,
} = require('../utils/uploadValidation');

const imageUpload = createSafeUploader(IMAGE_MIME_TO_EXT, 10 * 1024 * 1024);
const chatUpload = createSafeUploader(CHAT_MEDIA_MIME_TO_EXT, 10 * 1024 * 1024);

const uploadsDir = path.join(__dirname, '../../uploads');
function saveFallbackFile(prefix, ext, buffer) {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const safeExt = ['jpg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg';
  const filename = `${prefix}_${Date.now()}_${Math.round(Math.random() * 1e6)}.${safeExt}`;
  fs.writeFileSync(path.join(uploadsDir, filename), buffer);
  return `/uploads/${filename}`;
}

// =========================================================================
// 1. UPLOAD / REPLACE MAIN PROFILE IMAGE
// =========================================================================
router.post('/profile-image', userAuth, imageUpload.single('image'), async (req, res) => {
  try {
    const check = validateUploadedFile(req.file, IMAGE_MIME_TO_EXT);
    if (!check.ok) {
      return res.status(400).send({
        success: false,
        message: check.message,
      });
    }

    const userId = req.userId || req.user?._id;
    const currentUser = await userModel.findById(userId);
    if (!currentUser) {
      return res.status(404).send({
        success: false,
        message: 'User not found',
      });
    }

    let secure_url;
    let public_id = `photo_${Date.now()}`;

    try {
      const oldPublicId = extractPublicIdFromUrl(currentUser.profileImage);
      const result = await replaceCloudinaryAsset(oldPublicId, req.file.buffer, {
        folder: `${process.env.CLOUDINARY_FOLDER || 'portfolio-cms'}/profiles`,
        resource_type: 'image',
        transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
      });
      secure_url = result.secure_url;
      public_id = result.public_id;
    } catch (cErr) {
      console.warn('Cloudinary fallback to local static file:', cErr.message);
      secure_url = saveFallbackFile('photo', check.ext, req.file.buffer);
    }

    currentUser.profileImage = secure_url;
    if (!currentUser.photos || currentUser.photos.length === 0) {
      currentUser.photos = [secure_url];
    } else {
      currentUser.photos[0] = secure_url;
    }
    await currentUser.save();

    res.send({
      success: true,
      message: 'Profile image updated successfully! ☁️',
      data: {
        profileImage: secure_url,
        publicId: public_id,
        photos: currentUser.photos,
      },
    });
  } catch (error) {
    console.log('Profile upload error:', error.message);
    res.status(500).send({
      success: false,
      message: error.message || 'Failed to upload profile image',
    });
  }
});

// =========================================================================
// 2. ADD PHOTO TO USER GALLERY
// =========================================================================
router.post('/photo', userAuth, imageUpload.single('image'), async (req, res) => {
  try {
    const check = validateUploadedFile(req.file, IMAGE_MIME_TO_EXT);
    if (!check.ok) {
      return res.status(400).send({
        success: false,
        message: check.message,
      });
    }

    const userId = req.userId || req.user?._id;
    const currentUser = await userModel.findById(userId);
    if (!currentUser) {
      return res.status(404).send({
        success: false,
        message: 'User not found',
      });
    }

    if (currentUser.photos && currentUser.photos.length >= 6) {
      return res.status(400).send({
        success: false,
        message: 'Maximum 6 photos allowed per profile',
      });
    }

    let secure_url;
    let public_id = `gallery_${Date.now()}`;
    let result = null;

    try {
      result = await uploadFromBuffer(req.file.buffer, {
        folder: `${process.env.CLOUDINARY_FOLDER || 'portfolio-cms'}/gallery`,
        resource_type: 'image',
        transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
      });
      secure_url = result.secure_url;
      public_id = result.public_id;
    } catch (cErr) {
      console.warn('Cloudinary fallback to local static file:', cErr.message);
      secure_url = saveFallbackFile('gallery', check.ext, req.file.buffer);
    }

    currentUser.photos = currentUser.photos || [];
    currentUser.photos.push(secure_url);
    if (!currentUser.profileImage) {
      currentUser.profileImage = secure_url;
    }
    await currentUser.save();

    let mediaDoc = null;
    if (result) {
      mediaDoc = await mediaModel.create({
        url: result.url,
        secure_url: result.secure_url,
        publicId: result.public_id,
        resourceType: 'image',
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        folder: result.folder || 'portfolio-cms/gallery',
        uploadedBy: userId,
        entityType: 'gallery',
        entityId: userId.toString(),
        title: `${currentUser.firstName || 'User'} Gallery Photo`,
        status: 'active',
      });
    }

    res.send({
      success: true,
      message: 'Gallery photo uploaded successfully! ☁️',
      data: {
        photoUrl: secure_url,
        publicId: public_id,
        photos: currentUser.photos,
        media: mediaDoc,
      },
    });
  } catch (error) {
    console.log('Gallery upload error:', error.message);
    res.status(500).send({
      success: false,
      message: error.message || 'Failed to upload photo',
    });
  }
});

// =========================================================================
// 3. DELETE PHOTO FROM USER GALLERY (Ownership-verified to prevent IDOR)
// =========================================================================
router.delete('/photo', userAuth, async (req, res) => {
  try {
    const { photoUrl, publicId } = req.body || {};
    if (!photoUrl && !publicId) {
      return res.status(400).send({
        success: false,
        message: 'photoUrl or publicId is required',
      });
    }

    const userId = req.user._id;
    const currentUser = await userModel.findById(userId);
    if (!currentUser) {
      return res.status(404).send({
        success: false,
        message: 'User not found',
      });
    }

    const ownedPhotos = currentUser.photos || [];
    const targetPublicId = typeof publicId === 'string' && publicId.trim()
      ? publicId.trim()
      : extractPublicIdFromUrl(photoUrl);

    const ownsPhotoUrl = typeof photoUrl === 'string' && ownedPhotos.includes(photoUrl);
    const ownedMediaRecord = targetPublicId
      ? await mediaModel.findOne({ publicId: targetPublicId, uploadedBy: userId })
      : null;

    if (!ownsPhotoUrl && !ownedMediaRecord) {
      return res.status(403).send({
        success: false,
        message: 'You are not authorized to delete this photo',
      });
    }

    if (typeof photoUrl === 'string') {
      currentUser.photos = ownedPhotos.filter((p) => p !== photoUrl);
    } else if (ownedMediaRecord) {
      currentUser.photos = ownedPhotos.filter(
        (p) => p !== ownedMediaRecord.secure_url && p !== ownedMediaRecord.url
      );
    }

    if (currentUser.profileImage === photoUrl || (ownedMediaRecord && currentUser.profileImage === ownedMediaRecord.secure_url)) {
      currentUser.profileImage = currentUser.photos[0] || '';
    }
    await currentUser.save();

    if (targetPublicId) {
      await deleteFromCloudinary(targetPublicId, 'image');
      await mediaModel.findOneAndDelete({ publicId: targetPublicId, uploadedBy: userId });
    }

    res.send({
      success: true,
      message: 'Photo deleted from Cloudinary and profile updated',
      data: {
        photos: currentUser.photos,
        profileImage: currentUser.profileImage,
      },
    });
  } catch (error) {
    console.log('Delete photo error:', error.message);
    res.status(500).send({
      success: false,
      message: error.message || 'Failed to delete photo',
    });
  }
});

// =========================================================================
// 4. UPLOAD CHAT ATTACHMENT
// =========================================================================
router.post('/chat-attachment', userAuth, chatUpload.single('file'), async (req, res) => {
  try {
    const check = validateUploadedFile(req.file, CHAT_MEDIA_MIME_TO_EXT);
    if (!check.ok) {
      return res.status(400).send({
        success: false,
        message: check.message,
      });
    }

    const isAudio = check.mime.startsWith('audio');
    const isVideo = check.mime.startsWith('video');
    const resourceType = (isAudio || isVideo) ? 'video' : 'image';

    const result = await uploadFromBuffer(req.file.buffer, {
      folder: `${process.env.CLOUDINARY_FOLDER || 'portfolio-cms'}/chat`,
      resource_type: resourceType,
    });

    const mediaDoc = await mediaModel.create({
      url: result.url,
      secure_url: result.secure_url,
      publicId: result.public_id,
      resourceType,
      format: result.format,
      width: result.width || 0,
      height: result.height || 0,
      bytes: result.bytes || 0,
      folder: result.folder || 'portfolio-cms/chat',
      uploadedBy: req.user._id,
      entityType: 'chat',
      title: 'Chat Attachment',
      status: 'active',
    });

    res.send({
      success: true,
      fileUrl: result.secure_url,
      publicId: result.public_id,
      resourceType,
      media: mediaDoc,
    });
  } catch (error) {
    console.log('Chat attachment error:', error.message);
    res.status(500).send({
      success: false,
      message: error.message || 'Failed to upload chat attachment',
    });
  }
});

module.exports = router;
