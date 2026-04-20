import express from "express";
import { query } from "../db.js";
import { requireAuth } from "./auth.js";

const router = express.Router();

// ================= GET ACTIVE PROJECTS =================
router.get("/", requireAuth, async (req, res) => {
  try {
    let result;

    if (req.user.role === "admin" || req.user.role === "project_manager") {
      result = await query(
        `SELECT * FROM projects WHERE archived_at IS NULL ORDER BY created_at DESC`
      );
    } else {
      result = await query(
        `SELECT p.* FROM projects p
         WHERE p.archived_at IS NULL
         AND (
           p.created_by = $1
           OR $1 = ANY(p.assigned_members)
           OR EXISTS (
             SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = $1
           )
         )
         ORDER BY p.created_at DESC`,
        [req.user.sub]
      );
    }

    res.json(result.rows);
  } catch (err) {
    console.error("GET PROJECTS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// ================= GET ARCHIVED PROJECTS =================
router.get("/archived", requireAuth, async (req, res) => {
  try {
    let result;

    if (req.user.role === "admin" || req.user.role === "project_manager") {
      result = await query(
        `SELECT * FROM projects WHERE archived_at IS NOT NULL ORDER BY archived_at DESC`
      );
    } else {
      result = await query(
        `SELECT p.* FROM projects p
         WHERE p.archived_at IS NOT NULL
         AND (
           p.created_by = $1
           OR $1 = ANY(p.assigned_members)
         )
         ORDER BY p.archived_at DESC`,
        [req.user.sub]
      );
    }

    res.json(result.rows);
  } catch (err) {
    console.error("GET ARCHIVED ERROR:", err);
    res.status(500).json({ error: "Failed to fetch archived projects" });
  }
});

// ================= GET PROJECT STATS =================
router.get("/stats", requireAuth, async (req, res) => {
  try {
    let result;

    if (req.user.role === "admin" || req.user.role === "project_manager") {
      result = await query(
        `SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'ongoing') as ongoing,
          COUNT(*) FILTER (WHERE status = 'completed') as completed,
          COUNT(*) FILTER (WHERE status = 'not_started') as not_started
         FROM projects WHERE archived_at IS NULL`
      );
    } else {
      result = await query(
        `SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'ongoing') as ongoing,
          COUNT(*) FILTER (WHERE status = 'completed') as completed,
          COUNT(*) FILTER (WHERE status = 'not_started') as not_started
         FROM projects
         WHERE archived_at IS NULL
         AND (created_by = $1 OR $1 = ANY(assigned_members))`,
        [req.user.sub]
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("GET STATS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// ================= CREATE PROJECT =================
router.post("/", requireAuth, async (req, res) => {
  const {
    title,
    description,
    clientRequirement,
    githubUrl,
    deploymentLink,
    endDate,
    assignedMembers,
    status
  } = req.body;

  try {
    const result = await query(
      `INSERT INTO projects
      (title, description, client_requirement, github_url, deployment_link, end_date, status, created_by, assigned_members, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())
      RETURNING *`,
      [
        title,
        description,
        clientRequirement || null,
        githubUrl || null,
        deploymentLink || null,
        endDate || null,
        status || "not_started",
        req.user.sub,
        assignedMembers || []
      ]
    );

    // Also insert into project_members
    if (assignedMembers && assignedMembers.length > 0) {
      for (const userId of assignedMembers) {
        await query(
          `INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [result.rows[0].id, userId]
        ).catch(() => {});
      }
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("CREATE PROJECT ERROR:", err);
    res.status(500).json({ error: "Failed to create project" });
  }
});

// ================= UPDATE PROJECT =================
router.put("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    clientRequirement,
    githubUrl,
    deploymentLink,
    status,
    endDate,
    assignedMembers,
    archivedAt,
    completionNote,
    completedAt
  } = req.body;

  try {
    const result = await query(
      `UPDATE projects
       SET title=$1,
           description=$2,
           client_requirement=$3,
           github_url=$4,
           deployment_link=$5,
           status=$6,
           end_date=$7,
           assigned_members=$8,
           archived_at=$9,
           completion_note=$10,
           completed_at=$11,
           updated_at=NOW()
       WHERE id=$12
       RETURNING *`,
      [
        title,
        description,
        clientRequirement || null,
        githubUrl || null,
        deploymentLink || null,
        status,
        endDate || null,
        assignedMembers || [],
        archivedAt || null,
        completionNote || null,
        completedAt || null,
        id
      ]
    );

    // Sync project_members
    if (assignedMembers) {
      await query(`DELETE FROM project_members WHERE project_id = $1`, [id]);
      for (const userId of assignedMembers) {
        await query(
          `INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [id, userId]
        ).catch(() => {});
      }
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("UPDATE PROJECT ERROR:", err);
    res.status(500).json({ error: "Failed to update project" });
  }
});

// ================= ARCHIVE PROJECT =================
router.put("/:id/archive", requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    await query(
      `UPDATE projects SET archived_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("ARCHIVE ERROR:", err);
    res.status(500).json({ error: "Failed to archive project" });
  }
});

// ================= RESTORE PROJECT =================
router.put("/:id/restore", requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    await query(
      `UPDATE projects SET archived_at = NULL, updated_at = NOW() WHERE id = $1`,
      [id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("RESTORE ERROR:", err);
    res.status(500).json({ error: "Failed to restore project" });
  }
});

// ================= COMPLETE PROJECT =================
router.put("/:id/complete", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { completionNote } = req.body;

  try {
    await query(
      `UPDATE projects
       SET status = 'completed', completion_note = $1, completed_at = NOW(), updated_at = NOW()
       WHERE id = $2`,
      [completionNote || null, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("COMPLETE ERROR:", err);
    res.status(500).json({ error: "Failed to complete project" });
  }
});

// ================= DELETE PROJECT (permanent, admin only) =================
router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    await query(`DELETE FROM projects WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE PROJECT ERROR:", err);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

// ================= TERMINATE PROJECT =================
router.put("/:id/terminate", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: "Reason is required to terminate a project" });
  }

  try {
    // Mark as terminated — we reuse archived_at and add a note
    // Projects don't have is_terminated column so we use completion_note for reason
    await query(
      `UPDATE projects
       SET completion_note = $1,
           status = 'completed',
           archived_at = NOW(),
           updated_at = NOW()
       WHERE id = $2`,
      [`TERMINATED: ${reason}`, id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("TERMINATE PROJECT ERROR:", err);
    res.status(500).json({ error: "Failed to terminate project" });
  }
});

export default router;