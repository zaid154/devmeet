const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

/**
 * Resolve JWT signing/verification secret strictly from environment variables.
 * Never falls back to a hardcoded secret.
 * @returns {string}
 */
function getJwtSecret() {
  const secret = (process.env.JWT_PVT_KEY || process.env.JWT_SECRET || '').trim();
  if (!secret) {
    throw new Error('FATAL: JWT_PVT_KEY (or JWT_SECRET) environment variable is required.');
  }
  return secret;
}

/**
 * Cookie flags for auth tokens (httpOnly + cross-origin safe in production).
 * @param {boolean} [isClear=false]
 * @returns {import('express').CookieOptions}
 */
function getCookieOptions(isClear = false) {
  const isProd =
    process.env.NODE_ENV === 'production' ||
    process.env.RENDER === 'true' ||
    Boolean(process.env.RENDER_SERVICE_ID) ||
    process.env.COOKIE_SECURE === 'true';

  const base = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  };

  if (isClear) {
    return { ...base, expires: new Date(0) };
  }
  return { ...base, maxAge: 7 * 24 * 60 * 60 * 1000 };
}

/**
 * Recursively remove MongoDB operator keys ($...) and dotted keys from untrusted input
 * to prevent NoSQL operator injection (Express 5 safe — avoids mutating req.query getter).
 * @param {unknown} value
 * @returns {unknown}
 */
function sanitizeValue(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const clean = {};
    for (const [k, v] of Object.entries(value)) {
      if (k.startsWith('$') || k.includes('.') || k === '__proto__' || k === 'constructor' || k === 'prototype') {
        continue;
      }
      clean[k] = sanitizeValue(v);
    }
    return clean;
  }
  if (typeof value === 'string') {
    return value.replace(/\0/g, '');
  }
  return value;
}

/**
 * Express middleware that sanitizes req.body and req.params against NoSQL operator injection.
 */
function sanitizeInput(req, _res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeValue(req.params);
  }
  next();
}

/**
 * Escape special regex metacharacters to prevent ReDoS or malformed regex errors.
 * @param {unknown} str
 * @returns {string}
 */
function escapeRegex(str) {
  return String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Escape HTML special characters before interpolating user values into email templates.
 * @param {unknown} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Clamp pagination parameters safely.
 * @param {unknown} page
 * @param {unknown} limit
 * @param {number} [maxLimit=50]
 * @returns {{ page: number, limit: number, skip: number }}
 */
function parsePagination(page, limit, maxLimit = 50) {
  const safePage = Math.max(1, Math.floor(Number(page) || 1));
  const safeLimit = Math.min(maxLimit, Math.max(1, Math.floor(Number(limit) || 20)));
  return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
}

/**
 * Validate MongoDB ObjectId safely.
 * @param {unknown} id
 * @returns {boolean}
 */
function isValidObjectId(id) {
  return typeof id === 'string' && mongoose.Types.ObjectId.isValid(id);
}

/**
 * Extract bearer or cookie token from an HTTP request.
 * @param {import('express').Request} req
 * @param {boolean} [allowAdminCookie=false]
 * @returns {string|null}
 */
function extractToken(req, allowAdminCookie = false) {
  if (req.headers?.authorization && req.headers.authorization.startsWith('Bearer ')) {
    const bearer = req.headers.authorization.slice(7).trim();
    if (bearer) return bearer;
  }
  if (allowAdminCookie && req.cookies?.adminToken) {
    return req.cookies.adminToken;
  }
  if (req.cookies?.token) {
    return req.cookies.token;
  }
  return null;
}

/**
 * Parse Cookie header string into a key-value map (used for Socket.IO handshake).
 * @param {string|undefined} cookieHeader
 * @returns {Record<string, string>}
 */
function parseCookieHeader(cookieHeader) {
  const cookies = {};
  if (!cookieHeader || typeof cookieHeader !== 'string') return cookies;
  cookieHeader.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx > -1) {
      const key = part.slice(0, idx).trim();
      const val = part.slice(idx + 1).trim();
      if (key) {
        try {
          cookies[key] = decodeURIComponent(val);
        } catch {
          cookies[key] = val;
        }
      }
    }
  });
  return cookies;
}

/**
 * Rate limiters (keyed by req.ip with trust proxy enabled on Express).
 */
const authLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: false, message: 'Too many authentication attempts. Please try again later.' },
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: false, message: 'Too many OTP requests. Please wait 15 minutes and try again.' },
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, status: false, message: 'Upload rate limit exceeded. Please try again shortly.' },
});

const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: false, message: 'Too many requests, please slow down.' },
});

module.exports = {
  getJwtSecret,
  getCookieOptions,
  sanitizeValue,
  sanitizeInput,
  escapeRegex,
  escapeHtml,
  parsePagination,
  isValidObjectId,
  extractToken,
  parseCookieHeader,
  authLimiter,
  otpLimiter,
  uploadLimiter,
  apiLimiter,
};
