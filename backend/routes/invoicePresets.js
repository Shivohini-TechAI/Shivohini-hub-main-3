import express from "express";
import pool from "../db.js";

const router = express.Router();

/**
 * GET ALL PRESETS
 */
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;

    const result = await pool.query(
      `SELECT * FROM invoice_seed_defaults WHERE owner_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("FETCH PRESETS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch presets" });
  }
});

/**
 * CREATE PRESET
 */
router.post("/", async (req, res) => {
  try {
    const { userId, name, config } = req.body;

    const result = await pool.query(
      `
      INSERT INTO invoice_seed_defaults (owner_id, name, config, is_active)
      VALUES ($1, $2, $3, false)
      RETURNING *
      `,
      [userId, name, config]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("CREATE PRESET ERROR:", err);
    res.status(500).json({ error: "Failed to create preset" });
  }
});

/**
 * SET ACTIVE PRESET
 */
router.put("/activate/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    await pool.query(
      `UPDATE invoice_seed_defaults SET is_active = false WHERE owner_id = $1`,
      [userId]
    );

    await pool.query(
      `UPDATE invoice_seed_defaults SET is_active = true WHERE id = $1 AND owner_id = $2`,
      [id, userId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("ACTIVATE PRESET ERROR:", err);
    res.status(500).json({ error: "Failed to activate preset" });
  }
});

/**
 * DELETE PRESET
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    await pool.query(
      `DELETE FROM invoice_seed_defaults WHERE id = $1 AND owner_id = $2`,
      [id, userId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE PRESET ERROR:", err);
    res.status(500).json({ error: "Failed to delete preset" });
  }
});

/**
 * GET ACTIVE PRESET
 */
router.get("/active", async (req, res) => {
  try {
    const { userId } = req.query;

    const result = await pool.query(
      `SELECT * FROM invoice_seed_defaults WHERE owner_id = $1 AND is_active = true LIMIT 1`,
      [userId]
    );

    res.json(result.rows[0] || null);
  } catch (err) {
    console.error("ACTIVE PRESET ERROR:", err);
    res.status(500).json({ error: "Failed to fetch active preset" });
  }
});

export default router; // 🔥 CRITICAL FIX