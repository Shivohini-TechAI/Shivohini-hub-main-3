import express from 'express';
import pool from '../db.js';

const router = express.Router();

router.post('/validate-role-code', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        valid: false,
        error: 'Code is required'
      });
    }

    const result = await pool.query(
      `SELECT role, is_active, max_uses, current_uses, expires_at 
       FROM signup_codes 
       WHERE code = $1`,
      [code.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.json({
        valid: false,
        error: 'Invalid signup code'
      });
    }

    const data = result.rows[0];

    if (!data.is_active) {
      return res.json({
        valid: false,
        error: 'Code is inactive'
      });
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return res.json({
        valid: false,
        error: 'Code expired'
      });
    }

    if (data.max_uses && data.current_uses >= data.max_uses) {
      return res.json({
        valid: false,
        error: 'Code usage limit reached'
      });
    }

    return res.json({
      valid: true,
      role: data.role
    });

  } catch (err) {
    console.error("❌ Validate Role Code Error:", err);
    return res.status(500).json({
      valid: false,
      error: 'Server error'
    });
  }
});

export default router;