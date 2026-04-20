import express from "express";
import { query } from "../db.js";
import { requireAuth } from "./auth.js";

const router = express.Router();

// ================= GET ALL OFFER LETTERS =================
router.get("/", requireAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM offer_letters ORDER BY created_at DESC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error("GET OFFER LETTERS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch offer letters" });
  }
});

// ================= GET ONE =================
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM offer_letters WHERE id=$1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Offer letter not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("GET ONE ERROR:", err);
    res.status(500).json({ error: "Failed to fetch offer letter" });
  }
});

// ================= CREATE =================
router.post("/", requireAuth, async (req, res) => {
  const {
    candidate_name,
    candidate_email,
    position_title,
    department,
    issue_date,
    acceptance_deadline,
    status,
  } = req.body;

  try {
    const result = await query(
      `INSERT INTO offer_letters
      (candidate_name, candidate_email, position_title, department,
       issue_date, acceptance_deadline, status, created_by,
       nda_sent, nda_received, offer_sent, offer_received)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,false,false,false,false)
      RETURNING *`,
      [
        candidate_name,
        candidate_email,
        position_title,
        department,
        issue_date || null,
        acceptance_deadline || null,
        status || "Draft",
        req.user.sub,
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("CREATE OFFER ERROR:", err);
    res.status(500).json({ error: "Failed to create offer letter" });
  }
});

// ================= UPDATE =================
router.put("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  const {
    candidate_name,
    candidate_email,
    position_title,
    department,
    issue_date,
    acceptance_deadline,
    status,
    pdf_url,
  } = req.body;

  try {
    const result = await query(
      `UPDATE offer_letters
       SET candidate_name=$1,
           candidate_email=$2,
           position_title=$3,
           department=$4,
           issue_date=$5,
           acceptance_deadline=$6,
           status=$7,
           pdf_url=$8
       WHERE id=$9
       RETURNING *`,
      [
        candidate_name,
        candidate_email,
        position_title,
        department,
        issue_date || null,
        acceptance_deadline || null,
        status,
        pdf_url,
        id,
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("UPDATE OFFER ERROR:", err);
    res.status(500).json({ error: "Failed to update offer letter" });
  }
});

// ================= DELETE =================
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    await query(`DELETE FROM offer_letters WHERE id=$1`, [req.params.id]);

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE OFFER ERROR:", err);
    res.status(500).json({ error: "Failed to delete offer letter" });
  }
});

// ================= CHECKBOX UPDATE =================
router.patch("/:id/checkbox", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { field, value } = req.body;

  const allowedFields = [
    "nda_sent",
    "nda_received",
    "offer_sent",
    "offer_received",
  ];

  if (!allowedFields.includes(field)) {
    return res.status(400).json({ error: "Invalid field" });
  }

  try {
    await query(
      `UPDATE offer_letters SET ${field}=$1 WHERE id=$2`,
      [value, id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("CHECKBOX ERROR:", err);
    res.status(500).json({ error: "Failed to update checkbox" });
  }
});

export default router;