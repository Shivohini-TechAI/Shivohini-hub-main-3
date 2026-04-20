import express from "express";
import { query } from "../db.js";
import { requireAuth } from "./auth.js";

const router = express.Router();

// 🔐 Only Admin can manage users
const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin only access" });
  }
  next();
};

// ================= GET ALL USERS =================
router.get("/", requireAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, email, role, created_at, is_active 
       FROM user_profiles
       ORDER BY created_at DESC`
    );

    res.json(result.rows);

  } catch (err) {
    console.error("GET USERS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});


// ================= UPDATE ROLE =================
router.put("/:id/role", requireAuth, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  const allowedRoles = [
    "admin",
    "project_manager",
    "team_leader",
    "team_member"
  ];

  // ❌ invalid role
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  // 🔐 prevent admin from changing own role
  if (req.user.sub === id && role !== "admin") {
    return res.status(400).json({
      error: "You cannot change your own role"
    });
  }

  try {
    const result = await query(
      `UPDATE user_profiles 
       SET role=$1, updated_at=NOW()
       WHERE id=$2
       RETURNING id, name, email, role`,
      [role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error("UPDATE ROLE ERROR:", err);
    res.status(500).json({ error: "Failed to update role" });
  }
});


// ================= DELETE USER =================
router.delete("/:id", requireAuth, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    // 🔐 cannot delete yourself
    if (req.user.sub === id) {
      return res.status(400).json({ error: "Cannot delete yourself" });
    }

    const result = await query(
      `DELETE FROM user_profiles WHERE id=$1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true });

  } catch (err) {
    console.error("DELETE USER ERROR:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});


// ================= TOGGLE ACTIVE =================
router.put("/:id/toggle-active", requireAuth, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query(
      `UPDATE user_profiles
       SET is_active = NOT is_active,
           updated_at = NOW()
       WHERE id=$1
       RETURNING id, is_active`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error("TOGGLE ACTIVE ERROR:", err);
    res.status(500).json({ error: "Failed to update status" });
  }
});


// ================= UPDATE PROFILE =================
router.put("/profile/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, whatsapp, strongAreas } = req.body;

  try {
    // 🔐 only user can update own profile
    if (req.user.sub !== id) {
      return res.status(403).json({ error: "Not allowed" });
    }

    const result = await query(
      `UPDATE user_profiles
       SET name=$1,
           email=$2,
           phone=$3,
           whatsapp=$4,
           strong_areas=$5,
           updated_at=NOW()
       WHERE id=$6
       RETURNING id, name, email, phone, whatsapp, strong_areas, role`,
      [name, email, phone, whatsapp, strongAreas, id]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error("UPDATE PROFILE ERROR:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;