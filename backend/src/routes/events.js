import express from 'express';
import jwt from 'jsonwebtoken';
import { Event } from '../models/Event.js';
import { upload } from '../config/cloudinary.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/events/user/liked/:userId - Fetch all events liked by a user
router.get('/user/liked/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // 1. Find all likes for this user
    const { Like } = await import('../models/Like.js');
    const userLikes = await Like.find({ user: userId }).select('eventId');

    if (userLikes.length === 0) {
      return res.json([]);
    }

    // 2. Extract event IDs
    const eventIds = userLikes.map(like => like.eventId);

    // 3. Fetch full event details for these IDs
    const events = await Event.find({ _id: { $in: eventIds } }).sort({ createdAt: -1 });

    res.json(events);
  } catch (err) {
    console.error('GET /api/events/user/liked/:userId error:', err.message);
    res.status(500).json({ message: 'Failed to fetch liked events' });
  }
});

// GET /api/events?query=...&category=...&mode=...&city=...
router.get('/', async (req, res) => {
  try {
    const {
      query = '',
      category = 'all',
      showAll,
      mode,
      city,
      eligibility,
      price,
      dateRange,
      entryType,
      subjectExpertise,
      experienceRequired,
      jobType
    } = req.query;

    // Optional Auth: Check for token to identify admin
    if (!req.user && req.header('Authorization')) {
      try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        if (decoded.userId) {
          const { default: User } = await import('../models/User.js');
          req.user = await User.findById(decoded.userId);
        } else if (decoded.isVirtual && decoded.role === 'admin') {
          req.user = { role: 'admin' };
        }
      } catch (err) {
        // Ignore invalid tokens for public list
      }
    }

    const isAdmin = req.user?.role === 'admin' || showAll === 'true';

    const filter = {};

    if (category !== 'all') filter.category = category;
    if (mode) filter.mode = mode;
    if (entryType) filter.entryType = entryType;
    if (subjectExpertise && subjectExpertise !== 'NA') filter.subjectExpertise = subjectExpertise;
    if (experienceRequired && experienceRequired !== 'NA') filter.experienceRequired = experienceRequired;
    if (jobType && jobType !== 'NA') filter.jobType = jobType;

    // Only show approved events to non-admin users
    if (!isAdmin) {
      filter.approved = true;
    }

    // City Filter
    if (city) {
      filter.location = { $regex: city, $options: 'i' };
    }

    // Eligibility Filter (Expected index in eligibility array)
    if (eligibility) {
      filter.eligibility = { $in: [eligibility] };
    }

    // Price Filter
    if (price === 'Free') {
      filter.registrationFee = 'Free';
    } else if (price === 'Paid') {
      filter.registrationFee = { $ne: 'Free' };
    }

    // Date Range Filter
    const now = new Date();
    if (dateRange === 'Today') {
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);
      filter.date = { $gte: now.toISOString().split('T')[0], $lte: todayEnd.toISOString().split('T')[0] };
    } else if (dateRange === 'This Weekend') {
      // Assuming today is Friday/Sat/Sun or getting next weekend
      const sunday = new Date(now);
      sunday.setDate(now.getDate() + (7 - now.getDay()) % 7);
      sunday.setHours(23, 59, 59, 999);
      filter.date = { $gte: now.toISOString().split('T')[0], $lte: sunday.toISOString().split('T')[0] };
    } else if (dateRange === 'Next 30 Days') {
      const thirtyDays = new Date(now);
      thirtyDays.setDate(now.getDate() + 30);
      filter.date = { $gte: now.toISOString().split('T')[0], $lte: thirtyDays.toISOString().split('T')[0] };
    }

    if (query.trim()) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { location: { $regex: query, $options: 'i' } },
          { teaser: { $regex: query, $options: 'i' } },
        ]
      });
    }

    let events;

    if (!isAdmin) {
      // For non-admin users, only show events from verified organizers
      const User = (await import('../models/User.js')).default;

      events = await Event.aggregate([
        {
          $addFields: {
            organizerObjectId: {
              $cond: {
                if: { $regexMatch: { input: '$organizerId', regex: /^[0-9a-fA-F]{24}$/ } },
                then: { $toObjectId: '$organizerId' },
                else: null
              }
            }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'organizerObjectId',
            foreignField: '_id',
            as: 'organizer'
          }
        },
        {
          $match: {
            $or: [
              { organizerId: 'admin-env' }, // System admin events
              { organizerId: { $exists: false } }, // Virtual admin events
              { 'organizer.verified': true }, // Verified organizer events
            ]
          }
        },
        { $sort: { createdAt: -1 } }
      ]);
    } else {
      // Admins can see all events
      events = await Event.find(filter).sort({ createdAt: -1 });
    }

    res.json(events);
  } catch (err) {
    console.error('GET /api/events error:', err);
    console.error('Error stack:', err.stack);
    console.error('Filter used:', JSON.stringify(filter, null, 2));
    console.error('Query params:', req.query);
    res.status(500).json({
      message: 'Failed to fetch events',
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// POST /api/events (create with image/video upload)
router.post('/', auth, upload.fields([{ name: 'images', maxCount: 6 }, { name: 'video', maxCount: 1 }]), async (req, res) => {
  try {
    // Check if user is verified (unless admin)
    if (req.user.role !== 'admin' && !req.user.verified) {
      return res.status(403).json({ message: 'First wait until admin verify you.' });
    }

    const {
      title,
      description,
      category,
      organizerId,
      organizerName,
      organizerAvatar,
      organizerEmail,
      location,
      date,

      approved = req.user.role === 'admin' || req.user.verified,
      isSponsored = false,
      teaser,
      subCategoryTags,
      mode,
      eligibility,
      registrationFee,
      prizePool,
      startTime,
      endTime,
      venueLink,
      entryType,
      subjectExpertise,
      experienceRequired,
      jobType,
    } = req.body;

    if (!title || !description || !category || !organizerId || !organizerName || !location || !date) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Enforce organizerId ownership for non-admins
    if (req.user.role !== 'admin' && organizerId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized: You can only create events for yourself.' });
    }

    // Check for files uploaded via Multer
    const files = req.files || {};
    let uploadedImages = files['images'] ? files['images'].map(f => f.path) : [];
    let uploadedVideo = files['video'] ? files['video'][0].path : '';

    // Fallback: Check if images/video were passed as URLs in the body (e.g. from separate upload flow)
    if (uploadedImages.length === 0 && req.body.images) {
      if (Array.isArray(req.body.images)) {
        uploadedImages = req.body.images;
      } else if (typeof req.body.images === 'string') {
        uploadedImages = [req.body.images];
      }
    }

    if (!uploadedVideo && req.body.video) {
      uploadedVideo = req.body.video;
    }

    // Determine media type based on uploads or body
    let finalMediaType = 'image';
    if (uploadedVideo) {
      finalMediaType = 'video';
    } else if (uploadedImages.length > 0) {
      finalMediaType = 'image';
    } else if (req.body.mediaType) {
      finalMediaType = req.body.mediaType;
    }

    const event = new Event({
      title,
      description,
      category,
      organizerId,
      organizerName,
      organizerAvatar,
      organizerEmail,
      images: uploadedImages,
      video: uploadedVideo,
      image: uploadedImages[0] || '', // Backward compatibility
      location,
      date,
      approved,
      isSponsored,
      mediaType: finalMediaType,
      teaser,
      subCategoryTags,
      mode,
      eligibility,
      registrationFee,
      prizePool,
      startTime,
      endTime,
      venueLink,
      entryType,
      subjectExpertise,
      experienceRequired,
      jobType,
    });

    await event.save();
    res.status(201).json(event);
  } catch (err) {
    console.error('POST /api/events error:', err.message);
    res.status(500).json({ message: 'Failed to create event', error: err.message });
  }
});

// POST /api/events/json (create without file upload, accepts JSON)
router.post('/json', auth, async (req, res) => {
  try {
    // Check if user is verified (unless admin)
    if (req.user.role !== 'admin' && !req.user.verified) {
      return res.status(403).json({ message: 'First wait until admin verify you.' });
    }

    const {
      title,
      description,
      category,
      organizerId,
      organizerName,
      organizerAvatar,
      organizerEmail,
      location,
      date,
      images = [],
      video = '',
      mediaType = 'image',
      approved = true,
      isSponsored = false,
      teaser,
      subCategoryTags,
      mode,
      eligibility,
      registrationFee,
      prizePool,
      startTime,
      endTime,
      venueLink,
      entryType,
      subjectExpertise,
      experienceRequired,
      jobType,
    } = req.body;

    if (!title || !description || !category || !organizerId || !organizerName || !location || !date) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Enforce organizerId ownership for non-admins
    if (req.user.role !== 'admin' && organizerId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized: You can only create events for yourself.' });
    }

    const event = new Event({
      title,
      description,
      category,
      organizerId,
      organizerName,
      organizerAvatar,
      organizerEmail,
      images,
      video,
      image: images[0] || '',
      location,
      date,
      approved,
      isSponsored,
      mediaType,
      teaser,
      subCategoryTags,
      mode,
      eligibility,
      registrationFee,
      prizePool,
      startTime,
      endTime,
      venueLink,
      entryType,
      subjectExpertise,
      experienceRequired,
      jobType,
    });

    await event.save();
    res.status(201).json(event);
  } catch (err) {
    console.error('POST /api/events/json error:', err.message);
    res.status(500).json({ message: 'Failed to create event', error: err.message });
  }
});

// GET /api/events/:id
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
  } catch (err) {
    console.error('GET /api/events/:id error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/events/:id (update event)
router.put('/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
  } catch (err) {
    console.error('PUT /api/events/:id error:', err.message);
    res.status(500).json({ message: 'Failed to update event' });
  }
});

// DELETE /api/events/:id
router.delete('/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    console.error('DELETE /api/events/:id error:', err.message);
    res.status(500).json({ message: 'Failed to delete event' });
  }
});

// POST /api/events/:id/like - Toggle like (add if not liked, remove if already liked)
router.post('/:id/like', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Import Like model dynamically to avoid circular dependency
    const { Like } = await import('../models/Like.js');

    // Check if user already liked this event
    const existingLike = await Like.findOne({ user: userId, eventId: req.params.id });

    if (existingLike) {
      // Unlike - remove the like
      await Like.deleteOne({ _id: existingLike._id });
      await Event.findByIdAndUpdate(req.params.id, { $inc: { likes: -1 } });
      res.json({ liked: false, likes: event.likes - 1 });
    } else {
      // Like - add new like
      const newLike = new Like({ user: userId, eventId: req.params.id });
      await newLike.save();
      await Event.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } });
      res.json({ liked: true, likes: event.likes + 1 });
    }
  } catch (err) {
    res.status(500).json({ message: 'Failed to toggle like' });
  }
});

// GET /api/events/:id/like-status - Check if user liked this event
router.get('/:id/like-status', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.json({ liked: false });
    }

    const { Like } = await import('../models/Like.js');
    const existingLike = await Like.findOne({ user: userId, eventId: req.params.id });

    res.json({ liked: !!existingLike });
  } catch (err) {
    console.error('GET /api/events/:id/like-status error:', err.message);
    res.status(500).json({ message: 'Failed to check like status' });
  }
});

// POST /api/events/:id/share - Increment share count
router.post('/:id/share', async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { $inc: { shares: 1 } },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ shares: event.shares });
  } catch (err) {
    console.error('POST /api/events/:id/share error:', err.message);
    res.status(500).json({ message: 'Failed to increment shares' });
  }
});

export default router;

