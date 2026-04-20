import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import crypto from 'crypto';
import { sendResetEmail } from '../utils/mailer.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";


// ================= SEND RESET LINK =================
router.post('/send-reset-link', async (req, res) => {
  const { email } = req.body;

  try {
    const emailClean = email.toLowerCase().trim();

    const result = await query(
      'SELECT id FROM user_profiles WHERE LOWER(email) = $1',
      [emailClean]
    );

    if (result.rows.length === 0) {
      return res.json({ success: true }); // don't reveal
    }

    const user = result.rows[0];

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 1000 * 60 * 15); // 15 min

    await query(
      `UPDATE user_profiles 
       SET reset_token = $1, reset_token_expiry = $2 
       WHERE id = $3`,
      [token, expiry, user.id]
    );

    // ✅ DEBUG
    const check = await query(
      'SELECT reset_token FROM user_profiles WHERE id = $1',
      [user.id]
    );
    console.log("✅ TOKEN SAVED:", check.rows[0]);

    const resetLink = `${FRONTEND_URL}/reset-password?token=${token}`;

    console.log("🔗 RESET LINK:", resetLink);

    await sendResetEmail(emailClean, resetLink);

    res.json({ success: true });

  } catch (err) {
    console.error("RESET LINK ERROR:", err);
    res.status(500).json({ error: 'Server error' });
  }
});


// 🔐 Middleware
export const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    req.user = user;
    next();
  });
};


// ================= REGISTER =================
router.post('/register', async (req, res) => {
  console.log("📩 REGISTER HIT"); // 👈 ADD THIS
  const { email, password, name, phone, whatsapp, strongAreas, role } = req.body;

  try {
    const emailClean = email.toLowerCase().trim();

    const existing = await query(
      'SELECT id FROM user_profiles WHERE LOWER(email) = $1',
      [emailClean]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();

    await query(
      `INSERT INTO user_profiles 
       (id, email, name, role, phone, whatsapp, strong_areas, password, is_active, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,NOW())`,
      [
        userId,
        emailClean,
        name,
        role || 'team_member',
        phone,
        whatsapp,
        strongAreas,
        hashedPassword
      ]
    );

    const token = jwt.sign(
      { sub: userId, email: emailClean, role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      user: { id: userId, email: emailClean, role },
      session: { access_token: token }
    });

  } catch (err) {
    console.error('REGISTER ERROR:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});


// ================= LOGIN =================
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const emailClean = email.toLowerCase().trim();

    const result = await query(
      'SELECT * FROM user_profiles WHERE LOWER(email) = $1',
      [emailClean]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    const user = result.rows[0];

    console.log("👉 ENTERED PASSWORD:", password);
    console.log("👉 HASH FROM DB:", user.password);

    const match = await bcrypt.compare(password, user.password);

    console.log("👉 MATCH RESULT:", match);

    if (!match) {
      return res.status(401).json({ success: false, error: 'Invalid password' });
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      },
      session: { access_token: token }
    });

  } catch (err) {
    console.error('LOGIN ERROR:', err);
    res.status(500).json({ success: false, error: 'Server error during login' });
  }
});


// ================= RESET PASSWORD =================
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const result = await query(
      `SELECT * FROM user_profiles 
       WHERE reset_token = $1 
       AND reset_token_expiry > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const user = result.rows[0];

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await query(
      `UPDATE user_profiles 
       SET password = $1, reset_token = NULL, reset_token_expiry = NULL 
       WHERE id = $2`,
      [hashedPassword, user.id]
    );

    res.json({ success: true });

  } catch (err) {
    console.error('RESET PASSWORD ERROR:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});


// ================= GET USER =================
router.get('/me', requireAuth, async (req, res) => {
  const result = await query(
    'SELECT * FROM user_profiles WHERE id = $1',
    [req.user.sub]
  );

  res.json({ user: result.rows[0] });
});

export default router;