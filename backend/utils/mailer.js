import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ Verify Mail Server
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Mail server error:", error);
  } else {
    console.log("✅ Mail server ready");
  }
});

// ===============================
// PASSWORD RESET EMAIL
// ===============================

export const sendResetEmail = async (to, link) => {
  try {
    const info = await transporter.sendMail({
      from: `"Shivohini Hub" <${process.env.EMAIL_USER}>`,
      to,
      subject: "🔐 Reset Your Password",
      html: `
        <div style="font-family: Arial; padding: 20px;">
          <h2 style="color:#7c3aed;">Reset Your Password</h2>

          <p>Click the button below to reset your password:</p>

          <a href="${link}" 
             style="
               display:inline-block;
               padding:12px 20px;
               background: linear-gradient(to right, #7c3aed, #2563eb);
               color:white;
               text-decoration:none;
               border-radius:8px;
               font-weight:bold;
             ">
            Reset Password
          </a>

          <p style="margin-top:20px; color:gray;">
            Or copy this link:
          </p>

          <p style="word-break:break-all;">${link}</p>

          <p style="margin-top:20px; color:gray;">
            This link expires in 15 minutes.
          </p>

          <hr />
          <p style="font-size:12px; color:gray;">
            Shivohini Hub Team
          </p>
        </div>
      `,
    });

    console.log("📨 Reset email sent:", info.response);

  } catch (err) {
    console.error("❌ Reset email error:", err);
  }
};

// ===============================
// DAILY ADMIN TASK REPORT EMAIL
// ===============================

export const sendAdminTaskReport = async (to, tasks) => {
  try {

    const overdueTasks = tasks.filter(
      (task) => task.status === "overdue"
    );

    const todayTasks = tasks.filter(
      (task) => task.status === "today"
    );

    const overdueHtml = overdueTasks.map(task => `
      <tr>
        <td style="padding:10px;border:1px solid #ddd;">${task.title}</td>
        <td style="padding:10px;border:1px solid #ddd;">${task.user_name}</td>
        <td style="padding:10px;border:1px solid #ddd;color:red;">
          ${task.due_date}
        </td>
      </tr>
    `).join("");

    const todayHtml = todayTasks.map(task => `
      <tr>
        <td style="padding:10px;border:1px solid #ddd;">${task.title}</td>
        <td style="padding:10px;border:1px solid #ddd;">${task.user_name}</td>
        <td style="padding:10px;border:1px solid #ddd;color:orange;">
          ${task.due_date}
        </td>
      </tr>
    `).join("");

    const info = await transporter.sendMail({
      from: `"Shivohini Hub" <${process.env.EMAIL_USER}>`,
      to,
      subject: "📋 Daily Due Task Report - Shivohini Hub",

      html: `
        <div style="font-family: Arial; padding:20px;">

          <h1 style="color:#2563eb;">
            📋 Daily Task Report
          </h1>

          <p>
            Here is today's pending task summary.
          </p>

          ${
            overdueTasks.length > 0
              ? `
              <h2 style="color:red;">🚨 Overdue Tasks</h2>

              <table 
                style="
                  border-collapse: collapse;
                  width:100%;
                  margin-bottom:30px;
                "
              >
                <tr style="background:#f3f4f6;">
                  <th style="padding:10px;border:1px solid #ddd;">Task</th>
                  <th style="padding:10px;border:1px solid #ddd;">Assigned To</th>
                  <th style="padding:10px;border:1px solid #ddd;">Due Date</th>
                </tr>

                ${overdueHtml}
              </table>
            `
              : `
              <p style="color:green;">
                ✅ No overdue tasks.
              </p>
            `
          }

          ${
            todayTasks.length > 0
              ? `
              <h2 style="color:#f59e0b;">⏰ Due Today</h2>

              <table 
                style="
                  border-collapse: collapse;
                  width:100%;
                "
              >
                <tr style="background:#f3f4f6;">
                  <th style="padding:10px;border:1px solid #ddd;">Task</th>
                  <th style="padding:10px;border:1px solid #ddd;">Assigned To</th>
                  <th style="padding:10px;border:1px solid #ddd;">Due Date</th>
                </tr>

                ${todayHtml}
              </table>
            `
              : `
              <p style="color:green;">
                ✅ No tasks due today.
              </p>
            `
          }

          <hr style="margin-top:40px;" />

          <p style="font-size:12px;color:gray;">
            Shivohini Hub Automated Notification System
          </p>

        </div>
      `,
    });

    console.log("📨 Admin task report sent:", info.response);

  } catch (err) {
    console.error("❌ Admin task report email error:", err);
  }
};