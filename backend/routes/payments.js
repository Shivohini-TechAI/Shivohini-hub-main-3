import express from "express";
import { query } from "../db.js";
import { requireAuth } from "./auth.js";

const router = express.Router();

// GET payments for a project
router.get("/:projectId", requireAuth, async (req, res) => {
  const { projectId } = req.params;
  try {
    const result = await query(
      `SELECT * FROM client_payments WHERE project_id = $1 ORDER BY payment_date DESC`,
      [projectId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("GET PAYMENTS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

// CREATE payment
router.post("/", requireAuth, async (req, res) => {
  const { projectId, clientName, amount, currency, paymentDate } = req.body;
  try {
    const result = await query(
      `INSERT INTO client_payments (project_id, client_name, amount, currency, payment_date, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,NOW(),NOW()) RETURNING *`,
      [projectId, clientName, amount, currency || "INR", paymentDate || new Date().toISOString().split("T")[0]]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("CREATE PAYMENT ERROR:", err);
    res.status(500).json({ error: "Failed to create payment" });
  }
});

// UPDATE payment
router.put("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { clientName, amount, currency, paymentDate } = req.body;
  try {
    const result = await query(
      `UPDATE client_payments
       SET client_name=$1, amount=$2, currency=$3, payment_date=$4, updated_at=NOW()
       WHERE id=$5 RETURNING *`,
      [clientName, amount, currency, paymentDate, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("UPDATE PAYMENT ERROR:", err);
    res.status(500).json({ error: "Failed to update payment" });
  }
});

// DELETE payment
router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    await query(`DELETE FROM client_payments WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE PAYMENT ERROR:", err);
    res.status(500).json({ error: "Failed to delete payment" });
  }
});

export default router;