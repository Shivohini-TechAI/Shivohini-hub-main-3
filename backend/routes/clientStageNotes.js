import express from "express";
import { query } from "../db.js";
import { requireAuth } from "./auth.js";

const router = express.Router();

// ================= GET NOTES =================
router.get("/:clientId", requireAuth, async (req, res) => {
  const { clientId } = req.params;

  try {
    const result = await query(
      `SELECT * FROM client_stage_notes
       WHERE client_id = $1
       ORDER BY created_at DESC`,
      [clientId]
    );

    res.json(result.rows);

  } catch (err) {
    console.error("GET NOTES ERROR:", err);
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

// ================= ADD NOTE =================
router.post("/", requireAuth, async (req, res) => {
  const { clientId, stage, note, dueDate } = req.body;

  // 🔥 BASIC VALIDATION (prevents crash)
  if (!clientId || !note) {
    return res.status(400).json({ error: "clientId and note are required" });
  }

  try {
    const result = await query(
      `INSERT INTO client_stage_notes
       (client_id, stage, note, due_date, created_by, created_at)
       VALUES ($1,$2,$3,$4,$5, NOW() AT TIME ZONE 'Asia/Kolkata')
       RETURNING *`,
      [
        clientId,
        stage || "manual_note",   // ✅ FIX: default stage
        note,
        dueDate || null,
        req.user.sub
      ]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error("ADD NOTE ERROR:", err);
    res.status(500).json({ error: "Failed to add note" });
  }
});

export default router;