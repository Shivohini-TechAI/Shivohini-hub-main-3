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

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

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
app.use("/api/offer-letters", offerLettersRoutes);
app.use("/api/appreciation-certificates", appreciationRoutes);
app.use("/notifications", notificationRoutes);

app.use('/storage/v1/object/public', express.static(path.join(process.cwd(), 'uploads')));

app.get('/api/health', async (req, res) => {
  try {
    const result = await query('SELECT NOW()');
    res.json({ status: 'ok', time: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

console.log("🔥 Server routes loaded");

cron.schedule("0 9 * * *", async () => {
  try {
    const result = await query(`
      SELECT * FROM personal_todos
      WHERE due_date IS NOT NULL AND completed = false
    `);

    const today = new Date().toISOString().split("T")[0];

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
        `INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, 'warning')`,
        [todo.user_id, title, message]
      );
    }
  } catch (err) {
    console.error("❌ CRON ERROR:", err);
  }
});