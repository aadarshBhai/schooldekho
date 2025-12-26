import express from 'express';
import jwt from 'jsonwebtoken';
import { Announcement } from '../models/Announcement.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/announcements - Get all active announcements (public)
router.get('/', async (req, res) => {
  try {
    const { category, limit = 10 } = req.query;
    
    let query = { isActive: true };
    
    // Add category filter if specified
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Don't show expired announcements
    query.$or = [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ];
    
    const announcements = await Announcement
      .find(query)
      .sort({ priority: -1, createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json(announcements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ message: 'Failed to fetch announcements' });
  }
});

// GET /api/announcements/:id - Get single announcement
router.get('/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    
    // Increment views
    await Announcement.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    
    res.json(announcement);
  } catch (error) {
    console.error('Error fetching announcement:', error);
    res.status(500).json({ message: 'Failed to fetch announcement' });
  }
});

// POST /api/announcements - Create new announcement (admin only)
router.post('/', auth, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user is admin
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can create announcements' });
    }
    
    const {
      title,
      content,
      link,
      category,
      priority,
      tags,
      expiresAt
    } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }
    
    const announcement = new Announcement({
      title,
      content,
      link,
      category,
      priority,
      tags,
      expiresAt,
      authorId: decoded.id,
      authorName: decoded.name || 'Admin',
      authorEmail: decoded.email
    });
    
    await announcement.save();
    res.status(201).json(announcement);
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ message: 'Failed to create announcement' });
  }
});

// PUT /api/announcements/:id - Update announcement (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user is admin
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can update announcements' });
    }
    
    const announcement = await Announcement.findById(req.params.id);
    
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    
    const {
      title,
      content,
      link,
      category,
      priority,
      isActive,
      tags,
      expiresAt
    } = req.body;
    
    if (title) announcement.title = title;
    if (content) announcement.content = content;
    if (link !== undefined) announcement.link = link;
    if (category) announcement.category = category;
    if (priority) announcement.priority = priority;
    if (isActive !== undefined) announcement.isActive = isActive;
    if (tags) announcement.tags = tags;
    if (expiresAt !== undefined) announcement.expiresAt = expiresAt;
    
    await announcement.save();
    res.json(announcement);
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ message: 'Failed to update announcement' });
  }
});

// DELETE /api/announcements/:id - Delete announcement (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user is admin
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete announcements' });
    }
    
    const announcement = await Announcement.findById(req.params.id);
    
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ message: 'Failed to delete announcement' });
  }
});

// POST /api/announcements/:id/click - Track link clicks
router.post('/:id/click', async (req, res) => {
  try {
    await Announcement.findByIdAndUpdate(req.params.id, { $inc: { clicks: 1 } });
    res.json({ message: 'Click tracked successfully' });
  } catch (error) {
    console.error('Error tracking click:', error);
    res.status(500).json({ message: 'Failed to track click' });
  }
});

// GET /api/announcements/admin/all - Get all announcements (admin only)
router.get('/admin/all', auth, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user is admin
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can view all announcements' });
    }
    
    const announcements = await Announcement
      .find()
      .sort({ createdAt: -1 });
    
    res.json(announcements);
  } catch (error) {
    console.error('Error fetching all announcements:', error);
    res.status(500).json({ message: 'Failed to fetch announcements' });
  }
});

export default router;
