import { query } from "../db.js";

export const runDueDateNotifications = async () => {
  try {
    const result = await query(`
      SELECT csn.*, c.name as client_name
      FROM client_stage_notes csn
      JOIN clients c ON c.id = csn.client_id
      WHERE csn.due_date IS NOT NULL
      AND csn.due_date <= CURRENT_DATE
    `);

    for (const row of result.rows) {

      // 🔥 CHECK: already sent today?
      const alreadySent = await query(
        `SELECT 1 FROM notifications
         WHERE user_id = $1
         AND message LIKE $2
         AND DATE(created_at) = CURRENT_DATE`,
        [
          row.created_by,
          `%${row.client_name}%`
        ]
      );

      if (alreadySent.rows.length > 0) continue;

      // ✅ INSERT NOTIFICATION
      await query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES ($1, $2, $3, $4)`,
        [
          row.created_by,
          "⏰ Due Today",
          `Task for client "${row.client_name}" is due today.`,
          "warning"
        ]
      );
    }

    console.log("✅ Daily notifications sent");

  } catch (err) {
    console.error("CRON ERROR:", err);
  }
};

