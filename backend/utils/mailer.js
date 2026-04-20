import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // MUST be app password
  },
});

// ✅ Check connection
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Mail server error:", error);
  } else {
    console.log("✅ Mail server ready");
  }
});

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

    console.log("📨 Email sent:", info.response);

  } catch (err) {
    console.error("❌ Email send error:", err);
  }
};