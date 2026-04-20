import express from "express";
import { query } from "../db.js";
import { requireAuth } from "./auth.js";

const router = express.Router();

// GET costing items for a project
router.get("/:projectId", requireAuth, async (req, res) => {
  const { projectId } = req.params;
  try {
    const result = await query(
      `SELECT * FROM costing_items WHERE project_id = $1 ORDER BY created_at ASC`,
      [projectId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("GET COSTING ERROR:", err);
    res.status(500).json({ error: "Failed to fetch costing items" });
  }
});

// CREATE costing item
router.post("/", requireAuth, async (req, res) => {
  const { projectId, productService, quantity, currency, amount, comment } = req.body;
  try {
    const result = await query(
      `INSERT INTO costing_items (project_id, product_service, quantity, currency, amount, comment, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW()) RETURNING *`,
      [projectId, productService, quantity || 1, currency || "INR", amount || 0, comment || null]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("CREATE COSTING ERROR:", err);
    res.status(500).json({ error: "Failed to create costing item" });
  }
});

// UPDATE costing item
router.put("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { productService, quantity, currency, amount, comment } = req.body;
  try {
    const result = await query(
      `UPDATE costing_items
       SET product_service=$1, quantity=$2, currency=$3, amount=$4, comment=$5, updated_at=NOW()
       WHERE id=$6 RETURNING *`,
      [productService, quantity, currency, amount, comment, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("UPDATE COSTING ERROR:", err);
    res.status(500).json({ error: "Failed to update costing item" });
  }
});

// DELETE costing item
router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    await query(`DELETE FROM costing_items WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE COSTING ERROR:", err);
    res.status(500).json({ error: "Failed to delete costing item" });
  }
});

export default router;