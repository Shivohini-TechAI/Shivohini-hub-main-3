import express from "express";
import { query } from "../db.js";
import { requireAuth } from "./auth.js";

const router = express.Router();

//
// ================= GET NOTES =================
//
router.get("/:projectId", requireAuth, async (req, res) => {
  const { projectId } = req.params;

  try {
    const result = await query(
      `SELECT * FROM meeting_notes
       WHERE project_id = $1
       ORDER BY date DESC`,
      [projectId]
    );

    res.json(result.rows);

  } catch (err) {
    console.error("GET NOTES ERROR:", err);
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

//
// ================= ADD NOTE =================
//
router.post("/", requireAuth, async (req, res) => {
  const { projectId, content, attendedMembers } = req.body;

  try {
    const result = await query(
      `INSERT INTO meeting_notes 
       (project_id, content, date, created_by, attended_members)
       VALUES ($1, $2, CURRENT_DATE, $3, $4)
       RETURNING *`,
      [
        projectId,
        content,
        req.user.sub,
        attendedMembers || null
      ]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error("ADD NOTE ERROR:", err);
    res.status(500).json({ error: "Failed to add note" });
  }
});

//
// ================= DELETE NOTE =================
//
router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    await query(
      `DELETE FROM meeting_notes WHERE id = $1`,
      [id]
    );

    res.json({ success: true });

  } catch (err) {
    console.error("DELETE NOTE ERROR:", err);
    res.status(500).json({ error: "Failed to delete note" });
  }
});

export default router;