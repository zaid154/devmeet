const dns = require('dns');
const mongoose = require('mongoose');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();

const dbConnect = async () => {
    const mongoUri = (process.env.MONGO_URI || '').trim();
    if (!mongoUri) {
        throw new Error('MONGO_URI environment variable is required');
    }
    const opts = {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
    };
    try {
        await mongoose.connect(mongoUri, opts);
    } catch (err) {
        if (/querySrv/i.test(err.message) && mongoUri.startsWith('mongodb+srv://')) {
            // Retry SRV resolution with public resolvers when local router DNS refuses SRV records
            dns.setServers(['8.8.8.8', '1.1.1.1']);
            await mongoose.connect(mongoUri, opts);
            return;
        }
        console.error('MongoDB connection error:', err.message);
        throw err;
    }
};

module.exports = dbConnect;
