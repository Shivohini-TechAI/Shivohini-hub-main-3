import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { requireAuth } from './auth.js';

const router = express.Router();
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const bucket = req.params.bucket || 'default';
    const bucketDir = path.join(uploadDir, bucket);
    if (!fs.existsSync(bucketDir)) fs.mkdirSync(bucketDir, { recursive: true });
    cb(null, bucketDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Mimic Supabase Storage Upload
router.post('/:bucket/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  // Generate public URL
  const bucket = req.params.bucket;
  const filePath = `${bucket}/${req.file.filename}`;
  const publicUrl = `${req.protocol}://${req.get('host')}/storage/v1/object/public/${filePath}`;

  res.json({
    Key: filePath,
    path: filePath,
    publicUrl: publicUrl
  });
});

export default router;
