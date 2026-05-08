import express from "express";
import { query } from "../db.js";
import { requireAuth } from "./auth.js";

const router = express.Router();

// ================= CREATE =================
router.post("/", requireAuth, async (req, res) => {
  const { recipient_name, designation, appreciation_for, issue_date, joining_date } = req.body;
  try {
    const result = await query(
      `INSERT INTO appreciation_certificates
      (recipient_name, designation, appreciation_for, issue_date, joining_date, created_by)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [recipient_name, designation || null, appreciation_for, issue_date || null, joining_date || null, req.user.sub]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("CREATE CERT ERROR:", err);
    res.status(500).json({ error: "Failed to create certificate" });
  }
});

// ================= GET ALL =================
router.get("/", requireAuth, async (req, res) => {
  try {
    const result = await query(`SELECT * FROM appreciation_certificates ORDER BY created_at DESC`);
    res.json(result.rows);
  } catch (err) {
    console.error("GET CERT ERROR:", err);
    res.status(500).json({ error: "Failed to fetch certificates" });
  }
});

// ================= DELETE =================
router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    await query(`DELETE FROM appreciation_certificates WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE CERT ERROR:", err);
    res.status(500).json({ error: "Failed to delete certificate" });
  }
});

export default router;