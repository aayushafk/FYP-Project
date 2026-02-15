import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import Event from '../models/Event.js';

const router = express.Router();

// Middleware: All routes require authentication
router.use(authMiddleware);

// Configure multer for file uploads
const uploadDir = 'uploads/images';

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'img-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    // Allow only image files
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// POST /api/upload/image - Upload an image
router.post('/image', upload.single('image'), async (req, res) => {
  try {
    const { eventId } = req.body;

    // Validate eventId
    if (!eventId) {
      // Remove uploaded file if no eventId
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: 'Event ID is required' });
    }

    // Verify event exists and user is participant
    const event = await Event.findById(eventId);
    if (!event) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }

    // Generate URL for the uploaded image
    const imageUrl = `/uploads/images/${req.file.filename}`;

    res.json({
      success: true,
      imageUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    // Clean up uploaded file if error occurs
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('Error uploading image:', error);
    res.status(500).json({
      message: 'Error uploading image',
      error: error.message
    });
  }
});

// DELETE /api/upload/image/:fileName - Delete an image
router.delete('/image/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;
    const filePath = path.join(uploadDir, fileName);

    // Validate fileName to prevent directory traversal
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      return res.status(400).json({ message: 'Invalid file name' });
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Delete the file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({
      message: 'Error deleting image',
      error: error.message
    });
  }
});

export default router;
