import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { query } from './db.js';
import authRoutes from './routes/auth.js';
import apiRoutes from './routes/api.js';
import storageRoutes from './routes/storage.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth/v1', authRoutes); // Matching supabase auth endpoint style roughly
app.use('/rest/v1', apiRoutes); // REST api dynamic route
app.use('/storage/v1', storageRoutes); // Storage

// Static file serving for uploads
import path from 'path';
app.use('/storage/v1/object/public', express.static(path.join(process.cwd(), 'uploads')));

app.get('/api/health', async (req, res) => {
  try {
    const result = await query('SELECT NOW()');
    res.json({ status: 'ok', time: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
