import express from "express";
import pool from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const { userId, role } = req.query;

  try {

    // =========================
    // PROJECT STATS
    // =========================
    const projects = await pool.query(`
      SELECT 
        COUNT(*)::int AS total_projects,
        COUNT(*) FILTER (WHERE status='active')::int AS active_projects,
        COUNT(*) FILTER (WHERE status='completed')::int AS completed_projects,
        COUNT(*) FILTER (WHERE status='not_started')::int AS not_started_projects
      FROM projects
    `);

    // =========================
    // TASK STATS
    // =========================
    const tasks = await pool.query(`
      SELECT 
        COUNT(*)::int AS total_tasks,
        COUNT(*) FILTER (WHERE completed=true)::int AS completed_tasks,
        COUNT(*) FILTER (WHERE completed=false)::int AS pending_tasks,
        COUNT(*) FILTER (
          WHERE due_date < CURRENT_DATE AND completed=false
        )::int AS overdue_tasks
      FROM tasks
    `);

    // =========================
    // PROGRESS ANALYTICS
    // =========================
    const progress = await pool.query(`
      SELECT 
        COUNT(*)::int AS total_steps,
        COUNT(*) FILTER (WHERE status='completed')::int AS completed_steps,
        COUNT(*) FILTER (WHERE status='ongoing')::int AS ongoing_steps
      FROM progress_steps
    `);

    // =========================
    // 🔥 TEAM WORKLOAD (FINAL FIX)
    // =========================
    const workload = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.role,
        COALESCE(COUNT(t.id), 0)::int AS task_count,
        COALESCE(SUM(CASE WHEN t.completed = true THEN 1 ELSE 0 END), 0)::int AS completed_tasks
      FROM user_profiles u
      LEFT JOIN tasks t 
        ON t.assigned_to = u.id
      GROUP BY u.id, u.name, u.role
      ORDER BY task_count DESC
    `);

    // =========================
    // COMPLETION RATE
    // =========================
    const totalTasks = Number(tasks.rows[0]?.total_tasks || 0);
    const completedTasks = Number(tasks.rows[0]?.completed_tasks || 0);

    const completionRate =
      totalTasks > 0
        ? Math.round((completedTasks / totalTasks) * 100)
        : 0;

    // =========================
    // DEBUG (remove later)
    // =========================
    console.log("📊 WORKLOAD:", workload.rows);

    // =========================
    // FINAL RESPONSE
    // =========================
    res.json({
      projects: projects.rows[0] || {},
      tasks: tasks.rows[0] || {},
      progress: progress.rows[0] || {},
      workload: workload.rows || [],
      completionRate
    });

  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ error: "Analytics failed" });
  }
});

export default router;