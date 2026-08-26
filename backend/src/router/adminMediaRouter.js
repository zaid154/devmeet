const express = require('express');
const router = express.Router();
const multer = require('multer');

const { adminAuth } = require('../utils/adminAuth');
const mediaModel = require('../modal/media');
const userModel = require('../modal/user');
const {
  uploadFromBuffer,
  deleteFromCloudinary,
  replaceCloudinaryAsset
} = require('../utils/cloudinaryService');

// Multer memory storage for Admin CMS uploads (Up to 50MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});


// =========================================================================
// 1. GET MEDIA CMS STATS & STORAGE METRICS
// Kaam: Total assets count, Active/Restricted count aur total storage (MB) return karta hai.
// Kab use hota hai: Admin Media CMS dashboard load hone par top stat cards ke liye.
// =========================================================================
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const totalCount = await mediaModel.countDocuments();
    const activeCount = await mediaModel.countDocuments({ status: 'active' });
    const restrictedCount = await mediaModel.countDocuments({ status: 'restricted' });

    // Calculate total bytes stored in Cloudinary
    const bytesAggregation = await mediaModel.aggregate([
      { $group: { _id: null, totalBytes: { $sum: '$bytes' } } }
    ]);
    const totalBytes = bytesAggregation[0]?.totalBytes || 0;
    const totalStorageMB = (totalBytes / (1024 * 1024)).toFixed(2);

    const entityBreakdown = await mediaModel.aggregate([
      { $group: { _id: '$entityType', count: { $sum: 1 } } }
    ]);

    res.send({
      success: true,
      data: {
        totalCount,
        activeCount,
        restrictedCount,
        totalBytes,
        totalStorageMB,
        entityBreakdown
      }
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message
    });
  }
});


// =========================================================================
// 2. LIST ALL MEDIA ITEMS (With Search, Filter & Pagination)
// Kaam: Cloudinary par uploaded sabhi assets list karta hai.
// Kab use hota hai: Admin Media CMS grid / table view load karne par.
// =========================================================================
router.get('/', adminAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      entityType = '',
      status = '',
      resourceType = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }
    if (entityType) {
      query.entityType = entityType;
    }
    if (resourceType) {
      query.resourceType = resourceType;
    }

    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { publicId: searchRegex },
        { tags: { $in: [searchRegex] } },
        { folder: searchRegex }
      ];
    }

    const pageNumber = Math.max(1, parseInt(page));
    const limitNumber = Math.max(1, parseInt(limit));
    const skip = (pageNumber - 1) * limitNumber;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      mediaModel
        .find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNumber)
        .populate('uploadedBy', 'firstName lastName email profileImage role')
        .lean(),
      mediaModel.countDocuments(query)
    ]);

    res.send({
      success: true,
      data: items,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        pages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message
    });
  }
});


// =========================================================================
// 3. ADMIN DIRECT CMS MEDIA UPLOAD
// Kaam: Admin ko platform ke liye direct images/videos Cloudinary par upload karne deta hai.
// Kab use hota hai: Media CMS me 'Upload Media' button click karne par.
// =========================================================================
router.post('/upload', adminAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({
        success: false,
        message: "No file provided for upload"
      });
    }

    const {
      title = 'Admin Upload',
      description = '',
      entityType = 'cms',
      tags = '',
      folder = 'portfolio-cms/admin-uploads'
    } = req.body;

    const isVideo = req.file.mimetype.startsWith('video');
    const resourceType = isVideo ? 'video' : 'image';

    const result = await uploadFromBuffer(req.file.buffer, {
      folder: folder,
      resource_type: resourceType
    });

    const parsedTags = typeof tags === 'string' && tags.trim()
      ? tags.split(',').map((t) => t.trim()).filter(Boolean)
      : Array.isArray(tags) ? tags : [];

    const mediaDoc = await mediaModel.create({
      url: result.url,
      secure_url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type || resourceType,
      format: result.format,
      width: result.width || 0,
      height: result.height || 0,
      bytes: result.bytes || 0,
      folder: result.folder || folder,
      uploadedBy: req.adminId || req.admin?._id,
      entityType: entityType,
      title: title.trim(),
      description: description.trim(),
      tags: parsedTags,
      status: 'active'
    });

    res.send({
      success: true,
      message: "Media uploaded successfully to Cloudinary",
      data: mediaDoc
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message
    });
  }
});


// =========================================================================
// 4. UPDATE MEDIA METADATA (Title, Description, Tags)
// Kaam: Media asset ka title, tags ya description update karta hai.
// Kab use hota hai: Media CMS me 'Edit Details' modal me save karne par.
// =========================================================================
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { title, description, entityType, tags } = req.body;

    const updateFields = {};
    if (title !== undefined) updateFields.title = title.trim();
    if (description !== undefined) updateFields.description = description.trim();
    if (entityType !== undefined) updateFields.entityType = entityType;
    if (tags !== undefined) {
      updateFields.tags = typeof tags === 'string'
        ? tags.split(',').map((t) => t.trim()).filter(Boolean)
        : Array.isArray(tags) ? tags : [];
    }

    const updated = await mediaModel.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).send({
        success: false,
        message: "Media item not found"
      });
    }

    res.send({
      success: true,
      message: "Media metadata updated successfully",
      data: updated
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message
    });
  }
});


// =========================================================================
// 5. ATOMIC REPLACE CLOUDINARY ASSET
// Kaam: Kisi media asset ko nayi file se atomically replace karta hai.
// Kab use hota hai: Media CMS me 'Replace File' par naya asset upload karne par.
// =========================================================================
router.put('/:id/replace', adminAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({
        success: false,
        message: "Please provide a replacement file"
      });
    }

    const existingMedia = await mediaModel.findById(req.params.id);
    if (!existingMedia) {
      return res.status(404).send({
        success: false,
        message: "Media record not found"
      });
    }

    const isVideo = req.file.mimetype.startsWith('video');
    const resourceType = isVideo ? 'video' : 'image';

    const result = await replaceCloudinaryAsset(existingMedia.publicId, req.file.buffer, {
      folder: existingMedia.folder || 'portfolio-cms',
      resource_type: resourceType
    });

    existingMedia.url = result.url;
    existingMedia.secure_url = result.secure_url;
    existingMedia.publicId = result.public_id;
    existingMedia.format = result.format;
    existingMedia.bytes = result.bytes;
    existingMedia.width = result.width || 0;
    existingMedia.height = result.height || 0;
    await existingMedia.save();

    res.send({
      success: true,
      message: "Media replaced on Cloudinary successfully",
      data: existingMedia
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message
    });
  }
});


// =========================================================================
// 6. TOGGLE MEDIA STATUS (Active / Restricted)
// Kaam: Media item ko public view se hide (restrict) ya unrestrict karta hai.
// Kab use hota hai: Content moderation ke time inappropriate images ko hide karne ke liye.
// =========================================================================
router.put('/:id/status', adminAuth, async (req, res) => {
  try {
    const { status, restrictedReason = '' } = req.body;

    if (!['active', 'restricted', 'deleted'].includes(status)) {
      return res.status(400).send({
        success: false,
        message: "Status must be 'active', 'restricted', or 'deleted'"
      });
    }

    const mediaDoc = await mediaModel.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status,
          restrictedReason: status === 'restricted' ? restrictedReason : ''
        }
      },
      { new: true }
    );

    if (!mediaDoc) {
      return res.status(404).send({
        success: false,
        message: "Media item not found"
      });
    }

    res.send({
      success: true,
      message: `Media status changed to ${status}`,
      data: mediaDoc
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message
    });
  }
});


// =========================================================================
// 7. DELETE MEDIA (Cloudinary & Database)
// Kaam: Media item ko Cloudinary storage aur MongoDB database dono se permanently delete karta hai.
// Kab use hota hai: Media CMS me 'Delete' confirm karne par.
// =========================================================================
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const mediaDoc = await mediaModel.findById(req.params.id);
    if (!mediaDoc) {
      return res.status(404).send({
        success: false,
        message: "Media item not found"
      });
    }

    // Destroy asset on Cloudinary
    if (mediaDoc.publicId) {
      await deleteFromCloudinary(mediaDoc.publicId, mediaDoc.resourceType || 'image');
    }

    // Delete record from database
    await mediaModel.findByIdAndDelete(req.params.id);

    res.send({
      success: true,
      message: "Media permanently deleted from Cloudinary and Database"
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
