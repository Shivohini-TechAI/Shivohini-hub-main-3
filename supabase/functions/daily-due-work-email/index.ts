import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "https://esm.sh/nodemailer@6.9.8";
import "dotenv/config";

console.log("DEBUG SUPABASE_URL:", process.env.SUPABASE_URL);

serve(async () => {
  try {
    // ENV VARS
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY");
    const gmailUser = Deno.env.get("GMAIL_USER");
    const gmailPass = Deno.env.get("GMAIL_APP_PASSWORD");

    if (!supabaseUrl || !serviceRoleKey || !gmailUser || !gmailPass) {
      console.error("❌ Missing environment variables");
      return new Response("Missing env vars", { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // IST DATE (FIXED)
    const now = new Date();
    const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
    const today = ist.toISOString().split("T")[0];

    console.log("📅 IST Today:", today);

    // FETCH TODOS
    const { data: todos } = await supabase
      .from("personal_todos")
      .select("title, due_date")
      .eq("due_date", today);

    // FETCH TASKS
    const { data: tasks } = await supabase
      .from("tasks")
      .select("title, due_date")
      .eq("due_date", today);

    const items = [
      ...(todos || []).map(t => ({ type: "Todo", title: t.title })),
      ...(tasks || []).map(t => ({ type: "Task", title: t.title })),
    ];

    if (items.length === 0) {
      console.log("ℹ️ No due work today");
      return new Response("No due work today");
    }

    // ADMIN EMAILS (HEAD)
    const { data: admins } = await supabase
      .from("user_profiles")
      .select("email")
      .eq("role", "admin");

    const adminEmails =
      admins?.map(a => a.email).filter(Boolean) || [];

    if (adminEmails.length === 0) {
      throw new Error("No admin emails found");
    }

    // EMAIL BODY
    const html = `
      <h2>📌 Due Work (${today})</h2>
      <ul>
        ${items.map(i => `<li><b>${i.type}</b>: ${i.title}</li>`).join("")}
      </ul>
    `;

    // SMTP TRANSPORT
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });

    await transporter.sendMail({
      from: `"Task Alerts" <${gmailUser}>`,
      to: adminEmails.join(","),
      subject: `📅 Due Work Today (${today})`,
      html,
    });

    console.log("📧 Email sent via Gmail SMTP");

    return new Response("Email sent");
  } catch (err) {
    console.error("❌ BOOT ERROR:", err);
    return new Response("Internal error", { status: 500 });
  }
});
