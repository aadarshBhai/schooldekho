import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import eventsRouter from './routes/events.js';
import authRouter from './routes/auth.js';
import commentsRouter from './routes/comments.js';
import uploadRouter from './routes/upload.js';
import participationRouter from './routes/participation.js';
import adminRouter from './routes/admin.js';
import adsRouter from './routes/sponsorAds.js';

const app = express();
const PORT = process.env.PORT || 5000;

// CORS setup based on comma-separated FRONTEND_URLS
const allowedOrigins = (process.env.FRONTEND_URLS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser tools (no origin)
    if (!origin) return callback(null, true);
    
    // In production, allow specific origins
    if (process.env.NODE_ENV === 'production') {
      const allowedOrigins = (process.env.FRONTEND_URLS || 'https://schooldekho.netlify.app')
        .split(',')
        .map(o => o.trim())
        .filter(Boolean);
      
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.log('CORS blocked origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    }
    
    // In development, allow all origins
    return callback(null, true);
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// API routes
app.use('/api/events', eventsRouter);
app.use('/api/auth', authRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/participation', participationRouter);
app.use('/api/admin', adminRouter);
app.use('/api/ads', adsRouter);

// MongoDB connection
if (!process.env.MONGO_URI) {
  console.warn('MONGO_URI is not set. MongoDB will not be connected.');
} else {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err.message));
}

// Simple mailer using SMTP env vars
const createTransporter = () => {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const mailer = createTransporter();

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    env: 'backend',
    port: PORT,
  });
});

// Example route that sends a test email (if mailer configured)
app.post('/api/admin/test-email', async (req, res) => {
  if (!mailer) {
    return res
      .status(500)
      .json({ message: 'Mailer not configured (SMTP env vars missing)' });
  }

  try {
    const info = await mailer.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.ADMIN_EMAIL,
      subject: 'Zarvo backend test email',
      text: 'This is a test email from the Zarvo backend.',
    });

    res.json({ message: 'Email sent', id: info.messageId });
  } catch (err) {
    console.error('Email send error:', err.message);
    res.status(500).json({ message: 'Failed to send email' });
  }
});

// Fallback 404
app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    message: 'Internal Server Error',
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  if (allowedOrigins.length) {
    console.log('CORS allowed origins:', allowedOrigins.join(', '));
  }
});
