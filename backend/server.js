import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { query } from './db.js';

import authRoutes from './routes/auth.js';
import apiRoutes from './routes/api.js';
import storageRoutes from './routes/storage.js';
import functionsRoutes from './routes/functions.js';

import paymentsRoutes from "./routes/payments.js";
import projectRoutes from "./routes/projects.js";
import meetingNotesRoutes from "./routes/meetingNotes.js";
import taskRoutes from "./routes/tasks.js";
import userRoutes from "./routes/users.js";
import clientRoutes from "./routes/clients.js";
import clientStageNotesRoutes from "./routes/clientStageNotes.js";

import invoiceRoutes from './routes/invoices.js';
import presetRoutes from "./routes/invoicePresets.js";
import invoiceNumberRoutes from "./routes/invoiceNumber.js";
import invoicePdfRoutes from "./routes/invoicePdf.js";

import analyticsRoutes from "./routes/analytics.js";
import progressRoutes from "./routes/progress.js";
import costingRoutes from "./routes/costing.js";

import offerLettersRoutes from "./routes/offerLetters.js";
import appreciationRoutes from "./routes/appreciationCertificates.js";
import notificationRoutes from "./routes/notifications.js";

import cron from "node-cron";
import path from 'path';

import { sendAdminTaskReport } from "./utils/mailer.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ======================================
// ROUTES
// ======================================

app.use('/auth', authRoutes);
app.use('/rest/v1', apiRoutes);
app.use('/storage/v1', storageRoutes);
app.use('/functions/v1', functionsRoutes);

app.use("/payments", paymentsRoutes);
app.use("/projects", projectRoutes);
app.use("/meeting-notes", meetingNotesRoutes);
app.use("/tasks", taskRoutes);
app.use("/users", userRoutes);
app.use("/clients", clientRoutes);
app.use("/client-stage-notes", clientStageNotesRoutes);

app.use('/invoices', invoiceRoutes);
app.use("/invoice-presets", presetRoutes);
app.use("/invoice-number", invoiceNumberRoutes);
app.use("/invoice-pdf", invoicePdfRoutes);

app.use("/analytics", analyticsRoutes);
app.use("/progress", progressRoutes);
app.use("/costing", costingRoutes);

app.use("/offer-letters", offerLettersRoutes);
app.use("/appreciation-certificates", appreciationRoutes);

app.use("/notifications", notificationRoutes);

// ======================================
// STORAGE
// ======================================

app.use(
  '/storage/v1/object/public',
  express.static(path.join(process.cwd(), 'uploads'))
);

// ======================================
// HEALTH CHECK
// ======================================

app.get('/api/health', async (req, res) => {
  try {

    const result = await query('SELECT NOW()');

    res.json({
      status: 'ok',
      time: result.rows[0].now
    });

  } catch (error) {

    res.status(500).json({
      status: 'error',
      error: error.message
    });

  }
});

// ======================================
// START SERVER
// ======================================

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

console.log("🔥 Server routes loaded");

// ======================================
// DAILY PERSONAL TODO NOTIFICATIONS
// ======================================

cron.schedule(
  "0 9 * * *",
  async () => {

    try {

      console.log("⏰ Running personal todo cron...");

      const result = await query(`
        SELECT *
        FROM personal_todos
        WHERE due_date IS NOT NULL
          AND completed = false
      `);

      const today = new Date()
        .toISOString()
        .split("T")[0];

      for (const todo of result.rows) {

        let title = "";
        let message = "";

        if (todo.due_date === today) {

          title = "⏰ Due Today";
          message = `"${todo.title}" is due today`;

        } else if (todo.due_date < today) {

          title = "🚨 Overdue Task";
          message = `"${todo.title}" is overdue`;

        } else {

          continue;

        }

        await query(
          `
          INSERT INTO notifications
          (
            user_id,
            title,
            message,
            type
          )
          VALUES ($1, $2, $3, 'warning')
          `,
          [
            todo.user_id,
            title,
            message
          ]
        );
      }

      console.log("✅ Personal todo cron completed");

    } catch (err) {

      console.error(
        "❌ CRON ERROR:",
        err
      );

    }
  },
  {
    timezone: "Asia/Kolkata",
  }
);

// ======================================
// DAILY ADMIN TASK REPORT EMAIL
// ======================================

cron.schedule(
  "0 7 * * *",
  async () => {

    try {

      console.log("📋 Running admin task report cron...");

      const today = new Date()
        .toISOString()
        .split("T")[0];

      // ======================================
      // GET ALL PENDING TASKS
      // ======================================

      const taskResult = await query(`
        SELECT
          tasks.title,
          tasks.due_date,
          user_profiles.name AS user_name
        FROM tasks

        LEFT JOIN user_profiles
          ON tasks.assigned_to = user_profiles.id

        WHERE tasks.completed = false
          AND tasks.due_date IS NOT NULL
      `);

      const tasks = [];

      for (const task of taskResult.rows) {

        let status = null;

        if (task.due_date < today) {

          status = "overdue";

        } else if (task.due_date === today) {

          status = "today";

        }

        if (status) {

          tasks.push({
            ...task,
            status,
          });

        }
      }

      // ======================================
      // NO TASKS FOUND
      // ======================================

      if (tasks.length === 0) {

        console.log("✅ No due/overdue tasks today");

        return;
      }

      // ======================================
      // GET ALL ADMINS
      // ======================================

      const adminResult = await query(`
        SELECT email
        FROM user_profiles
        WHERE role = 'admin'
          AND email IS NOT NULL
      `);

      const adminEmails = adminResult.rows.map(
        admin => admin.email
      );

      if (adminEmails.length === 0) {

        console.log("❌ No admin emails found");

        return;
      }

      // ======================================
      // SEND EMAIL
      // ======================================

      await sendAdminTaskReport(
        adminEmails.join(","),
        tasks
      );

      console.log(
        "✅ Admin task report sent successfully"
      );

    } catch (err) {

      console.error(
        "❌ Admin task report cron error:",
        err
      );

    }
  },
  {
    timezone: "Asia/Kolkata",
  }
);