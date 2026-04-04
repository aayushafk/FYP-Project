import express from 'express';
import Request from '../models/Request.js';
import jwt from 'jsonwebtoken';

import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Middleware to verify token and attach user to req
const protect = authMiddleware;

// @desc    Create a new help request
// @route   POST /api/requests
// @access  Private (User)
router.post('/', protect, async (req, res) => {
    try {
        const { title, description, category, image, location } = req.body;

        const request = new Request({
            title,
            description,
            category,
            image,
            location,
            createdBy: req.userId // authMiddleware attaches userId
        });

        const createdRequest = await request.save();
        res.status(201).json(createdRequest);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @desc    Get logged in user's requests
// @route   GET /api/requests/my-requests
// @access  Private
router.get('/my-requests', protect, async (req, res) => {
    try {
        const requests = await Request.find({ createdBy: req.userId }).sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @desc    Get request details
// @route   GET /api/requests/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const request = await Request.findById(req.params.id)
            .populate('createdBy', 'fullName email phoneNumber')
            .populate('assignedTo', 'fullName email phoneNumber');

        if (request) {
            res.json(request);
        } else {
            res.status(404).json({ message: 'Request not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

export default router;
