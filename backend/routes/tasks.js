import express from "express";
import { query } from "../db.js";
import { requireAuth } from "./auth.js";

const router = express.Router();

// ================= ROLE CHECK =================
const canEditTask = (user, task) => {
  if (user.role === "admin" || user.role === "project_manager") return true;
  if (user.role === "team_leader") return true;

  return task.created_by === user.sub;
};

// ================= VALIDATE USER =================
const validateUser = async (userId) => {
  const res = await query(
    "SELECT id FROM user_profiles WHERE id = $1",
    [userId]
  );
  return res.rows.length > 0;
};

// ================= ASSIGNMENT RULE =================
const getAllowedAssignee = (user, requestedUserId) => {
  if (user.role === "admin" || user.role === "project_manager") {
    return requestedUserId || user.sub;
  }

  if (user.role === "team_leader") {
    return requestedUserId || user.sub;
  }

  return user.sub;
};


// ================= GET TASKS =================
router.get("/", requireAuth, async (req, res) => {
  try {
    const { projectId } = req.query;
    let result;

    if (projectId) {
      // Get tasks for specific project
      result = await query(
        `SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at DESC`,
        [projectId]
      );
    } else if (req.user.role === "admin" || req.user.role === "project_manager") {
      result = await query(`SELECT * FROM tasks ORDER BY created_at DESC`);
    } else {
      result = await query(
        `SELECT * FROM tasks WHERE assigned_to = $1 OR created_by = $1 ORDER BY created_at DESC`,
        [req.user.sub]
      );
    }

    res.json(result.rows);
  } catch (err) {
    console.error("GET TASKS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// ================= CREATE TASK =================
router.post("/", requireAuth, async (req, res) => {
  const { title, assignedTo, dueDate, projectId } = req.body;

  try {
    const finalAssignedTo = getAllowedAssignee(req.user, assignedTo);

    const isValidUser = await validateUser(finalAssignedTo);
    if (!isValidUser) {
      return res.status(400).json({ error: "Invalid assigned user ID" });
    }

    const result = await query(
      `INSERT INTO tasks 
      (title, assigned_to, due_date, created_by, project_id, completed, created_at)
      VALUES ($1,$2,$3,$4,$5,false,NOW())
      RETURNING *`,
      [
        title,
        finalAssignedTo,
        dueDate || null,
        req.user.sub,
        projectId || null
      ]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error("CREATE TASK ERROR:", err);
    res.status(500).json({ error: "Failed to create task" });
  }
});

// ================= UPDATE TASK =================
router.put("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { title, assignedTo, dueDate, completed } = req.body;

  try {
    const existing = await query(`SELECT * FROM tasks WHERE id=$1`, [id]);

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    const task = existing.rows[0];

    if (!canEditTask(req.user, task)) {
      return res.status(403).json({ error: "Not allowed" });
    }

    let finalAssignedTo = task.assigned_to;

    if (assignedTo) {
      finalAssignedTo = getAllowedAssignee(req.user, assignedTo);

      const isValidUser = await validateUser(finalAssignedTo);
      if (!isValidUser) {
        return res.status(400).json({ error: "Invalid assigned user ID" });
      }
    }

    const result = await query(
      `UPDATE tasks
       SET title=$1,
           assigned_to=$2,
           due_date=$3,
           completed=$4,
           updated_at=NOW()
       WHERE id=$5
       RETURNING *`,
      [
        title,
        finalAssignedTo,
        dueDate || task.due_date,
        completed ?? task.completed,
        id
      ]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error("UPDATE TASK ERROR:", err);
    res.status(500).json({ error: "Failed to update task" });
  }
});

// ================= DELETE TASK =================
router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await query(`SELECT * FROM tasks WHERE id=$1`, [id]);

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    const task = existing.rows[0];

    if (!canEditTask(req.user, task)) {
      return res.status(403).json({ error: "Not allowed" });
    }

    await query(`DELETE FROM tasks WHERE id=$1`, [id]);

    res.json({ success: true });

  } catch (err) {
    console.error("DELETE TASK ERROR:", err);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

export default router;