import express from 'express';
import Post from '../models/Post.js';
import { auth } from '../middleware/auth.js';
import { admin } from '../middleware/roles.js';

const router = express.Router();

// Create a new post (Admin only)
router.post('/', auth, admin, async (req, res) => {
  try {
    const { title, content, image } = req.body;
    
    const post = new Post({
      title,
      content,
      image,
      createdBy: req.user.id
    });

    await post.save();
    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all active posts (Public)
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find({ isActive: true })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email');
    
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single post (Public)
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, isActive: true })
      .populate('createdBy', 'name email');
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    res.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update post (Admin only)
router.put('/:id', auth, admin, async (req, res) => {
  try {
    const { title, content, image, isActive } = req.body;
    
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    post.title = title || post.title;
    post.content = content || post.content;
    post.image = image !== undefined ? image : post.image;
    post.isActive = isActive !== undefined ? isActive : post.isActive;
    post.updatedAt = Date.now();
    
    await post.save();
    
    res.json(post);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete post (Admin only)
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    // Soft delete by marking as inactive
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
