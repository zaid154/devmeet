const cloudinary = require('../config/cloudinary');
const streamifier = require('stream');

/**
 * Upload a file buffer directly to Cloudinary using a memory stream
 * @param {Buffer} buffer - File buffer from Multer memoryStorage
 * @param {Object} options - Cloudinary upload options (folder, resource_type, transformation, etc.)
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadFromBuffer = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: options.folder || process.env.CLOUDINARY_FOLDER || 'portfolio-cms',
      resource_type: options.resource_type || 'auto',
      ...options
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );

    // Write buffer into upload stream
    const bufferStream = new streamifier.PassThrough();
    bufferStream.end(buffer);
    bufferStream.pipe(uploadStream);
  });
};

/**
 * Delete a file from Cloudinary by its publicId
 * @param {string} publicId - Cloudinary asset public ID
 * @param {string} resourceType - 'image', 'video', 'raw'
 * @returns {Promise<Object>} Cloudinary destroy result
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  if (!publicId) return { result: 'not_found' };
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true
    });
    return result;
  } catch (error) {
    console.error(`[CloudinaryService] Failed to delete publicId "${publicId}":`, error.message);
    // Don't crash caller if delete fails
    return { result: 'error', error: error.message };
  }
};

/**
 * Replace an existing Cloudinary asset safely:
 * 1. Upload new asset first
 * 2. Delete old asset only if upload succeeded
 * 3. Preserve old asset if upload fails
 * @param {string} oldPublicId - Old asset publicId to be replaced
 * @param {Buffer} newBuffer - New file buffer
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} New upload result
 */
const replaceCloudinaryAsset = async (oldPublicId, newBuffer, options = {}) => {
  // Step 1: Upload new asset first
  const newUploadResult = await uploadFromBuffer(newBuffer, options);

  // Step 2: If successful, delete old asset in background
  if (oldPublicId) {
    deleteFromCloudinary(oldPublicId, options.resource_type || 'image').catch((err) => {
      console.warn(`[CloudinaryService] Old asset deletion failed for "${oldPublicId}":`, err.message);
    });
  }

  return newUploadResult;
};

/**
 * Extract publicId from a standard Cloudinary URL
 * @param {string} url - Cloudinary URL string
 * @returns {string|null} publicId
 */
const extractPublicIdFromUrl = (url) => {
  if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com')) {
    return null;
  }
  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    let pathPart = parts[1];
    // Remove version segment e.g. v1728392819/
    pathPart = pathPart.replace(/^v\d+\//, '');
    // Remove file extension
    const dotIndex = pathPart.lastIndexOf('.');
    if (dotIndex !== -1) {
      pathPart = pathPart.substring(0, dotIndex);
    }
    return pathPart;
  } catch (e) {
    return null;
  }
};

module.exports = {
  uploadFromBuffer,
  deleteFromCloudinary,
  replaceCloudinaryAsset,
  extractPublicIdFromUrl
};
