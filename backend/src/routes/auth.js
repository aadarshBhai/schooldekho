import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import PasswordResetToken from '../models/PasswordResetToken.js';
import { Event } from '../models/Event.js';
import { Comment } from '../models/Comment.js';
import { Like } from '../models/Like.js';
import nodemailer from 'nodemailer';
import { auth } from '../middleware/auth.js';

// Create a transporter for sending emails
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const {
      name, email, password, role, type,
      designation, schoolName, schoolAddress, verificationFile,
      principalName, socialLinks, preferredCommunication, phone, bio, website,
      userSubtype, grade, interests, parentalConsent, childPhone
    } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role: role || 'user',
      type: type || null,
      verified: role === 'admin', // Auto-verify admin users
      designation,
      schoolName,
      schoolAddress,
      verificationFile,
      principalName,
      socialLinks,
      preferredCommunication,
      phone,
      bio,
      website,
      userSubtype,
      grade,
      interests,
      parentalConsent,
      childPhone
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: user.verified,
        type: user.type,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: user.verified,
        type: user.type,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Forgot password endpoint
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate and save password reset token
    const token = PasswordResetToken.generateToken();
    await PasswordResetToken.create({
      userId: user._id,
      token,
    });

    // Send password reset email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    await transporter.sendMail({
      from: `"EventDekho" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset password endpoint
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    // Find the token
    const resetToken = await PasswordResetToken.findOne({ token }).populate('userId');
    if (!resetToken) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Check if token is expired
    if (resetToken.expiresAt < new Date()) {
      await PasswordResetToken.deleteOne({ _id: resetToken._id });
      return res.status(400).json({ message: 'Token has expired' });
    }

    // Update user's password
    const user = resetToken.userId;
    user.password = password;
    await user.save();

    // Delete the used token
    await PasswordResetToken.deleteOne({ _id: resetToken._id });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin login (Unified for environment-configured admin and database admins)
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check if it's the System Admin from .env
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign(
        { email, role: 'admin', isVirtual: true },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );
      return res.json({
        token,
        user: {
          id: 'admin-env',
          email,
          name: 'System Admin',
          role: 'admin',
          verified: true
        }
      });
    }

    // 2. Otherwise, check if it's a database-registered admin
    const user = await User.findOne({ email, role: 'admin' });
    if (!user) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: user.verified
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error during admin login' });
  }
});

// Get current user's profile (authenticated user)
router.get('/profile', auth, async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return profile data with defaults for optional fields
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: user.verified,
        type: user.type || null,
        avatar: user.avatar || null,
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        phone: user.phone || ''
      }
    });
  } catch (error) {
    console.error('Fetch current profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get any user's public profile
router.get('/profile/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email, // public for now, but could be hidden
      role: user.role,
      verified: user.verified,
      type: user.type,
      avatar: user.avatar,
      bio: user.bio,
      location: user.location,
      website: user.website,
      phone: user.phone
    });
  } catch (error) {
    console.error('Fetch profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user profile and all associated data (Cascade delete)
router.delete('/profile', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    // Prevent virtual admin from trying to delete from DB
    if (userId === 'admin-env') {
      return res.status(403).json({ message: 'System Admin account cannot be deleted via the API.' });
    }

    // 1. Delete all password reset tokens for this user
    await PasswordResetToken.deleteMany({ userId });

    // 2. Delete all comments made by this user
    // Note: We might want to decrement comment counts on events, but for simplicity we'll just delete the comments
    await Comment.deleteMany({ user: userId });

    // 3. Delete all likes made by this user
    // Note: Like above, we could decrement like counts, but we'll focus on data removal first
    await Like.deleteMany({ user: userId });

    // 4. Delete all events organized by this user
    await Event.deleteMany({ organizerId: userId.toString() });

    // 5. Delete the user themselves
    await User.findByIdAndDelete(userId);

    res.json({ message: 'Account and all associated data deleted successfully' });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ message: 'Server error during account deletion' });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, avatar, bio, location, website, phone } = req.body;

    // Prevent virtual admin from trying to update in DB
    if (userId === 'admin-env') {
      return res.json({
        message: 'Profile updated successfully',
        user: {
          id: 'admin-env',
          name: name || req.user.name,
          email: req.user.email,
          role: 'admin',
          verified: true,
          type: null,
          avatar: avatar || null,
          bio: bio || '',
          location: location || '',
          website: website || '',
          phone: phone || ''
        }
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (website !== undefined) user.website = website;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: user.verified,
        type: user.type,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        website: user.website,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error during profile update' });
  }
});

export default router;
