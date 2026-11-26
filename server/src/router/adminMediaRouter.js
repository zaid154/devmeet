const express = require('express');
const router = express.Router();

const { adminAuth, requireRoles } = require('../utils/adminAuth');
const mediaModel = require('../modal/media');
const {
  uploadFromBuffer,
  deleteFromCloudinary,
  replaceCloudinaryAsset,
} = require('../utils/cloudinaryService');
const { escapeRegex, isValidObjectId, parsePagination } = require('../utils/securityMiddleware');
const {
  ADMIN_MEDIA_MIME_TO_EXT,
  createSafeUploader,
  validateUploadedFile,
} = require('../utils/uploadValidation');

const upload = createSafeUploader(ADMIN_MEDIA_MIME_TO_EXT, 50 * 1024 * 1024);

function sanitizeFolder(rawFolder) {
  if (typeof rawFolder !== 'string' || !rawFolder.trim()) {
    return 'portfolio-cms/admin-uploads';
  }
  const cleaned = rawFolder.trim().replace(/\.\.+/g, '').replace(/[^a-zA-Z0-9/_-]/g, '');
  return cleaned || 'portfolio-cms/admin-uploads';
}

// =========================================================================
// 1. GET MEDIA CMS STATS & STORAGE METRICS
// =========================================================================
router.get('/stats', adminAuth, async (_req, res) => {
  try {
    const totalCount = await mediaModel.countDocuments();
    const activeCount = await mediaModel.countDocuments({ status: 'active' });
    const restrictedCount = await mediaModel.countDocuments({ status: 'restricted' });

    const bytesAggregation = await mediaModel.aggregate([
      { $group: { _id: null, totalBytes: { $sum: '$bytes' } } },
    ]);
    const totalBytes = bytesAggregation[0]?.totalBytes || 0;
    const totalStorageMB = (totalBytes / (1024 * 1024)).toFixed(2);

    const entityBreakdown = await mediaModel.aggregate([
      { $group: { _id: '$entityType', count: { $sum: 1 } } },
    ]);

    res.send({
      success: true,
      data: {
        totalCount,
        activeCount,
        restrictedCount,
        totalBytes,
        totalStorageMB,
        entityBreakdown,
      },
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});

// =========================================================================
// 2. LIST ALL MEDIA ITEMS
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
      sortOrder = 'desc',
    } = req.query;

    const query = {};
    if (typeof status === 'string' && status) query.status = status;
    if (typeof entityType === 'string' && entityType) query.entityType = entityType;
    if (typeof resourceType === 'string' && resourceType) query.resourceType = resourceType;

    if (typeof search === 'string' && search.trim()) {
      const searchRegex = new RegExp(escapeRegex(search.trim().slice(0, 80)), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { publicId: searchRegex },
        { tags: { $in: [searchRegex] } },
        { folder: searchRegex },
      ];
    }

    const { page: pageNumber, limit: limitNumber, skip } = parsePagination(page, limit, 100);
    const allowedSortFields = ['createdAt', 'bytes', 'title', 'status', 'resourceType'];
    const safeSortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortOptions = { [safeSortField]: sortOrder === 'asc' ? 1 : -1 };

    const [items, total] = await Promise.all([
      mediaModel
        .find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNumber)
        .populate('uploadedBy', 'firstName lastName email profileImage role')
        .lean(),
      mediaModel.countDocuments(query),
    ]);

    res.send({
      success: true,
      data: items,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        pages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});

// =========================================================================
// 3. ADMIN DIRECT CMS MEDIA UPLOAD
// =========================================================================
router.post('/upload', adminAuth, requireRoles(['super-admin', 'admin', 'moderator']), upload.single('file'), async (req, res) => {
  try {
    const check = validateUploadedFile(req.file, ADMIN_MEDIA_MIME_TO_EXT);
    if (!check.ok) {
      return res.status(400).send({
        success: false,
        message: check.message,
      });
    }

    const {
      title = 'Admin Upload',
      description = '',
      entityType = 'cms',
      tags = '',
      folder = 'portfolio-cms/admin-uploads',
    } = req.body || {};

    const safeFolder = sanitizeFolder(folder);
    const isVideo = check.mime.startsWith('video');
    const resourceType = isVideo ? 'video' : 'image';

    const result = await uploadFromBuffer(req.file.buffer, {
      folder: safeFolder,
      resource_type: resourceType,
    });

    const parsedTags = typeof tags === 'string' && tags.trim()
      ? tags.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 20)
      : Array.isArray(tags) ? tags.filter((t) => typeof t === 'string').slice(0, 20) : [];

    const mediaDoc = await mediaModel.create({
      url: result.url,
      secure_url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type || resourceType,
      format: result.format,
      width: result.width || 0,
      height: result.height || 0,
      bytes: result.bytes || 0,
      folder: result.folder || safeFolder,
      uploadedBy: req.adminId || req.admin?._id,
      entityType: typeof entityType === 'string' ? entityType : 'cms',
      title: String(title || 'Admin Upload').trim(),
      description: String(description || '').trim(),
      tags: parsedTags,
      status: 'active',
    });

    res.send({
      success: true,
      message: 'Media uploaded successfully to Cloudinary',
      data: mediaDoc,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});

// =========================================================================
// 4. UPDATE MEDIA METADATA
// =========================================================================
router.put('/:id', adminAuth, requireRoles(['super-admin', 'admin', 'moderator']), async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).send({ success: false, message: 'Invalid media ID' });
    }

    const { title, description, entityType, tags } = req.body || {};
    const updateFields = {};
    if (typeof title === 'string') updateFields.title = title.trim();
    if (typeof description === 'string') updateFields.description = description.trim();
    if (typeof entityType === 'string') updateFields.entityType = entityType;
    if (tags !== undefined) {
      updateFields.tags = typeof tags === 'string'
        ? tags.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 20)
        : Array.isArray(tags) ? tags.filter((t) => typeof t === 'string').slice(0, 20) : [];
    }

    const updated = await mediaModel.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).send({
        success: false,
        message: 'Media item not found',
      });
    }

    res.send({
      success: true,
      message: 'Media metadata updated successfully',
      data: updated,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});

// =========================================================================
// 5. ATOMIC REPLACE CLOUDINARY ASSET
// =========================================================================
router.put('/:id/replace', adminAuth, requireRoles(['super-admin', 'admin', 'moderator']), upload.single('file'), async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).send({ success: false, message: 'Invalid media ID' });
    }

    const check = validateUploadedFile(req.file, ADMIN_MEDIA_MIME_TO_EXT);
    if (!check.ok) {
      return res.status(400).send({
        success: false,
        message: check.message,
      });
    }

    const existingMedia = await mediaModel.findById(req.params.id);
    if (!existingMedia) {
      return res.status(404).send({
        success: false,
        message: 'Media record not found',
      });
    }

    const isVideo = check.mime.startsWith('video');
    const resourceType = isVideo ? 'video' : 'image';

    const result = await replaceCloudinaryAsset(existingMedia.publicId, req.file.buffer, {
      folder: existingMedia.folder || 'portfolio-cms',
      resource_type: resourceType,
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
      message: 'Media replaced on Cloudinary successfully',
      data: existingMedia,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});

// =========================================================================
// 6. TOGGLE MEDIA STATUS
// =========================================================================
router.put('/:id/status', adminAuth, requireRoles(['super-admin', 'admin', 'moderator']), async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).send({ success: false, message: 'Invalid media ID' });
    }

    const { status, restrictedReason = '' } = req.body || {};

    if (!['active', 'restricted', 'deleted'].includes(status)) {
      return res.status(400).send({
        success: false,
        message: "Status must be 'active', 'restricted', or 'deleted'",
      });
    }

    const mediaDoc = await mediaModel.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status,
          restrictedReason: status === 'restricted' ? String(restrictedReason || '') : '',
        },
      },
      { new: true }
    );

    if (!mediaDoc) {
      return res.status(404).send({
        success: false,
        message: 'Media item not found',
      });
    }

    res.send({
      success: true,
      message: `Media status changed to ${status}`,
      data: mediaDoc,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});

// =========================================================================
// 7. DELETE MEDIA
// =========================================================================
router.delete('/:id', adminAuth, requireRoles(['super-admin', 'admin']), async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).send({ success: false, message: 'Invalid media ID' });
    }

    const mediaDoc = await mediaModel.findById(req.params.id);
    if (!mediaDoc) {
      return res.status(404).send({
        success: false,
        message: 'Media item not found',
      });
    }

    if (mediaDoc.publicId) {
      await deleteFromCloudinary(mediaDoc.publicId, mediaDoc.resourceType || 'image');
    }

    await mediaModel.findByIdAndDelete(req.params.id);

    res.send({
      success: true,
      message: 'Media permanently deleted from Cloudinary and Database',
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
