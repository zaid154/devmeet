const cloudinary = require('cloudinary').v2;
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'uvxhwkuo',
  api_key: process.env.CLOUDINARY_API_KEY || '188235877413255',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'HbNMRjjPg7LQEzGsEmeVqXhOqNE',
  secure: true
});

module.exports = cloudinary;
