import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/unityaid';

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('TEST: Connected to MongoDB');
        process.exit(0);
    })
    .catch(err => {
        console.error('TEST: Connection error:', err);
        process.exit(1);
    });
