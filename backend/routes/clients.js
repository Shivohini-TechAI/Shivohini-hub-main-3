import express from "express";
import { query } from "../db.js";
import { requireAuth } from "./auth.js";

const router = express.Router();

// ================= GET ALL CLIENTS =================
router.get("/", requireAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM clients 
       WHERE is_terminated = false
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("GET CLIENTS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch clients" });
  }
});

// ================= GET TERMINATED CLIENTS =================
// 🔥 MUST be before /:id routes to avoid conflict
router.get("/terminated", requireAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM clients
       WHERE is_terminated = true
       ORDER BY terminated_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("GET TERMINATED CLIENTS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch terminated clients" });
  }
});

// ================= LOST CLIENT ANALYTICS =================
// 🔥 MUST be before /:id routes to avoid conflict
router.get("/analytics/lost", requireAuth, async (req, res) => {
  try {
    const result = await query(`
      SELECT
        COUNT(*) AS total_lost,
        current_stage,
        COUNT(*) AS count
      FROM clients
      WHERE is_terminated = true
      GROUP BY current_stage
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("LOST ANALYTICS ERROR:", err);
    res.status(500).json({ error: "Failed analytics" });
  }
});

// ================= CREATE CLIENT =================
router.post("/", requireAuth, async (req, res) => {
  const {
    name,
    phone,
    email,
    location,
    source,
    requirement,
    project_topic,
    current_stage
  } = req.body;

  try {
    const result = await query(
      `INSERT INTO clients 
      (name, phone, email, location, source, requirement, project_topic, current_stage, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())
      RETURNING *`,
      [
        name,
        phone || null,
        email || null,
        location || null,
        source || null,
        requirement || null,
        project_topic || null,
        current_stage || "new_lead"
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("CREATE CLIENT ERROR:", err);
    res.status(500).json({ error: "Failed to create client" });
  }
});

// ================= ADD NOTE (client-stage-notes) =================
// 🔥 MUST be before /:id routes to avoid conflict
router.post("/client-stage-notes", requireAuth, async (req, res) => {
  const { clientId, note, stage } = req.body;

  try {
    await query(
      `INSERT INTO client_stage_notes
       (client_id, stage, note, note_date, created_by)
       VALUES ($1, $2, $3, CURRENT_DATE, $4)`,
      [clientId, stage || 'manual_note', note, req.user.sub]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("ADD NOTE ERROR:", err);
    res.status(500).json({ error: "Failed to add note" });
  }
});

// ================= UPDATE CLIENT =================
router.put("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const {
    name,
    phone,
    email,
    location,
    source,
    requirement,
    project_topic,
    current_stage
  } = req.body;

  try {
    const result = await query(
      `UPDATE clients
       SET name=$1,
           phone=$2,
           email=$3,
           location=$4,
           source=$5,
           requirement=$6,
           project_topic=$7,
           current_stage=$8,
           updated_at=NOW()
       WHERE id=$9
       RETURNING *`,
      [name, phone, email, location, source, requirement, project_topic, current_stage, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("UPDATE CLIENT ERROR:", err);
    res.status(500).json({ error: "Failed to update client" });
  }
});

// ================= UPDATE STAGE =================
router.put("/:id/stage", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { stage } = req.body;

  try {
    await query(
      `UPDATE clients 
       SET current_stage=$1, updated_at=NOW()
       WHERE id=$2`,
      [stage, id]
    );

    await query(
      `INSERT INTO client_stage_notes (client_id, stage, note_date, note, created_by)
       VALUES ($1, $2, CURRENT_DATE, $3, $4)`,
      [id, stage, `Moved to ${stage}`, req.user.sub]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("UPDATE STAGE ERROR:", err);
    res.status(500).json({ error: "Failed to update stage" });
  }
});

// ================= TERMINATE CLIENT =================
router.put("/:id/terminate", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    await query(
      `UPDATE clients
       SET is_terminated = true,
           terminated_at = NOW(),
           terminated_reason = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [reason || null, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("TERMINATE CLIENT ERROR:", err);
    res.status(500).json({ error: "Failed to terminate client" });
  }
});

// ================= RECOVER CLIENT =================
router.put("/:id/recover", requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    await query(
      `UPDATE clients
       SET is_terminated = false,
           terminated_at = NULL,
           terminated_reason = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("RECOVER CLIENT ERROR:", err);
    res.status(500).json({ error: "Failed to recover client" });
  }
});

// ================= ADD STAGE NOTE =================
router.post("/:id/notes", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { stage, note, deadline_date, due_date } = req.body;

  try {
    const result = await query(
      `INSERT INTO client_stage_notes
      (client_id, stage, note, deadline_date, due_date, created_by, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,NOW())
      RETURNING *`,
      [id, stage, note, deadline_date || null, due_date || null, req.user.sub]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("ADD NOTE ERROR:", err);
    res.status(500).json({ error: "Failed to add note" });
  }
});

// ================= GET CLIENT HISTORY =================
router.get("/:id/history", requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query(
      `SELECT * FROM client_stage_notes
       WHERE client_id=$1
       ORDER BY created_at DESC`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("GET HISTORY ERROR:", err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

// ================= DELETE CLIENT PERMANENT =================
router.delete("/:id/permanent", requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    await query(`DELETE FROM clients WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE CLIENT ERROR:", err);
    res.status(500).json({ error: "Failed to delete client" });
  }
});

// ================= DELETE CLIENT =================
router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    await query(`DELETE FROM clients WHERE id=$1`, [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE CLIENT ERROR:", err);
    res.status(500).json({ error: "Failed to delete client" });
  }
});

export default router;