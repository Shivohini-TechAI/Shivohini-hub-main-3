import express from 'express';
import { query } from '../db.js';

const router = express.Router();

router.post('/validate-role-code', async (req, res) => {
  console.log("📩 VALIDATE ROLE CODE HIT:", req.body); // ✅ DEBUG

  try {
    const { code } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({
        valid: false,
        error: 'Code is required'
      });
    }

    const trimmedCode = code.trim().toUpperCase();

    const result = await query(
      `SELECT * FROM signup_codes WHERE code = $1`,
      [trimmedCode]
    );

    const signupCode = result.rows[0];

    // ❌ Not found
    if (!signupCode) {
      return res.status(400).json({
        valid: false,
        error: 'Invalid role code'
      });
    }

    // ❌ Inactive
    if (!signupCode.is_active) {
      return res.status(400).json({
        valid: false,
        error: 'Code is inactive'
      });
    }

    // ❌ Expired
    if (signupCode.expires_at && new Date(signupCode.expires_at) < new Date()) {
      return res.status(400).json({
        valid: false,
        error: 'Code expired'
      });
    }

    // ❌ Usage limit
    if (
      signupCode.max_uses &&
      signupCode.current_uses >= signupCode.max_uses
    ) {
      return res.status(400).json({
        valid: false,
        error: 'Usage limit reached'
      });
    }

    // ✅ SUCCESS
    return res.json({
      valid: true,
      role: signupCode.role
    });

  } catch (error) {
    console.error('❌ Validate Role Code Error:', error);

    return res.status(500).json({
      valid: false,
      error: 'Server error'
    });
  }
});

export default router;