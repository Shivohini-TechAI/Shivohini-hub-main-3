import express from "express";
import { query } from "../db.js";
import { requireAuth } from "./auth.js";

const router = express.Router();

// ================= PERMISSION HELPERS =================

const canManage = (role) =>
  role === "admin" || role === "project_manager" || role === "team_leader";

const canDelete = (role) =>
  role === "admin" || role === "project_manager";

// ================= GET ALL MEETINGS FOR A PROJECT =================

router.get("/", requireAuth, async (req, res) => {
  const { projectId } = req.query;

  if (!projectId) {
    return res.status(400).json({ error: "projectId is required" });
  }

  try {
    const result = await query(
      `SELECT ma.*,
              up.name AS created_by_name
       FROM meeting_attendance ma
       LEFT JOIN user_profiles up ON ma.created_by = up.id
       WHERE ma.project_id = $1
       ORDER BY ma.date DESC, ma.time DESC`,
      [projectId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("GET MEETING ATTENDANCE ERROR:", err);
    res.status(500).json({ error: "Failed to fetch meeting attendance" });
  }
});

// ================= CREATE MEETING =================

router.post("/", requireAuth, async (req, res) => {
  const { projectId, date, time, topic, attendedMembers } = req.body;

  if (!canManage(req.user.role)) {
    return res.status(403).json({ error: "Not authorized" });
  }

  if (!projectId || !date || !time) {
    return res.status(400).json({ error: "projectId, date and time are required" });
  }

  try {
    const result = await query(
      `INSERT INTO meeting_attendance
        (project_id, date, time, topic, attended_members, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [
        projectId,
        date,
        time,
        topic || null,
        attendedMembers || [],
        req.user.sub
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("CREATE MEETING ATTENDANCE ERROR:", err);
    res.status(500).json({ error: "Failed to create meeting attendance" });
  }
});

// ================= UPDATE MEETING =================

router.put("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { date, time, topic, attendedMembers } = req.body;

  if (!canManage(req.user.role)) {
    return res.status(403).json({ error: "Not authorized" });
  }

  try {
    const existing = await query(
      `SELECT * FROM meeting_attendance WHERE id = $1`,
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    const result = await query(
      `UPDATE meeting_attendance
       SET date = $1,
           time = $2,
           topic = $3,
           attended_members = $4,
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [
        date,
        time,
        topic || null,
        attendedMembers || [],
        id
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("UPDATE MEETING ATTENDANCE ERROR:", err);
    res.status(500).json({ error: "Failed to update meeting attendance" });
  }
});

// ================= DELETE MEETING =================

router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  if (!canDelete(req.user.role)) {
    return res.status(403).json({ error: "Only Admin or Project Manager can delete meetings" });
  }

  try {
    const existing = await query(
      `SELECT * FROM meeting_attendance WHERE id = $1`,
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    await query(`DELETE FROM meeting_attendance WHERE id = $1`, [id]);

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE MEETING ATTENDANCE ERROR:", err);
    res.status(500).json({ error: "Failed to delete meeting" });
  }
});

export default router;