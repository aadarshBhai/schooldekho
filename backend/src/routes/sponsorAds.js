import express from 'express';
import mongoose from 'mongoose';
import { SponsorAd } from '../models/SponsorAd.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/ads/active - Fetch all currently active ads and upcoming ads
router.get('/active', async (req, res) => {
    try {
        const now = new Date();
        const activeAds = await SponsorAd.find({
            $or: [
                // Currently active ads
                {
                    startDate: { $lte: now },
                    endDate: { $gte: now }
                },
                // Upcoming ads (show future ads to users)
                {
                    startDate: { $gt: now },
                    endDate: { $gte: now }
                }
            ]
        }).sort({ startDate: 1, createdAt: -1 }); // Sort by start date first, then creation date

        res.json(activeAds);
    } catch (err) {
        console.error('GET /api/ads/active error:', err.message);
        res.status(500).json({ message: 'Failed to fetch active ads' });
    }
});

// GET /api/ads/all - Fetch all ads (including future ones) for testing
router.get('/all', async (req, res) => {
    try {
        const allAds = await SponsorAd.find().sort({ createdAt: -1 });
        res.json(allAds);
    } catch (err) {
        console.error('GET /api/ads/all error:', err.message);
        res.status(500).json({ message: 'Failed to fetch all ads' });
    }
});

// GET /api/ads - Admin only: view all ads
router.get('/', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    try {
        const ads = await SponsorAd.find().sort({ createdAt: -1 });
        res.json(ads);
    } catch (err) {
        console.error('GET /api/ads error:', err);
        console.error('Error stack:', err.stack);
        res.status(500).json({
            message: 'Failed to fetch all ads',
            error: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

// POST /api/ads - Admin only: create new ad
router.post('/', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    try {
        // Convert date strings to Date objects if needed
        const adData = {
            ...req.body
        };

        // Only set createdBy if user has a valid ObjectId (not virtual admin)
        if (req.user._id && req.user._id !== 'admin-env' && mongoose.Types.ObjectId.isValid(req.user._id)) {
            adData.createdBy = req.user._id;
        }

        // Ensure dates are Date objects
        if (adData.startDate && typeof adData.startDate === 'string') {
            adData.startDate = new Date(adData.startDate);
        }
        if (adData.endDate && typeof adData.endDate === 'string') {
            adData.endDate = new Date(adData.endDate);
        }

        const ad = new SponsorAd(adData);
        await ad.save();
        res.status(201).json(ad);
    } catch (err) {
        console.error('POST /api/ads error:', err);
        console.error('Error stack:', err.stack);
        console.error('Request body:', req.body);
        res.status(400).json({
            message: 'Failed to create ad',
            error: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

// DELETE /api/ads/:id - Admin only: delete ad
router.delete('/:id', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    try {
        const ad = await SponsorAd.findByIdAndDelete(req.params.id);
        if (!ad) return res.status(404).json({ message: 'Ad not found' });
        res.json({ message: 'Ad deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete ad' });
    }
});

export default router;
