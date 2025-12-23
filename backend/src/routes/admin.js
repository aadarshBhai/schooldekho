import express from 'express';
import User from '../models/User.js';
import { Event } from '../models/Event.js';
import { auth, admin } from '../middleware/auth.js';
import { sendVerificationEmail } from '../services/emailService.js';

const router = express.Router();

// Middleware to ensure all routes in this file are protected and admin-only
router.use(auth, admin);

// GET /api/admin/users?status=pending
// Fetch users based on verification status
router.get('/users', async (req, res) => {
    try {
        const { status } = req.query;
        const filter = {};

        if (status === 'pending') {
            filter.role = 'organizer';
            filter.verified = false;
        } else if (status === 'verified') {
            filter.role = 'organizer';
            filter.verified = true;
        }

        const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        console.error('GET /api/admin/users error:', err);
        console.error('Error stack:', err.stack);
        console.error('Filter used:', filter);
        res.status(500).json({
            message: 'Failed to fetch users',
            error: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

// GET /api/admin/stats
// Fetch dashboard statistics
router.get('/stats', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const verifiedOrgs = await User.countDocuments({ role: 'organizer', verified: true });
        const eventsPosted = await Event.countDocuments();

        // Mocking growth data for now as we don't have historical tracking in this simple schema yet
        // In a real app, you'd query based on createdAt timestamps
        const stats = {
            totalUsers,
            verifiedOrgs,
            eventsPosted,
            registrationsGrowth: 23, // Mock
            eventCreationGrowth: 18, // Mock
            engagementGrowth: 31     // Mock
        };

        res.json(stats);
    } catch (err) {
        console.error('GET /api/admin/stats error:', err);
        res.status(500).json({ message: 'Failed to fetch stats' });
    }
});

// PUT /api/admin/users/:id/verify
// Verify (approve) or Reject (unverify) a user
router.put('/users/:id/verify', async (req, res) => {
    try {
        const { verified } = req.body; // true or false
        const userId = req.params.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.verified = verified;
        await user.save();

        // Send email notification if verifying
        if (verified) {
            sendVerificationEmail(user.email, user.name).catch(err => console.error('Failed to send email async:', err));
        }

        res.json({
            message: `User ${verified ? 'verified' : 'rejected'} successfully`,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                verified: user.verified,
                type: user.type
            }
        });
    } catch (err) {
        console.error('PUT /api/admin/users/:id/verify error:', err);
        console.error('Error stack:', err.stack);
        res.status(500).json({
            message: 'Failed to update user verification',
            error: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

// DELETE /api/admin/users/:id
// Delete a user and all their associated events
router.delete('/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        // 1. Delete all events associated with this user
        await Event.deleteMany({ organizerId: userId });

        // 2. Delete the user
        const user = await User.findByIdAndDelete(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User and associated events deleted successfully' });
    } catch (err) {
        console.error('DELETE /api/admin/users/:id error:', err);
        console.error('Error stack:', err.stack);
        res.status(500).json({
            message: 'Failed to delete user and events',
            error: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

export default router;
