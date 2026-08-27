const mongoose = require('mongoose');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();

const dbConnect = async () => {
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://mohdzaid620268_db_user:QC9aH807gCbCZGC1@cluster0.vyffuyb.mongodb.net/developer_meetups?retryWrites=true&w=majority&appName=Cluster0';
    try {
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000
        });
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        throw err;
    }
};

module.exports = dbConnect;
