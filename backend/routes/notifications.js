import express from "express";
import { query } from "../db.js";
import { requireAuth } from "./auth.js";

const router = express.Router();

// ================= GET NOTIFICATIONS =================
router.get("/", requireAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.sub]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("GET NOTIFICATIONS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// ================= MARK AS READ =================
router.put("/:id/read", requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    await query(
      `UPDATE notifications SET is_read = true WHERE id = $1`,
      [id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("MARK READ ERROR:", err);
    res.status(500).json({ error: "Failed to mark read" });
  }
});

// ================= CLEAR ALL =================
router.delete("/clear", requireAuth, async (req, res) => {
  try {
    await query(
      `DELETE FROM notifications WHERE user_id = $1`,
      [req.user.sub]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("CLEAR ERROR:", err);
    res.status(500).json({ error: "Failed to clear notifications" });
  }
});

export default router;