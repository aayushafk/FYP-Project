import '../config/env.js'
import mongoose from 'mongoose'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/unityaid'
console.log('Connecting to:', MONGO_URI.startsWith('mongodb+srv') ? 'ATLAS (' + MONGO_URI.substring(0, 50) + '...)' : 'LOCAL: ' + MONGO_URI)

await mongoose.connect(MONGO_URI)
const User = mongoose.model('User', new mongoose.Schema({ email: String, role: String, fullName: String }, { strict: false }))
const users = await User.find({}, 'email role fullName').limit(20)
console.log('\nUsers in DB:', users.length)
users.forEach(u => console.log(' -', u.email, '|', u.role, '|', u.fullName))
await mongoose.disconnect()
