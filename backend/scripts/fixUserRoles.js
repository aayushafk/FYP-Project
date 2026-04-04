import mongoose from 'mongoose'
import User from '../models/User.js'
import dotenv from 'dotenv'

dotenv.config()

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/unityaid'

const fixUserRoles = async () => {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGO_URI)
    console.log('Connected to MongoDB')

    // Find all users with incorrect role casing
    const users = await User.find({})
    console.log(`Found ${users.length} users`)

    let updateCount = 0

    for (const user of users) {
      let needsUpdate = false
      let newRole = user.role

      // Fix role casing and naming
      if (user.role === 'User' || user.role === 'user') {
        newRole = 'citizen'
        needsUpdate = true
      } else if (user.role === 'Volunteer') {
        newRole = 'volunteer'
        needsUpdate = true
      } else if (user.role === 'Organizer') {
        newRole = 'organizer'
        needsUpdate = true
      } else if (user.role === 'Admin') {
        newRole = 'admin'
        needsUpdate = true
      }

      if (needsUpdate) {
        await User.updateOne(
          { _id: user._id },
          { $set: { role: newRole } }
        )
        console.log(`Updated user ${user.email}: ${user.role} → ${newRole}`)
        updateCount++
      }
    }

    console.log(`\n✅ Successfully updated ${updateCount} users`)
    console.log('All user roles are now properly formatted')

    mongoose.connection.close()
    process.exit(0)
  } catch (error) {
    console.error('Error fixing user roles:', error)
    process.exit(1)
  }
}

fixUserRoles()
