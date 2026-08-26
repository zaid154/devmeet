const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();

const dbConnect = async () => {
    const mongoUri = process.env.MONGO_URI || 'mongodb://kunal336552_db_user:Kunal123@ac-bwzlk4f-shard-00-00.vnjyx9p.mongodb.net:27017,ac-bwzlk4f-shard-00-01.vnjyx9p.mongodb.net:27017,ac-bwzlk4f-shard-00-02.vnjyx9p.mongodb.net:27017/developer_meetups?ssl=true&replicaSet=atlas-nqkkc8-shard-0&authSource=admin&appName=Cluster0';
    await mongoose.connect(mongoUri);
};

module.exports = dbConnect;
