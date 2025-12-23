import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');

    let user;
    if (decoded.userId) {
      user = await User.findById(decoded.userId);
    } else if (decoded.isVirtual && decoded.role === 'admin') {
      // Handle the virtual System Admin from environment configuration
      user = {
        _id: 'admin-env',
        email: decoded.email,
        role: 'admin',
        verified: true,
        name: 'System Admin'
      };
    }

    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    console.error('Auth middleware full error:', err);
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
