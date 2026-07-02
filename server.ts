import express from "express";
import { createServer as createViteServer } from "vite";
import session from "express-session";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(cookieParser());
  app.use(session({
    secret: process.env.SESSION_SECRET || "ocr-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { 
      secure: true,
      sameSite: 'none',
      httpOnly: true
    }
  }));

  // API routes go here
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Temporary in-memory store for OTPs
  const resetCodesStore = new Map<string, { code: string; expires: number }>();

  // Endpoint to send a 6-digit verification code to Gmail
  app.post("/api/admin/request-password-reset", async (req, res) => {
    try {
      const { email, origin } = req.body;
      if (!email) {
        return res.status(400).json({ error: "ইমেইল প্রদান করা আবশ্যক।" });
      }

      // Generate a 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = Date.now() + 15 * 60 * 1000; // 15 minutes expiration

      resetCodesStore.set(email.toLowerCase().trim(), { code, expires });

      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = process.env.SMTP_PORT;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      const fromEmail = process.env.FROM_EMAIL || "no-reply@dapathshala.com";

      const isSMTPConfigured = !!(smtpHost && smtpUser && smtpPass);

      if (isSMTPConfigured) {
        const nodemailer = await import("nodemailer");
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: parseInt(smtpPort || "587"),
          secure: smtpPort === "465",
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        const resetLink = `${origin || 'https://ledger.dapathshala.com'}/?reset-email=${encodeURIComponent(email)}&reset-code=${code}`;

        await transporter.sendMail({
          from: `"Audit Ledger Security" <${fromEmail}>`,
          to: email,
          subject: "পাসওয়ার্ড রিসেটের সিকিউরিটি কোড",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #2563eb; margin: 0; font-size: 24px; font-weight: 800;">অডিট লেজার সেটেলমেন্ট</h1>
                <p style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; margin: 4px 0 0 0;">Security Recovery</p>
              </div>
              <p style="color: #334155; font-size: 15px; line-height: 1.6;">প্রিয় এডমিন,</p>
              <p style="color: #334155; font-size: 15px; line-height: 1.6;">আপনার অ্যাকাউন্ট পাসওয়ার্ড উদ্ধার করতে একটি অনুরোধ পাওয়া গেছে। নিচে প্রদত্ত ৬ ডিজিটের ওটিপিটি ব্যবহার করে পুনরায় পাসওয়ার্ড রিসেট করতে পারবেন:</p>
              <div style="text-align: center; margin: 30px auto;">
                <span style="font-size: 36px; font-weight: 850; letter-spacing: 6px; background-color: #f8fafc; padding: 12px 36px; border-radius: 12px; border: 1px solid #e2e8f0; color: #1e3a8a; display: inline-block;">${code}</span>
              </div>
              <p style="color: #334155; font-size: 15px; line-height: 1.6; text-align: center;">অথবা সরাসরি নিচের লিংকে ক্লিক করে নতুন পাসওয়ার্ড সেট করুন:</p>
              <div style="text-align: center; margin: 25px 0;">
                <a href="${resetLink}" style="background-color: #2563eb; color: #ffffff; padding: 14px 35px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block; font-size: 14px; box-shadow: 0 4px 12px rgba(37,99,235,0.2);">পাসওয়ার্ড রিসেট করুন</a>
              </div>
              <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                * এই নিরাপত্তা কোড এবং রিসেট লিংকটি আগামী ১৫ মিনিটের জন্য বৈধ থাকবে।<br/>
                * আপনি যদি পাসওয়ার্ড পরিবর্তনের কোনো অনুরোধ না করে থাকেন, তবে এই ইমেইলটি উপেক্ষা করুন।
              </p>
              <p style="text-align: center; font-size: 11.5px; color: #94a3b8; margin: 25px 0 0 0; font-weight: 500;">© অডিট লেজার সেটেলমেন্ট সিস্টেম</p>
            </div>
          `,
        });

        return res.json({ success: true, message: "পাসওয়ার্ড রিসেট কোডটি আপনার জিমেইলে পাঠানো হয়েছে।" });
      } else {
        // Fallback simulated model
        console.log(`[SMTP SIMULATION] password reset requested for recipient: ${email}. Code: ${code}`);
        return res.json({
          success: true,
          simulated: true,
          code,
          message: "আপনার ইমেইল সার্ভার (SMTP) এখনও কনফিগার করা হয়নি। আপনার সুবিধার জন্য ডেমো মোডে রিকভারি কোডটি নিচে দেখানো হলো।"
        });
      }
    } catch (error: any) {
      console.error("Password reset error:", error);
      res.status(500).json({ error: error.message || "পাসওয়ার্ড রিসেট রিকোয়েস্টে সমস্যা হয়েছে।" });
    }
  });

  // Endpoint to verify OTP
  app.post("/api/admin/verify-reset-code", (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: "ইমেইল এবং কোড প্রদান করা আবশ্যক।" });
    }

    const record = resetCodesStore.get(email.toLowerCase().trim());
    if (!record) {
      return res.status(400).json({ error: "কোনো রিসেট অনুরোধ পাওয়া যায়নি বা মেয়াদ শেষ হয়েছে।" });
    }

    if (Date.now() > record.expires) {
      resetCodesStore.delete(email.toLowerCase().trim());
      return res.status(400).json({ error: "কোডটির মেয়াদ শেষ হয়ে গেছে। দয়া করে আবার চেষ্টা করুন।" });
    }

    if (record.code === code.trim()) {
      resetCodesStore.delete(email.toLowerCase().trim());
      return res.json({ success: true, message: "কোডটি সঠিকভাবে যাচাই করা হয়েছে।" });
    } else {
      return res.status(400).json({ error: "ভুল সিকিউরিটি কোড! আবার চেষ্টা করুন।" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
