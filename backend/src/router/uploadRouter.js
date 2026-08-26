const express = require('express');
const router = express.Router();
const multer = require('multer');

const userAuth = require('../utils/userAuth');
const userModel = require('../modal/user');
const mediaModel = require('../modal/media');
const {
  uploadFromBuffer,
  deleteFromCloudinary,
  replaceCloudinaryAsset,
  extractPublicIdFromUrl
} = require('../utils/cloudinaryService');

// Multer memory storage (Streams directly to Cloudinary without saving files on server disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});


// =========================================================================
// 1. UPLOAD / REPLACE MAIN PROFILE IMAGE (Cloudinary)
// Kaam: User ki main profile picture Cloudinary par upload karta hai.
// Purani profile picture ko Cloudinary se safely destroy karta hai.
// Kab use hota hai: Edit Profile page par main photo upload karne par.
// =========================================================================
router.post('/profile-image', userAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({
        success: false,
        message: "Please select an image file to upload"
      });
    }

    const userId = req.user._id;
    const currentUser = await userModel.findById(userId);
    if (!currentUser) {
      return res.status(404).send({
        success: false,
        message: "User not found"
      });
    }

    // Extract old Cloudinary public ID if available
    const oldPublicId = extractPublicIdFromUrl(currentUser.profileImage);

    // Atomic Upload & Replace (Uploads new first, deletes old only on success)
    const result = await replaceCloudinaryAsset(oldPublicId, req.file.buffer, {
      folder: `${process.env.CLOUDINARY_FOLDER || 'portfolio-cms'}/profiles`,
      resource_type: 'image',
      transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto', fetch_format: 'auto' }]
    });

    // Update User in Database
    currentUser.profileImage = result.secure_url;
    if (!currentUser.photos || currentUser.photos.length === 0) {
      currentUser.photos = [result.secure_url];
    } else {
      currentUser.photos[0] = result.secure_url;
    }
    await currentUser.save();

    // Create Media Audit Record
    const mediaDoc = await mediaModel.create({
      url: result.url,
      secure_url: result.secure_url,
      publicId: result.public_id,
      resourceType: 'image',
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      folder: result.folder || 'portfolio-cms/profiles',
      uploadedBy: userId,
      entityType: 'profile',
      entityId: userId.toString(),
      title: `${currentUser.firstName || 'User'} Profile Picture`,
      status: 'active'
    });

    res.send({
      success: true,
      message: "Profile image uploaded to Cloudinary successfully! ☁️",
      data: {
        profileImage: result.secure_url,
        publicId: result.public_id,
        photos: currentUser.photos,
        media: mediaDoc
      }
    });
  } catch (error) {
    console.log("Profile upload error:", error.message);
    res.status(500).send({
      success: false,
      message: error.message || "Failed to upload profile image"
    });
  }
});


// =========================================================================
// 2. ADD PHOTO TO USER GALLERY (Cloudinary)
// Kaam: User ki gallery me nayi photo add karta hai (Max 6 photos).
// Kab use hota hai: Edit Profile page par additional photo slots me image add karne par.
// =========================================================================
router.post('/photo', userAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({
        success: false,
        message: "Please select a photo to upload"
      });
    }

    const userId = req.user._id;
    const currentUser = await userModel.findById(userId);
    if (!currentUser) {
      return res.status(404).send({
        success: false,
        message: "User not found"
      });
    }

    if (currentUser.photos && currentUser.photos.length >= 6) {
      return res.status(400).send({
        success: false,
        message: "Maximum 6 photos allowed per profile"
      });
    }

    const result = await uploadFromBuffer(req.file.buffer, {
      folder: `${process.env.CLOUDINARY_FOLDER || 'portfolio-cms'}/gallery`,
      resource_type: 'image',
      transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }]
    });

    currentUser.photos = currentUser.photos || [];
    currentUser.photos.push(result.secure_url);
    if (!currentUser.profileImage) {
      currentUser.profileImage = result.secure_url;
    }
    await currentUser.save();

    const mediaDoc = await mediaModel.create({
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
      status: 'active'
    });

    res.send({
      success: true,
      message: "Gallery photo uploaded to Cloudinary successfully! ☁️",
      data: {
        photoUrl: result.secure_url,
        publicId: result.public_id,
        photos: currentUser.photos,
        media: mediaDoc
      }
    });
  } catch (error) {
    console.log("Gallery upload error:", error.message);
    res.status(500).send({
      success: false,
      message: error.message || "Failed to upload photo"
    });
  }
});


// =========================================================================
// 3. DELETE PHOTO FROM USER GALLERY
// Kaam: Gallery photo delete karta hai aur Cloudinary asset ko destroy karta hai.
// Kab use hota hai: Edit profile screen par photo ke upar (X) close button dabane par.
// =========================================================================
router.delete('/photo', userAuth, async (req, res) => {
  try {
    const { photoUrl, publicId } = req.body;
    if (!photoUrl && !publicId) {
      return res.status(400).send({
        success: false,
        message: "photoUrl or publicId is required"
      });
    }

    const userId = req.user._id;
    const currentUser = await userModel.findById(userId);
    if (!currentUser) {
      return res.status(404).send({
        success: false,
        message: "User not found"
      });
    }

    // Remove photo from user's photos array
    currentUser.photos = (currentUser.photos || []).filter((p) => p !== photoUrl);
    if (currentUser.profileImage === photoUrl) {
      currentUser.profileImage = currentUser.photos[0] || '';
    }
    await currentUser.save();

    // Destroy asset on Cloudinary
    const targetPublicId = publicId || extractPublicIdFromUrl(photoUrl);
    if (targetPublicId) {
      await deleteFromCloudinary(targetPublicId, 'image');
      await mediaModel.findOneAndDelete({ publicId: targetPublicId });
    }

    res.send({
      success: true,
      message: "Photo deleted from Cloudinary and profile updated",
      data: {
        photos: currentUser.photos,
        profileImage: currentUser.profileImage
      }
    });
  } catch (error) {
    console.log("Delete photo error:", error.message);
    res.status(500).send({
      success: false,
      message: error.message || "Failed to delete photo"
    });
  }
});


// =========================================================================
// 4. UPLOAD CHAT ATTACHMENT
// Kaam: Voice note ya image attachment ko Cloudinary par stream karta hai.
// Kab use hota hai: Chat screen par user dwara file send karne par.
// =========================================================================
router.post('/chat-attachment', userAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({
        success: false,
        message: "No file provided"
      });
    }

    const isAudio = req.file.mimetype.startsWith('audio');
    const isVideo = req.file.mimetype.startsWith('video');
    const resourceType = (isAudio || isVideo) ? 'video' : 'image';

    const result = await uploadFromBuffer(req.file.buffer, {
      folder: `${process.env.CLOUDINARY_FOLDER || 'portfolio-cms'}/chat`,
      resource_type: resourceType
    });

    const mediaDoc = await mediaModel.create({
      url: result.url,
      secure_url: result.secure_url,
      publicId: result.public_id,
      resourceType: resourceType,
      format: result.format,
      width: result.width || 0,
      height: result.height || 0,
      bytes: result.bytes || 0,
      folder: result.folder || 'portfolio-cms/chat',
      uploadedBy: req.user._id,
      entityType: 'chat',
      title: `Chat Attachment (${req.file.originalname || 'File'})`,
      status: 'active'
    });

    res.send({
      success: true,
      fileUrl: result.secure_url,
      publicId: result.public_id,
      resourceType: resourceType,
      media: mediaDoc
    });
  } catch (error) {
    console.log("Chat attachment error:", error.message);
    res.status(500).send({
      success: false,
      message: error.message || "Failed to upload chat attachment"
    });
  }
});

module.exports = router;
