import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import User from '../models/User.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/unityaid';

const adminData = {
    fullName: 'Admin User',
    email: 'admin@unityaid.org',
    password: 'adminpassword123',
    role: 'admin',
    isVerified: true,
    isAdminVerified: true
};

const logResult = (message) => {
    console.log(message);
    try {
        fs.appendFileSync('seed_result.txt', message + '\n');
    } catch (e) {
        // ignore
    }
}

const seedAdmin = async () => {
    try {
        logResult('Scripts started...');
        await mongoose.connect(MONGO_URI);
        logResult('Connected to MongoDB');

        // Delete existing admin to ensure clean state
        const deleted = await User.deleteOne({ email: adminData.email });
        if (deleted.deletedCount > 0) {
            logResult('Removed existing admin user');
        }

        const admin = new User(adminData);
        await admin.save();
        logResult('Admin user created successfully');
        logResult(`Email: ${adminData.email}`);
        logResult(`Password: ${adminData.password}`);
        process.exit(0);
    } catch (error) {
        logResult(`Error seeding admin: ${error.message}`);
        process.exit(1);
    }
};

seedAdmin();
