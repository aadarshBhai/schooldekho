import 'dotenv/config';
import express from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

const router = express.Router();

// Cloudinary config is automatically picked up from CLOUDINARY_URL env var
// but we can explicitly config if needed. 
// With CLOUDINARY_URL set, we don't strictly need cloudinary.config({...}) per docs, 
// but let's ensure it's loaded.

// Configure Cloudinary explicitly
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'events_media',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    },
});

const upload = multer({ storage: storage });

router.post('/', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // CloudinaryStorage automatically uploads to Cloudinary and puts the result in req.file.path
        res.json({
            url: req.file.path,
            public_id: req.file.filename,
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Upload failed', error: error.message });
    }
});

export default router;
