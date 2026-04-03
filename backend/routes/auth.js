import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import crypto from 'crypto';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

// Middleware to protect routes
export const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    req.user = user;
    next();
  });
};

// Register
router.post('/register', async (req, res) => {
  const { email, password, name, role } = req.body;
  
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    // Check if user exists
    const existing = await query('SELECT id FROM auth.users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Email already in use' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();

    await query('BEGIN');
    
    // Insert into auth.users (mimicking Supabase Auth)
    await query(
      'INSERT INTO auth.users (id, email, encrypted_password, created_at) VALUES ($1, $2, $3, NOW())',
      [userId, email, hashedPassword]
    );

    // Some Supabase setups insert into public.user_profiles via trigger, but we'll do it manually just in case
    // Wait, since we kept public tables from OpenAPI, let's just insert here
    try {
      await query(
        'INSERT INTO public.user_profiles (id, email, name, role) VALUES ($1, $2, $3, $4)',
        [userId, email, name || 'New User', role || 'team_member']
      );
    } catch (e) {
      // Ignored if user_profiles doesn't exist or other error, but should work
      console.log('Failed inserting profile:', e.message);
    }

    await query('COMMIT');

    // Generate JWT (matching Supabase format approximately)
    const token = jwt.sign({ sub: userId, email, role }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ user: { id: userId, email, role }, session: { access_token: token } });
  } catch (err) {
    await query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await query('SELECT id, encrypted_password FROM auth.users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.encrypted_password);
    
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    // Try to get role from profile
    let role = 'team_member';
    try {
      const profileInfo = await query('SELECT role FROM public.user_profiles WHERE id = $1', [user.id]);
      if (profileInfo.rows.length > 0) role = profileInfo.rows[0].role;
    } catch(e) {}

    const token = jwt.sign({ sub: user.id, email, role }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ user: { id: user.id, email, role }, session: { access_token: token } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get Session / Current User
router.get('/me', requireAuth, async (req, res) => {
  // If the token is valid, req.user has the sub (uuid) Let's fetch fresh data
  try {
     const profile = await query('SELECT * FROM public.user_profiles WHERE id = $1', [req.user.sub]);
     res.json({ user: { id: req.user.sub, email: req.user.email, ...profile.rows[0] } });
  } catch(e) {
     res.json({ user: { id: req.user.sub, email: req.user.email } });
  }
});

export default router;
