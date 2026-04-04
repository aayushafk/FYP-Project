import mongoose from 'mongoose';
import User from '../models/User.js';

const MONGO_URI = 'mongodb://127.0.0.1:27017/unityaid';

const fixAdmin = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✓ Connected to MongoDB');

        // Delete admin if exists
        console.log('Checking for existing admin...');
        const deleted = await User.deleteOne({ email: 'admin@unityaid.org' });
        if (deleted.deletedCount > 0) {
            console.log('✓ Removed existing admin user');
        }

        // Create new admin with all required fields
        console.log('Creating admin user...');
        const adminData = {
            fullName: 'Admin User',
            email: 'admin@unityaid.org',
            password: 'adminpassword123',
            role: 'admin',
            isVerified: true,
            isAdminVerified: true
        };

        const admin = new User(adminData);
        await admin.save();
        console.log('✓ Admin user created successfully');
        console.log(`  Email: ${admin.email}`);
        console.log(`  Role: ${admin.role}`);
        console.log(`  ID: ${admin._id}`);

        // Verify it was saved correctly
        const verify = await User.findOne({ email: 'admin@unityaid.org' });
        if (verify) {
            console.log('✓ Verification: Admin user confirmed in database');
            console.log(`  Stored role: ${verify.role}`);
            console.log(`  Is Admin: ${verify.role === 'admin'}`);
        }

        console.log('\n✅ Admin setup complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

fixAdmin();
