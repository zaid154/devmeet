const mongoose = require('mongoose');
const path = require('path');
const dns = require('dns');

try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {}

require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();

const dbConnect = async () => {
    const mongoUri = process.env.MONGO_URI || 'mongodb://kunal336552_db_user:Kunal123@ac-bwzlk4f-shard-00-00.vnjyx9p.mongodb.net:27017,ac-bwzlk4f-shard-00-01.vnjyx9p.mongodb.net:27017,ac-bwzlk4f-shard-00-02.vnjyx9p.mongodb.net:27017/developer_meetups?ssl=true&replicaSet=atlas-nqkkc8-shard-0&authSource=admin&appName=Cluster0';
    try {
        await mongoose.connect(mongoUri);
    } catch (err) {
        if (err.code === 'EREFUSED' || err.message.includes('querySrv')) {
            const fallbackUri = 'mongodb://kunal336552_db_user:Kunal123@ac-bwzlk4f-shard-00-00.vnjyx9p.mongodb.net:27017,ac-bwzlk4f-shard-00-01.vnjyx9p.mongodb.net:27017,ac-bwzlk4f-shard-00-02.vnjyx9p.mongodb.net:27017/developer_meetups?ssl=true&replicaSet=atlas-nqkkc8-shard-0&authSource=admin&appName=Cluster0';
            await mongoose.connect(fallbackUri);
        } else {
            throw err;
        }
    }
};

module.exports = dbConnect;
