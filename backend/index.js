import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import { query } from "./db.js";

/* -------------------- ENV SETUP -------------------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

if (
  !process.env.GMAIL_USER ||
  !process.env.GMAIL_APP_PASSWORD
) {
  throw new Error("❌ Missing required environment variables: GMAIL_USER or GMAIL_APP_PASSWORD");
}

/* -------------------- IST DATE (DATE ONLY) -------------------- */
const todayIST = new Date().toLocaleDateString("en-CA", {
  timeZone: "Asia/Kolkata",
});
console.log("📅 IST Date:", todayIST);

/* -------------------- MAIN FUNCTION -------------------- */
async function sendDueWorkEmail() {
  try {
    // TODOS (DATE = DATE)
    let todos = [];
    try {
      const todoRes = await query(`SELECT title, due_date FROM public.personal_todos WHERE due_date = $1`, [todayIST]);
      todos = todoRes.rows;
    } catch(e) {
      console.log('Skipping personal_todos (table might not exist yet limit)');
    }

    // TASKS (DATE = DATE)
    let tasks = [];
    try {
      const taskRes = await query(`SELECT title, due_date FROM public.tasks WHERE due_date = $1`, [todayIST]);
      tasks = taskRes.rows;
    } catch(e) {
      console.log('Skipping tasks (table might not exist yet)');
    }

    const items = [
      ...todos.map(t => ({ source: "Todo", title: t.title })),
      ...tasks.map(t => ({ source: "Task", title: t.title })),
    ];

    console.log("🧾 Items found:", items.length);

    if (items.length === 0) {
      console.log("ℹ️ No due work today — email skipped");
      return;
    }

    const recipients = [process.env.GMAIL_USER];
    const html = `
      <h2>📌 Due Work for ${todayIST}</h2>
      <ul>
        ${items.map(i => `<li><strong>${i.source}</strong>: ${i.title}</li>`).join("")}
      </ul>
    `;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Task Alerts" <${process.env.GMAIL_USER}>`,
      to: recipients.join(","),
      subject: `📅 Due Work Today (${todayIST})`,
      html,
    });

    console.log("📧 Email sent successfully");
  } catch (error) {
    console.error("Critical error in email cron:", error);
    throw error;
  }
}

sendDueWorkEmail()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("❌ Error:", err);
    process.exit(1);
  });
