import express from "express";
import pool from "../db.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();


// =========================
// GET ALL STEPS BY PROJECT
// =========================
router.get("/:projectId", async (req, res) => {
  const { projectId } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM progress_steps 
       WHERE project_id = $1 
       ORDER BY created_at ASC`,
      [projectId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch progress steps" });
  }
});


// =========================
// CREATE STEP
// =========================
router.post("/", async (req, res) => {
  const {
    projectId,
    step,
    responsible,
    startDate,
    endDate,
    status
  } = req.body;

  try {
    const result = await pool.query(
      `
      INSERT INTO progress_steps
      (id, project_id, step, responsible, start_date, end_date, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
      `,
      [
        uuidv4(),
        projectId,
        step,
        responsible || null,
        startDate || null,
        endDate || null,
        status || "not_started"
      ]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create step" });
  }
});


// =========================
// UPDATE STEP
// =========================
router.put("/:id", async (req, res) => {
  const { id } = req.params;

  const {
    step,
    responsible,
    startDate,
    endDate,
    status
  } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE progress_steps
      SET step=$1,
          responsible=$2,
          start_date=$3,
          end_date=$4,
          status=$5,
          updated_at=NOW()
      WHERE id=$6
      RETURNING *
      `,
      [step, responsible, startDate, endDate, status, id]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update step" });
  }
});


// =========================
// DELETE STEP
// =========================
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(
      `DELETE FROM progress_steps WHERE id = $1`,
      [id]
    );

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete step" });
  }
});

export default router;