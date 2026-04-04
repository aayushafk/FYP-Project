import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/unityaid';

const checkAdmin = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const admins = await User.find({ role: 'Admin' });
        console.log(`Found ${admins.length} admin(s):`);
        admins.forEach(admin => {
            console.log(`- ${admin.email} (Verified: ${admin.isVerified})`);
        });

        if (admins.length === 0) {
            console.log('No admin users found!');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error checking admin:', error);
        process.exit(1);
    }
};

checkAdmin();
