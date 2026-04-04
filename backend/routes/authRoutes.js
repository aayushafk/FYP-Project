import express from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import Notification from '../models/Notification.js'
import { authMiddleware } from '../middlewares/authMiddleware.js'
import { JWT_SECRET } from '../config/env.js'

const router = express.Router()

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: '30d'
  })
}

// Register
router.post('/register', async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      role,
      skills,
      phoneNumber,
      organizationName,
      registrationNumber,
      officialEmail,
      organizationAddress,
      contactNumber
    } = req.body

    // Validation
    if (!fullName || !email || !password || !role) {
      return res.status(400).json({
        message: 'Please provide all required fields'
      })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        message: 'User with this email already exists'
      })
    }

    // Validate role
    const validRoles = ['citizen', 'volunteer', 'organizer']
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        message: 'Invalid role selected'
      })
    }

    // Validate phone number for citizen and volunteer
    if ((role === 'citizen' || role === 'volunteer') && !phoneNumber) {
      return res.status(400).json({
        message: 'Phone number is required for Citizens and Volunteers'
      })
    }

    // Validate skills for volunteers
    if (role === 'volunteer') {
      console.log('Validating volunteer skills:', skills)
      
      if (!skills) {
        return res.status(400).json({
          message: 'Skills are required for volunteers',
          code: 'NO_SKILLS'
        })
      }

      if (!Array.isArray(skills)) {
        console.error('Skills is not an array:', typeof skills, skills)
        return res.status(400).json({
          message: 'Skills must be provided as an array',
          code: 'SKILLS_NOT_ARRAY',
          received: typeof skills
        })
      }

      if (skills.length === 0) {
        return res.status(400).json({
          message: 'Please select at least one skill',
          code: 'NO_SKILLS_SELECTED'
        })
      }

      // Validate that all provided skills are from the valid list
      const SKILL_LIST = [
        'General Support',
        'First Aid',
        'Medical Assistance',
        'Food Distribution',
        'Logistics & Transport',
        'Crowd Management',
        'Teaching & Tutoring',
        'Disaster Relief',
        'Counseling Support',
        'Technical Support',
        'Translation'
      ];
      
      const invalidSkills = skills.filter(skill => !SKILL_LIST.includes(skill));
      if (invalidSkills.length > 0) {
        console.error('Invalid skills provided:', invalidSkills)
        return res.status(400).json({
          message: `Invalid skills: ${invalidSkills.join(', ')}`,
          code: 'INVALID_SKILLS',
          validSkills: SKILL_LIST,
          invalidSkills: invalidSkills
        })
      }

      console.log('Skills validation passed for:', skills)
    }

    // Validate organizer fields
    if (role === 'organizer') {
      if (!organizationName || !registrationNumber || !officialEmail || !organizationAddress || !contactNumber) {
        return res.status(400).json({
          message: 'All organizer fields are required'
        })
      }

      // Check if official email already exists
      const existingOrgEmail = await User.findOne({ officialEmail })
      if (existingOrgEmail) {
        return res.status(400).json({
          message: 'Organization with this official email already exists'
        })
      }
    }

    // Create user
    const userData = {
      fullName,
      email,
      password,
      role
    }

    // Add phone number for citizen and volunteer
    if (role === 'citizen' || role === 'volunteer') {
      userData.phoneNumber = phoneNumber
    }

    // Add skills for volunteer
    if (role === 'volunteer' && skills) {
      userData.skills = skills
    }

    // Add organizer fields
    if (role === 'organizer') {
      userData.organizationName = organizationName
      userData.registrationNumber = registrationNumber
      userData.officialEmail = officialEmail
      userData.organizationAddress = organizationAddress
      userData.contactNumber = contactNumber
    }

    const user = new User(userData)
    await user.save()

    // If organizer, notify admin
    if (role === 'organizer') {
      try {
        const admins = await User.find({ role: 'admin' });
        for (const admin of admins) {
          await Notification.create({
            user: admin._id,
            type: 'organizer_registration',
            message: `New organizer registration: ${fullName} (${organizationName})`,
            relatedId: user._id
          });
        }
      } catch (notifyError) {
        console.error('Failed to notify admins of new organizer:', notifyError);
      }
    }

    // Generate token
    const token = generateToken(user._id)

    // Return user data (password excluded by toJSON method)
    const userResponse = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      skills: user.skills,
      isVerified: user.isVerified,
      isAdminVerified: user.isAdminVerified
    }

    // Add role-specific fields to response
    if (user.phoneNumber) userResponse.phoneNumber = user.phoneNumber
    if (user.organizationName) userResponse.organizationName = user.organizationName
    if (user.registrationNumber) userResponse.registrationNumber = user.registrationNumber
    if (user.officialEmail) userResponse.officialEmail = user.officialEmail
    if (user.organizationAddress) userResponse.organizationAddress = user.organizationAddress
    if (user.contactNumber) userResponse.contactNumber = user.contactNumber

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: userResponse
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({
      message: 'Server error during registration',
      error: error.message
    })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body

    console.log('Login attempt:', { email, role, passwordLength: password?.length })

    // Validation
    if (!email || !password || !role) {
      console.log('Missing fields:', { email: !!email, password: !!password, role: !!role })
      return res.status(400).json({
        message: 'Please provide email, password, and role'
      })
    }

    // Find user
    const user = await User.findOne({ email })
    if (!user) {
      console.log('User not found:', email)
      return res.status(401).json({
        message: 'Invalid credentials'
      })
    }

    console.log('User found:', { email: user.email, role: user.role })

    // Check role match
    if (user.role.toLowerCase() !== role.toLowerCase()) {
      console.log('Role mismatch:', { expected: user.role, received: role })
      return res.status(401).json({
        message: 'Invalid credentials'
      })
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password)
    console.log('Password validation:', isPasswordValid)
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid credentials'
      })
    }

    // Generate token
    const token = generateToken(user._id)

    // Return user data
    const userResponse = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      skills: user.skills,
      isVerified: user.isVerified,
      isAdminVerified: user.isAdminVerified
    }

    // Add role-specific fields to response
    if (user.phoneNumber) userResponse.phoneNumber = user.phoneNumber
    if (user.organizationName) userResponse.organizationName = user.organizationName
    if (user.registrationNumber) userResponse.registrationNumber = user.registrationNumber
    if (user.officialEmail) userResponse.officialEmail = user.officialEmail
    if (user.organizationAddress) userResponse.organizationAddress = user.organizationAddress
    if (user.contactNumber) userResponse.contactNumber = user.contactNumber

    res.json({
      message: 'Login successful',
      token,
      user: userResponse
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      message: 'Server error during login',
      error: error.message
    })
  }
})

// Admin Login
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        message: 'Please provide email and password'
      })
    }

    // Find user
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({
        message: 'Invalid credentials'
      })
    }

    // Check if user is Admin
    if (user.role.toLowerCase() !== 'admin') {
      return res.status(401).json({
        message: 'Invalid credentials'
      })
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid credentials'
      })
    }

    // Generate token
    const token = generateToken(user._id)

    // Return user data
    const userResponse = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      isAdminVerified: user.isAdminVerified
    }

    res.json({
      message: 'Admin login successful',
      token,
      user: userResponse
    })
  } catch (error) {
    console.error('Admin login error:', error)
    res.status(500).json({
      message: 'Server error during admin login',
      error: error.message
    })
  }
})

// Get current user (protected route)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password')
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.json({ user })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({
      message: 'Server error',
      error: error.message
    })
  }
})

export default router

