const multer = require('multer');

const IMAGE_MIME_TO_EXT = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const CHAT_MEDIA_MIME_TO_EXT = {
  ...IMAGE_MIME_TO_EXT,
  'audio/webm': 'webm',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/mp4': 'm4a',
  'audio/ogg': 'ogg',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
};

const ADMIN_MEDIA_MIME_TO_EXT = {
  ...IMAGE_MIME_TO_EXT,
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
};

/**
 * Inspect buffer magic bytes for common image formats to reject disguised HTML/JS/SVG/EXE payloads.
 * @param {Buffer} buf
 * @param {string} mimetype
 * @returns {boolean}
 */
function hasValidImageMagicBytes(buf, mimetype) {
  if (!Buffer.isBuffer(buf) || buf.length < 12) return false;
  const mime = (mimetype || '').toLowerCase();
  if (mime === 'image/jpeg' || mime === 'image/jpg') {
    return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  }
  if (mime === 'image/png') {
    return buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  }
  if (mime === 'image/gif') {
    const header = buf.subarray(0, 6).toString('ascii');
    return header === 'GIF87a' || header === 'GIF89a';
  }
  if (mime === 'image/webp') {
    return buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP';
  }
  return false;
}

/**
 * Create a memory-storage Multer uploader restricted to an explicit MIME allowlist.
 * @param {Record<string, string>} mimeMap
 * @param {number} maxBytes
 */
function createSafeUploader(mimeMap, maxBytes) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxBytes },
    fileFilter: (_req, file, cb) => {
      const mime = (file.mimetype || '').toLowerCase().split(';')[0].trim();
      if (!Object.prototype.hasOwnProperty.call(mimeMap, mime)) {
        return cb(new Error(`Unsupported or unsafe file type: ${mime || 'unknown'}`));
      }
      cb(null, true);
    },
  });
}

/**
 * Validate uploaded file buffer (and image magic bytes when mimetype is an image).
 * @param {Express.Multer.File} file
 * @param {Record<string, string>} mimeMap
 * @returns {{ ok: boolean, ext: string, mime: string, message?: string }}
 */
function validateUploadedFile(file, mimeMap) {
  if (!file || !file.buffer) {
    return { ok: false, ext: '', mime: '', message: 'No file provided' };
  }
  const mime = (file.mimetype || '').toLowerCase().split(';')[0].trim();
  const ext = mimeMap[mime];
  if (!ext) {
    return { ok: false, ext: '', mime, message: `Unsupported file type: ${mime}` };
  }
  if (mime.startsWith('image/') && !hasValidImageMagicBytes(file.buffer, mime)) {
    return { ok: false, ext: '', mime, message: 'Invalid image file signature' };
  }
  return { ok: true, ext, mime };
}

module.exports = {
  IMAGE_MIME_TO_EXT,
  CHAT_MEDIA_MIME_TO_EXT,
  ADMIN_MEDIA_MIME_TO_EXT,
  hasValidImageMagicBytes,
  createSafeUploader,
  validateUploadedFile,
};
