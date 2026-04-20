import express from "express";
import pool from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) FROM invoices
    `);

    const count = parseInt(result.rows[0].count, 10) + 1;

    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;

    const number = `INV-${yearMonth}-${String(count).padStart(3, "0")}`;

    res.json({ number });

  } catch (err) {
    console.error("INVOICE NUMBER ERROR:", err);
    res.status(500).json({ error: "Failed to generate invoice number" });
  }
});

export default router;  // 🔥 THIS IS THE KEY FIX