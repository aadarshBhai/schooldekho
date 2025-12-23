import express from 'express';
import { Comment } from '../models/Comment.js';
import { Event } from '../models/Event.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// POST /api/comments
router.post('/', auth, async (req, res) => {
  try {
    const { text, eventId, userName, userAvatar } = req.body;

    if (!text || !eventId) {
      return res.status(400).json({ message: 'Text and eventId are required' });
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const comment = new Comment({
      text,
      user: req.user._id,
      eventId,
      userName,
      userAvatar,
    });

    await comment.save();

    // Update comment count on the event
    await Event.findByIdAndUpdate(eventId, { $inc: { comments: 1 } });

    res.status(201).json(comment);
  } catch (err) {
    console.error('POST /api/comments error:', err.message);
    res.status(500).json({ message: 'Failed to create comment' });
  }
});

// GET /api/comments?eventId=...
router.get('/', async (req, res) => {
  try {
    const { eventId } = req.query;
    if (!eventId) {
      return res.status(400).json({ message: 'eventId is required' });
    }
    const comments = await Comment.find({ eventId })
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    console.error('GET /api/comments error:', err.message);
    res.status(500).json({ message: 'Failed to fetch comments' });
  }
});

// GET /api/comments/user/:userId - Fetch all comments made by a user
router.get('/user/:userId', async (req, res) => {
  try {
    const comments = await Comment.find({ user: req.params.userId })
      .sort({ createdAt: -1 });

    // Enrich with event titles if possible
    const enrichedComments = await Promise.all(comments.map(async (c) => {
      const event = await Event.findById(c.eventId).select('title');
      const commentObj = c.toObject();
      return {
        ...commentObj,
        id: c._id,
        eventTitle: event ? event.title : 'Deleted Event'
      };
    }));

    res.json(enrichedComments);
  } catch (err) {
    console.error('GET /api/comments/user/:userId error:', err.message);
    res.status(500).json({ message: 'Failed to fetch user comments' });
  }
});

// PUT /api/comments/:id - Edit a comment (owner only)
router.put('/:id', auth, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user owns this comment
    if (comment.user.toString() !== req.user._id) {
      return res.status(403).json({ message: 'Not authorized to edit this comment' });
    }

    comment.text = text.trim();
    await comment.save();

    res.json(comment);
  } catch (err) {
    console.error('PUT /api/comments/:id error:', err.message);
    res.status(500).json({ message: 'Failed to update comment' });
  }
});

// DELETE /api/comments/:id - Delete a comment (owner only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user owns this comment
    if (comment.user.toString() !== req.user._id) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    const eventId = comment.eventId;
    await Comment.deleteOne({ _id: comment._id });

    // Decrement comment count on the event
    await Event.findByIdAndUpdate(eventId, { $inc: { comments: -1 } });

    res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    console.error('DELETE /api/comments/:id error:', err.message);
    res.status(500).json({ message: 'Failed to delete comment' });
  }
});

export default router;

