import mongoose from 'mongoose'
import User from '../models/User.js'
import dotenv from 'dotenv'

dotenv.config()

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/unityaid'

const checkUsers = async () => {
  try {
    await mongoose.connect(MONGO_URI)
    
    const users = await User.find({}, 'email role').sort('role')
    const grouped = users.reduce((acc, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1
      return acc
    }, {})
    
    console.log('✅ Users by role:', grouped)
    console.log('\n📋 Sample users for testing:')
    
    const samples = await User.find({}, 'email role').limit(6)
    samples.forEach(u => console.log(`  - Email: ${u.email}, Role: ${u.role}`))
    
    mongoose.connection.close()
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

checkUsers()
