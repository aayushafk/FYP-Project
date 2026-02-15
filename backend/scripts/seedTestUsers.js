import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from '../models/User.js'

dotenv.config()

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/unityaid'

const testUsers = [
  {
    fullName: 'Test Citizen',
    email: 'citizen@test.com',
    password: 'password123',
    role: 'citizen',
    phoneNumber: '1234567890',
    isVerified: true,
    isAdminVerified: true
  },
  {
    fullName: 'Test Volunteer',
    email: 'volunteer@test.com',
    password: 'password123',
    role: 'volunteer',
    phoneNumber: '0987654321',
    skills: ['First Aid', 'General Support'],
    isVerified: true,
    isAdminVerified: true
  },
  {
    fullName: 'Test Organizer',
    email: 'organizer@test.com',
    password: 'password123',
    role: 'organizer',
    organizationName: 'Test Organization',
    registrationNumber: 'ORG123456',
    officialEmail: 'official@testorg.com',
    organizationAddress: '123 Main St, Test City',
    contactNumber: '1111111111',
    isVerified: true,
    isAdminVerified: true
  }
]

const seedTestUsers = async () => {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGO_URI)
    console.log('✓ Connected to MongoDB')

    // Delete existing test users
    console.log('\nClearing existing test users...')
    await User.deleteMany({ email: { $in: testUsers.map(u => u.email) } })
    console.log('✓ Cleared existing test users')

    // Create new test users
    console.log('\nCreating test users...')
    for (const userData of testUsers) {
      const user = new User(userData)
      await user.save()
      console.log(`✓ Created ${userData.role}: ${userData.email}`)
    }

    console.log('\n' + '='.repeat(50))
    console.log('TEST USERS CREATED SUCCESSFULLY')
    console.log('='.repeat(50))
    console.log('\nYou can now login with these credentials:')
    console.log('\n1. CITIZEN:')
    console.log('   Email: citizen@test.com')
    console.log('   Password: password123')
    console.log('\n2. VOLUNTEER:')
    console.log('   Email: volunteer@test.com')
    console.log('   Password: password123')
    console.log('   Skills: First Aid, General Support')
    console.log('\n3. ORGANIZER:')
    console.log('   Email: organizer@test.com')
    console.log('   Password: password123')
    console.log('='.repeat(50) + '\n')

    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding test users:', error.message)
    process.exit(1)
  }
}

seedTestUsers()
