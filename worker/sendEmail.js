import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

/* -------------------- ENV SETUP -------------------- */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

if (
  !process.env.SUPABASE_URL ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY ||
  !process.env.GMAIL_USER ||
  !process.env.GMAIL_APP_PASSWORD
) {
  throw new Error("❌ Missing required environment variables");
}

/* -------------------- SUPABASE -------------------- */

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* -------------------- IST DATE -------------------- */

const todayIST = new Date(
  new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
)
  .toISOString()
  .split("T")[0];

console.log("📅 IST Date:", todayIST);

/* -------------------- MAIN FUNCTION -------------------- */

async function sendDueWorkEmail() {
  try {
    const { data: todos, error: todoError } = await supabase
        .from("personal_todos")
        .select("title, due_date")
        .gte("due_date", todayIST)
        .lt("due_date", todayIST + "T23:59:59");

    if (todoError) {
      console.error("Todo Error:", todoError);
      return;
    }

    const { data: tasks, error: taskError } = await supabase
        .from("tasks")
        .select("title, due_date")
        .gte("due_date", todayIST)
        .lt("due_date", todayIST + "T23:59:59");

    if (taskError) {
      console.error("Task Error:", taskError);
      return;
    }

    const items = [
      ...(todos || []).map((t) => ({ source: "Todo", title: t.title })),
      ...(tasks || []).map((t) => ({ source: "Task", title: t.title })),
    ];

    console.log("🧾 Items found:", items.length);

    if (items.length === 0) {
      console.log("ℹ️ No due work today — email skipped");
      return;
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const html = `
      <h2>📌 Due Work for ${todayIST}</h2>
      <ul>
        ${items
          .map((i) => `<li><strong>${i.source}</strong>: ${i.title}</li>`)
          .join("")}
      </ul>
    `;

    await transporter.sendMail({
      from: `"Task Alerts" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      subject: `📅 Due Work Today (${todayIST})`,
      html,
    });

    console.log("📧 Email sent successfully");
  } catch (err) {
    console.error("❌ Error:", err);
  }
}

/* -------------------- RUN -------------------- */

sendDueWorkEmail();