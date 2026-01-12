import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const auth = async (req, res, next) => {
  try {
    console.log(`[Auth] ${req.method} ${req.path} - Checking authorization...`);
    const authHeader = req.header('Authorization');
    console.log('[Auth] Authorization header:', authHeader ? 'Present' : 'Missing');

    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      console.log('[Auth] No token provided');
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    console.log('[Auth] Token received (first 20 chars):', token.substring(0, 20) + '...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    console.log('[Auth] Token decoded successfully:', { userId: decoded.userId, role: decoded.role, isVirtual: decoded.isVirtual });

    let user;
    if (decoded.userId) {
      console.log('[Auth] Looking up user by ID:', decoded.userId);
      user = await User.findById(decoded.userId);
      console.log('[Auth] User found:', user ? `${user.name} (${user.email})` : 'Not found');
    } else if (decoded.isVirtual && decoded.role === 'admin') {
      // Handle the virtual System Admin from environment configuration
      console.log('[Auth] Virtual admin detected');
      user = {
        _id: 'admin-env',
        email: decoded.email,
        role: 'admin',
        verified: true,
        name: 'System Admin'
      };
    }

    if (!user) {
      console.log('[Auth] User not found in database');
      return res.status(401).json({ message: 'Token is not valid' });
    }

    console.log('[Auth] Authentication successful for:', user.name);
    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    console.error('[Auth] Authentication error:', err.message);
    console.error('[Auth] Full error:', err);
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token is malformed' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    res.status(500).json({
      message: 'Authentication Server Error',
      error: err.message
    });
  }
};

export const admin = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  } catch (err) {
    console.error('Admin middleware error:', err);
    res.status(500).json({
      message: 'Server error',
      error: err.message
    });
  }
};
