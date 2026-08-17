import express from "express";
import { createServer as createViteServer } from "vite";
import session from "express-session";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getConfigFile = () => {
  const cwdPath = path.join(process.cwd(), "whatsapp_config.json");
  return cwdPath;
};

let inMemoryWhatsappNumber: string | null = null;

const getStoredWhatsappNumber = (): string => {
  if (inMemoryWhatsappNumber) {
    return inMemoryWhatsappNumber;
  }
  try {
    const configPath = getConfigFile();
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && parsed.whatsappNumber && typeof parsed.whatsappNumber === "string") {
        inMemoryWhatsappNumber = parsed.whatsappNumber.trim();
        return inMemoryWhatsappNumber;
      }
    }
  } catch (e) {
    console.error("Error reading whatsapp_config.json:", e);
  }
  return "01789-539494";
};

const saveStoredWhatsappNumber = (num: string) => {
  const trimmed = num.trim();
  inMemoryWhatsappNumber = trimmed;
  try {
    const configPath = getConfigFile();
    fs.writeFileSync(configPath, JSON.stringify({ whatsappNumber: trimmed }, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing whatsapp_config.json:", e);
  }
};

const getWhitelistFile = () => {
  return path.join(process.cwd(), "whitelisted_emails.json");
};

let inMemoryWhitelistedEmails: string[] | null = null;

const getStoredWhitelistedEmails = (): string[] => {
  if (inMemoryWhitelistedEmails) {
    return inMemoryWhitelistedEmails;
  }
  try {
    const file = getWhitelistFile();
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryWhitelistedEmails = Array.from(new Set(parsed.map(e => String(e).trim().toLowerCase()).filter(Boolean)));
        return inMemoryWhitelistedEmails;
      }
    }
  } catch (e) {
    console.error("Error reading whitelisted_emails.json:", e);
  }
  return ["websitetogather@gmail.com"];
};

const saveStoredWhitelistedEmails = (list: string[]) => {
  const cleanList = Array.from(new Set(list.map(e => String(e).trim().toLowerCase()).filter(Boolean)));
  inMemoryWhitelistedEmails = cleanList;
  try {
    const file = getWhitelistFile();
    fs.writeFileSync(file, JSON.stringify(cleanList, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing whitelisted_emails.json:", e);
  }
  return cleanList;
};

const getSessionsFile = () => {
  return path.join(process.cwd(), "active_sessions.json");
};

let inMemoryActiveSessions: Record<string, { token: string; timestamp: number }> | null = null;

const getStoredActiveSessions = (): Record<string, { token: string; timestamp: number }> => {
  if (inMemoryActiveSessions) {
    return inMemoryActiveSessions;
  }
  try {
    const file = getSessionsFile();
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        inMemoryActiveSessions = parsed;
        return inMemoryActiveSessions;
      }
    }
  } catch (e) {}
  inMemoryActiveSessions = {};
  return inMemoryActiveSessions;
};

const saveStoredActiveSessions = (sessions: Record<string, { token: string; timestamp: number }>) => {
  inMemoryActiveSessions = sessions;
  try {
    const file = getSessionsFile();
    fs.writeFileSync(file, JSON.stringify(sessions, null, 2), "utf-8");
  } catch (e) {}
  return sessions;
};

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

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Global Admin WhatsApp Number API
  app.get("/api/admin/whatsapp-number", (req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    const whatsappNumber = getStoredWhatsappNumber();
    res.json({ whatsappNumber });
  });

  app.post("/api/admin/whatsapp-number", (req, res) => {
    const { whatsappNumber } = req.body;
    if (whatsappNumber && typeof whatsappNumber === "string") {
      const trimmed = whatsappNumber.trim();
      saveStoredWhatsappNumber(trimmed);
      return res.json({ success: true, whatsappNumber: trimmed });
    }
    return res.status(400).json({ error: "Invalid whatsappNumber" });
  });

  // Whitelisted Emails API
  app.get("/api/admin/whitelisted-emails", (req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    const emails = getStoredWhitelistedEmails();
    res.json({ emails });
  });

  app.post("/api/admin/whitelisted-emails", (req, res) => {
    const { emails, addEmail, removeEmail } = req.body;
    let current = getStoredWhitelistedEmails();

    if (removeEmail && typeof removeEmail === "string") {
      const trimmed = removeEmail.trim().toLowerCase();
      current = saveStoredWhitelistedEmails(current.filter(e => e !== trimmed));
    } else if (addEmail && typeof addEmail === "string") {
      const trimmed = addEmail.trim().toLowerCase();
      if (trimmed) {
        current = saveStoredWhitelistedEmails([...current, trimmed]);
      }
    } else if (Array.isArray(emails)) {
      const incoming = emails.map(e => String(e).trim().toLowerCase()).filter(Boolean);
      current = saveStoredWhitelistedEmails([...current, ...incoming]);
    } else {
      current = saveStoredWhitelistedEmails(current);
    }

    res.json({ success: true, emails: current });
  });

  // Active User Session Lock API
  app.get("/api/user/active-session", (req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    const email = (req.query.email as string || "").trim().toLowerCase();
    const token = (req.query.token as string || "").trim();

    if (!email) {
      return res.json({ isValid: true });
    }

    const sessions = getStoredActiveSessions();
    const current = sessions[email];

    if (!current || !current.token || current.token === token) {
      return res.json({ isValid: true });
    }

    return res.json({
      isValid: false,
      currentToken: current.token,
      message: "অন্য ডিভাইস বা ব্রাউজার থেকে এই জিমেইল দিয়ে লগইন করায় সেশন স্থগিত করা হয়েছে।"
    });
  });

  app.post("/api/user/active-session", (req, res) => {
    const { email, sessionToken, action } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Invalid email" });
    }
    const trimmed = email.trim().toLowerCase();
    const token = String(sessionToken || "").trim();
    const sessions = getStoredActiveSessions();

    if (action === "register" || !sessions[trimmed]) {
      sessions[trimmed] = { token, timestamp: Date.now() };
      saveStoredActiveSessions(sessions);
      return res.json({ success: true, activeToken: token, isValid: true });
    }

    const current = sessions[trimmed];
    if (!current || !current.token || current.token === token) {
      sessions[trimmed] = { token, timestamp: Date.now() };
      saveStoredActiveSessions(sessions);
      return res.json({ isValid: true, activeToken: token });
    }

    return res.json({
      isValid: false,
      currentToken: current.token,
      message: "অন্য ডিভাইস বা ব্রাউজার থেকে এই জিমেইল দিয়ে লগইন করায় সেশন স্থগিত করা হয়েছে।"
    });
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
              <p style="color: #334155; font-size: 15px; line-height: 1.6;">আপনার অ্যাকাউন্ট পাসওয়ার্ড উদ্ধার করতে একটি অনুরোধ পাওয়া গেছে। নিচে প্রদত্ত ৬ ডিজিটের ওটিপিটি ব্যবহার করে অথবা বাটনে ক্লিক করে পাসওয়ার্ড পরিবর্তন সম্পন্ন করুন:</p>
              <div style="text-align: center; margin: 25px 0;">
                <div style="display: inline-block; background-color: #f1f5f9; border: 2px dashed #2563eb; padding: 12px 30px; font-size: 28px; font-weight: bold; letter-spacing: 8px; color: #1e293b; border-radius: 10px;">
                  ${code}
                </div>
              </div>
              <div style="text-align: center; margin: 20px 0;">
                <a href="${resetLink}" style="background-color: #2563eb; color: #ffffff; padding: 14px 35px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block; font-size: 14px; box-shadow: 0 4px 12px rgba(37,99,235,0.2);">পাসওয়ার্ড রিসেট করুন</a>
              </div>
              <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                * এই নিরাপত্তা কোড এবং রিসেট লিংকটি আগামী ১৫ মিনিটের জন্য বৈধ থাকবে।<br/>
                * আপনি যদি পাসওয়ার্ড পরিবর্তনের কোনো অনুরোধ না করে থাকেন, তবে এই ইমেইলটি উপেক্ষা করুন।
              </p>
            </div>
          `,
        });
      }

      return res.json({ success: true, message: "যাচাইকরণ কোড সফলভাবে পাঠানো হয়েছে।" });
    } catch (err: any) {
      console.error("Password reset error:", err);
      return res.status(500).json({ success: false, error: err.message || "Failed to process reset request" });
    }
  });

  // Verify 6-digit code endpoint
  app.post("/api/admin/verify-reset-code", async (req, res) => {
    try {
      const { email, code } = req.body;
      if (!email || !code) {
        return res.status(400).json({ error: "ইমেইল এবং কোড আবশ্যক।" });
      }

      const stored = resetCodesStore.get(email.toLowerCase().trim());
      if (!stored) {
        return res.status(400).json({ error: "যাচাইকরণ কোডের মেয়াদ উত্তীর্ণ হয়েছে অথবা কোডটি পাওয়া যায়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।" });
      }

      if (Date.now() > stored.expires) {
        resetCodesStore.delete(email.toLowerCase().trim());
        return res.status(400).json({ error: "যাচাইকরণ কোডের মেয়াদ উত্তীর্ণ হয়ে গেছে (১৫ মিনিট শেষ)। নতুন কোড নিন।" });
      }

      if (stored.code !== code.trim()) {
        return res.status(400).json({ error: "ভুল ওটিপি কোড! অনুগ্রহ করে আপনার ইমেইল চেক করে সঠিক ৬ ডিজিটের কোড দিন।" });
      }

      return res.json({ success: true, message: "ওটিপি সফলভাবে যাচাই করা হয়েছে।" });
    } catch (err: any) {
      console.error("Verify code error:", err);
      return res.status(500).json({ success: false, error: err.message || "Verification failed" });
    }
  });

  // AI Document Management Analysis Endpoint (Multi-Paragraph & Per-Paragraph Table Support with Strict Audit Validation & Human Confirmation)
  app.post("/api/document-management/analyze-note", async (req, res) => {
    try {
      const {
        originalObjectionText = "",
        originalObjectionFile = null, // { base64, mimeType, name }
        entityReplyText = "",
        entityReplyFile = null, // { base64, mimeType, name }
        evidenceText = "",
        evidenceFile = null, // { base64, mimeType, name }
        letterMetadata = {},
        userClarifications = [],
        userConfirmedProceed = false // When true, user has confirmed to proceed even if some fields were missing
      } = req.body;

      const apiKey = process.env.GEMINI_API_KEY;

      // Extract information from metadata
      const entity = letterMetadata.entityName || "সংশ্লিষ্ট প্রতিষ্ঠান";
      const ministry = letterMetadata.ministryName || "সংশ্লিষ্ট মন্ত্রণালয়";
      const diaryNo = letterMetadata.diaryNo || "-";
      const diaryDate = letterMetadata.diaryDate || "";
      const letterNo = letterMetadata.letterNo || "-";
      const letterDate = letterMetadata.letterDate || "";
      const branchName = letterMetadata.branchName || "";
      const auditYear = letterMetadata.auditYear || "";
      const totalAmount = letterMetadata.totalAmount || letterMetadata.involvedAmount || "";

      const rawCombined = `${originalObjectionText} ${entityReplyText} ${evidenceText}`.trim();
      const hasFiles = !!(originalObjectionFile || entityReplyFile || evidenceFile);
      const hasEvidence = !!(evidenceFile || (evidenceText && evidenceText.trim().length > 0));

      if (apiKey) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const promptParts: any[] = [];

          const promptText = `
আপনি গণপ্রজাতন্ত্রী বাংলাদেশ সরকারের বাণিজ্যিক অডিট অধিদপ্তরের একজন অত্যন্ত অভিজ্ঞ সিনিয়র অডিট অফিসার ও অডিট নিষ্পত্তি বিশেষজ্ঞ।

ইনপুট হিসেবে নিচের ৩টি পৃথক সেকশন বিবেচনা করুন:
১. ক. মূল অডিট আপত্তি / অনুচ্ছেদসমূহ (Original Objection)
২. খ. প্রতিষ্ঠানের জবাব ও ফরওয়ার্ডিং পত্র (Entity Reply & Forwarding)
৩. গ. প্রমাণকসমূহ (Evidence - চালান, ব্যাংক রসিদ, জমা ভাউচার, সমন্বয় বিবরণী ইত্যাদি) - বর্তমান স্ট্যাটাস: ${hasEvidence ? 'সংযুক্ত আছে (EVIDENCE PRESENT)' : 'সংযুক্ত নেই (NO EVIDENCE UPLOADED)'}

আপনার দায়িত্ব ও মূল নীতিমালা (Strict Operational Rules):

১. **ডকুমেন্ট অডিট-তথ্য যাচাইকরণ (Audit Information Validation Step)**:
   প্রেরিত বিষয়বস্তুতে নিচের মূল তথ্য আছে কিনা পরীক্ষা করুন:
   ক. **অনুচ্ছেদ নং (Paragraph No / paraNo)**
   খ. **নিরীক্ষা বছর (Audit Year / auditYear)**
   গ. **অডিটকৃত প্রতিষ্ঠান (Audited Entity / entityName)**
   ঘ. **চালান/আদায় সংক্রান্ত তথ্য (Challan / Recovery Info)**

২. **যাচাইকরণের সিদ্ধান্ত গ্রহণ (Decision Matrix)**:
   - **যদি টেক্সট বা ফাইলটি সম্পূর্ণ অপ্রাসঙ্গিক বা এলোমেলো (Gibberish) হয়**:
     - "isValidAuditDocument": false
     - "errorMessage": "আপনি সঠিক অডিট ডকুমেন্ট দেননি। অনুচ্ছেদ নং, নিরীক্ষা বছর ও প্রতিষ্ঠান সম্বলিত সঠিক ডকুমেন্ট প্রদান করে পুনরায় চেষ্টা করুন।"
   - **যদি অডিট সংক্রান্ত হয় কিন্তু কোনো তথ্য অনুপস্থিত থাকে**:
     - "isValidAuditDocument": true
     - "hasMissingInfo": true
     - "missingFields": অনুপস্থিত তথ্যগুলোর তালিকা (যেমন: ["নিরীক্ষা বছর"])
   - **যদি তথ্যসমূহ স্পষ্টভাবে থাকে**:
     - "isValidAuditDocument": true
     - "hasMissingInfo": false
     - "missingFields": []

৩. **প্রমাণক ভিত্তিক মন্তব্য লেখার শর্ত (CRITICAL COMMENT LOGIC)**:
   - **শর্ত ১ (যদি প্রমাণক সংযুক্ত না থাকে - hasEvidence = false)**:
     ব্যবহারকারী কেবল মূল অনুচ্ছেদ ও ফরওয়ার্ডিং/জবাব আপলোড করেছেন। এক্ষেত্রে এআই প্রতিটি অনুচ্ছেদ অনুযায়ী অনুচ্ছেদ নং, শিরোনাম, স্থানীয় অফিসের জবাব ("entityReplyHeader" / ছক) এবং প্রধান/নিয়ন্ত্রণকারী অফিসের জবাব ও সুপারিশ ("conclusionHeadOffice", "conclusionBranch") পুঙ্খানুপুঙ্খভাবে তৈরি করে বসিয়ে দেবে।
     **কিন্তু "এ কার্যালয়ের মন্তব্য" (conclusionPresenter এবং জারিপত্রের officeComment) অবশ্যই সম্পূর্ণ ফাঁকা ("") রাখতে হবে**। কোনো কাল্পনিক মন্তব্য লেখা যাবে না, কারণ প্রমাণক আপলোড না থাকলে মন্তব্য ব্যবহারকারী নিজে যাচাই করে লিখবেন।
   - **শর্ত ২ (যদি প্রমাণক সংযুক্ত থাকে - hasEvidence = true)**:
     ব্যবহারকারী চালান, জমা রসিদ বা ভাউচারের প্রমাণক আপলোড করেছেন। এক্ষেত্রে এআই প্রমাণক গভীরভাবে বিশ্লেষণ করে "এ কার্যালয়ের মন্তব্য" (conclusionPresenter এবং জারিপত্রের officeComment) পূর্ণাঙ্গ ও প্রমিত সরকারি ভাষায় লিখে দেবে এবং আপত্তি নিষ্পত্তির যৌক্তিক সুপারিশ ও স্ট্যাটাস ("পূর্ণাঙ্গ নিষ্পত্তি" / "আংশিক নিষ্পত্তি" / "অনিষ্পন্ন") উল্লেখ করবে।

চিঠির রেজিস্ট্রি মেটাডাটা (রেফারেন্সের জন্য):
- মন্ত্রণালয়: ${ministry}
- প্রতিষ্ঠান: ${entity}
- শাখা: ${branchName}
- নিরীক্ষা বছর: ${auditYear}
- ডায়েরি নং: ${diaryNo}, তারিখ: ${diaryDate}
- স্মারক নং: ${letterNo}, তারিখ: ${letterDate}
- জড়িত টাকার পরিমাণ: ${totalAmount} টাকা

${originalObjectionText ? `ক. মূল আপত্তি/অনুচ্ছেদের সারসংক্ষেপ বা টেক্সট:\n${originalObjectionText}\n` : ''}
${entityReplyText ? `খ. প্রতিষ্ঠানের প্রেরিত ফরওয়ার্ডিং ও জবাব টেক্সট:\n${entityReplyText}\n` : ''}
${evidenceText ? `গ. আপলোডকৃত প্রমাণকের বিবরণ/টেক্সট:\n${evidenceText}\n` : ''}

${userClarifications && userClarifications.length > 0 ? `ব্যবহারকারীর প্রদানকৃত পূর্ববর্তী স্পষ্টীকরণ (Clarifications from user):\n${JSON.stringify(userClarifications, null, 2)}\n` : ''}
${userConfirmedProceed ? `[গুরুত্বপূর্ণ]: ব্যবহারকারী ইতিমধ্যে নিশ্চিত করেছেন যে এটিই সঠিক ডকুমেন্ট। অতএব কোনো ফিল্ড মিসিং থাকলেও রেজিস্ট্রি মেটাডাটা বা যৌক্তিক খসড়া দিয়ে চূড়ান্ত নোট শিট প্রস্তুত করুন।\n` : ''}

বহু-অনুচ্ছেদ (Multi-Paragraphs) কাঠামো ও ফিল্ডের নিয়ম:
১. ডায়েরি হেডার ("diaryHeader"): "ডায়েরি নং- ${diaryNo}, তারিখ: ${diaryDate} খ্রি:" (নোটের শীর্ষে মাঝখানে)।
২. টোকা নং- ১১ ("noteTikaText"): <p><strong>টোকা নং- ১১:</strong> উপর্যুক্ত ডায়েরিভুক্ত ও সূত্রস্থ পত্রখানা <strong>${entity}</strong>, প্রধান কার্যালয়ের স্মারক নং- <strong>${letterNo}</strong>, তারিখ: <strong>${letterDate} খ্রি:</strong> পত্রটি <strong>(পৃষ্ঠা নং- )</strong> দেখতে সদয় মর্জি হয়। উক্ত পত্রের মাধ্যমে <strong>${ministry}</strong> এর নিয়ন্ত্রণাধীন <strong>${entity}</strong>${branchName ? `, ${branchName}` : ''} এর <strong>${auditYear}</strong> নিরীক্ষা বছরের ব্রডশীট জবাবের <strong>(পৃষ্ঠা নং- )</strong> ওপর প্রেরিত প্রমাণক যাচাই করে এ কার্যালয়ের মন্তব্য নিম্নে উপস্থাপন করা হলো।</p>

৩. প্রতিটি অনুচ্ছেদের ("paragraphs") তথ্য:
  ক. sl: "১", "২", ...
  খ. entityAndAuditYear: "প্রতিষ্ঠান: ${entity}${branchName ? `, ${branchName}` : ''}\nনিরীক্ষা বছর: ${auditYear}"
  গ. paraNo: অনুচ্ছেদের নম্বর (যেমন: "১০", "১১" ইত্যাদি - প্রাপ্ত ডকুমেন্ট অনুযায়ী)
  ঘ. titleAndDetails: "শিরোনাম: [সঠিক শিরোনাম]\nঅনুচ্ছেদের পৃষ্ঠা নং- \nপরিশिष्ट পৃষ্ঠা নং- "
  ঙ. entityReplyHeader: প্রতিষ্ঠানের স্থানীয় জবাব
  চ. আদায়ের ছক ("hasTable", "tableHeaders", "tableRows"): আদায়ের বিস্তারিত ছক যদি থাকে
  ছ. conclusionBranch: "এমতাবস্থায়, উক্ত আপত্তিটি নিষ্পত্তি হিসেবে গণ্য করার জন্য অনুরোধ করা হলো।"
  জ. conclusionHeadOffice: "শাখার জবাব ও প্রমাণকের আলোকে আপত্তিটি নিষ্পত্তির জন্য অনুরোধ করা হলো।"
  ঝ. conclusionPresenter: ${hasEvidence ? 'আপত্তির স্বপক্ষে প্রমাণক যাচাই করে অডিট মন্তব্য ও নিষ্পত্তির সুপারিশ' : '"" (প্রমাণক না থাকায় খালি স্ট্রিং থাকবে)'}
  ঞ. status: ${hasEvidence ? '"পূর্ণাঙ্গ নিষ্পত্তি" অথবা "আংশিক নিষ্পত্তি" অথবা "অনিষ্পন্ন / আপত্তি বহাল"' : '"মন্তব্য বিচারাধীন"'}

৪. জারিপত্র ("suggestedIssueLetter"):
   - memoNo: "৮২.১০.০০০০.৬০৩.৩৩.০০৫.১৬" বা ডায়েরি/স্মারক ভিত্তিক নম্বর
   - date: "       /      /২০২৬ খ্রি:"
   - recipient:
       - designation: "ব্যবস্থাপনা পরিচালক"
       - entityName: "${entity}"
       - address: "প্রধান কার্যালয়, ৩৫-৪২, ৪৪ মতিঝিল বা/এ"
       - city: "ঢাকা – ১০০০"
   - subject: "বিষয়: ${entity}${branchName ? `, ${branchName}` : ''} এর ${auditYear} সালের বাণিজ্যিক নিরীক্ষা প্রতিবেদনের ${letterMetadata?.paraType || 'নন-এসএফআই'} অনুচ্ছেদ নং ১০ এর জবাবের উপর মন্তব্য প্রেরণ।"
   - reference: "সূত্র: ${entity} এর পত্র নং ${letterNo}, তারিখ: ${letterDate}"
   - introText: "উপর্যুক্ত বিষয় ও সূত্রস্থ পত্রের প্রতি সদয় দৃষ্টি আকর্ষণ করা যাচ্ছে। সূত্রস্থ পত্রের মাধ্যমে প্রাপ্ত ${entity}${branchName ? `, ${branchName}` : ''} এর ${auditYear} সালের নিরীক্ষা প্রতিবেদনের ${letterMetadata?.paraType || 'নন-এসএফআই'} অনুচ্ছেদ নং ১০ এর জবাবের উপর এ কার্যালয়ের মন্তব্য নিম্নরূপ:"
   - tableRows: ৬ কলামের ছক (১. ক্রমিক নং, ২. অনু: নং ও নিরীক্ষা বছর, ৩. প্রতিষ্ঠানের নাম, ৪. অনুচ্ছেদের শিরোনাম, ৫. জড়িত টাকা, ৬. এ কার্যালয়ের মন্তব্য)
     - officeComment: ${hasEvidence ? 'প্রমাণক যাচাইয়ের আলোকে বিস্তারিত মন্তব্য' : '"" (প্রমাণক না থাকায় ফাঁকা থাকবে)'}
   - signatoryName: "নাসিফ কবির"
   - signatoryTitle: "উপ-পরিচালক"
   - signatoryPhone: "ফোন: ০২৪৭৭৭২২৬৫৬"
   - onulipiList: [
       "উপমহাব্যবস্থাপক, ${entity}, জিএম অফিস, খুলনা। (কপি সংশ্লিষ্ট শাখায় প্রেরণের জন্য অনুরোধ করা হলো)",
       "পিএ টু মহাপরিচালক/পরিচালক, বাণিজ্যিক অডিট অধিদপ্তর, প্রধান কার্যালয়, অডিট কমপ্লেক্স (৮ম ও ৯ ম তলা), সেগুনবাগিচা, ঢাকা।",
       "অফিস কপি।"
     ]

অনুগ্রহ করে শুধুমাত্র নিচের JSON স্কিমায় উত্তর দিন:
{
  "isValidAuditDocument": true,
  "auditVerification": {
    "hasParaNo": true,
    "hasAuditYear": true,
    "hasEntityName": true,
    "hasChallanInfo": true,
    "detectedParaNo": "১০",
    "detectedAuditYear": "${auditYear}",
    "detectedEntityName": "${entity}",
    "detectedChallanInfo": "চালান তথ্য",
    "missingFields": [],
    "summary": "ডকুমেন্টে অনুচ্ছেদ নং, নিরীক্ষা বছর ও প্রতিষ্ঠান পাওয়া গেছে।"
  },
  "validationErrors": [],
  "errorMessage": "",
  "needsClarification": false,
  "clarificationQuestions": [],
  "diaryHeader": "ডায়েরি নং- ${diaryNo}, তারিখ: ${diaryDate} খ্রি:",
  "noteTikaText": "...",
  "conclusionFinal": "সদয় অনুমোদনের জন্য নথি উপস্থাপন করা হলো।",
  "proposedStatus": "${hasEvidence ? 'পূর্ণাঙ্গ নিষ্পত্তি' : 'মন্তব্য বিচারাধীন'}",
  "paragraphs": [
    {
      "sl": "১",
      "entityAndAuditYear": "প্রতিষ্ঠান: ${entity}${branchName ? `, ${branchName}` : ''}\\nনিরীক্ষা বছর: ${auditYear}",
      "paraNo": "১০",
      "titleAndDetails": "শিরোনাম: ...\\nঅনুচ্ছেদের পৃষ্ঠা নং- ...\\nপরিশिष्ट পৃষ্ঠা নং- ...",
      "entityReplyHeader": "...",
      "hasTable": true,
      "tableHeaders": ["ক্রমিক", "ঋণগ্রহীতার নাম", "আপত্তিতে জড়িত টাকা", "আসল", "সুদ", "অন্যান্য", "মোট আদায়", "সমন্বয়ের তারিখ"],
      "tableRows": [
        ["১", "নাম", "১,০০,০০০", "৫০,০০০", "৫০,০০০", "-", "১,০০,০০০", "০১-০১-২০২৪"]
      ],
      "conclusionBranch": "এমতাবস্থায়, উক্ত আপত্তিটি নিষ্পত্তি হিসেবে গণ্য করার জন্য অনুরোধ করা হলো।",
      "conclusionHeadOffice": "শাখার জবাব ও প্রমাণকের আলোকে আপত্তিটি নিষ্পত্তির জন্য অনুরোধ করা হলো।",
      "conclusionPresenter": ${hasEvidence ? '"আপত্তিকৃত সমুদয় টাকা আদায় হওয়ায় ও আদায়ের স্বপক্ষে প্রমাণক সংযুক্ত থাকায় আপত্তিটি নিষ্পত্তি করা যেতে পারে।"' : '""'},
      "status": "${hasEvidence ? 'পূর্ণাঙ্গ নিষ্পত্তি' : 'মন্তব্য বিচারাধীন'}"
    }
  ],
  "suggestedIssueLetter": {
    "memoNo": "৮২.১০.০০০০.৬০৩.৩৩.০০৫.১৬",
    "date": "       /      /২০২৬ খ্রি:",
    "recipient": {
      "designation": "ব্যবস্থাপনা পরিচালক",
      "entityName": "${entity}",
      "address": "প্রধান কার্যালয়, ৩৫-৪২, ৪৪ মতিঝিল বা/এ",
      "city": "ঢাকা – ১০০০"
    },
    "subject": "বিষয়: ${entity}${branchName ? `, ${branchName}` : ''} এর ${auditYear} সালের বাণিজ্যিক নিরীক্ষা প্রতিবেদনের ${letterMetadata?.paraType || 'নন-এসএফআই'} অনুচ্ছেদ নং ১০ এর জবাবের উপর মন্তব্য প্রেরণ।",
    "reference": "সূত্র: ${entity} এর পত্র নং ${letterNo}, তারিখ: ${letterDate}",
    "introText": "উপর্যুক্ত বিষয় ও সূত্রস্থ পত্রের প্রতি সদয় দৃষ্টি আকর্ষণ করা যাচ্ছে। সূত্রস্থ পত্রের মাধ্যমে প্রাপ্ত ${entity}${branchName ? `, ${branchName}` : ''} এর ${auditYear} সালের নিরীক্ষা প্রতিবেদনের ${letterMetadata?.paraType || 'নন-এসএফআই'} অনুচ্ছেদ নং ১০ এর জবাবের উপর এ কার্যালয়ের মন্তব্য নিম্নরূপ:",
    "tableRows": [
      {
        "sl": "১",
        "paraAndYear": "১০, ${auditYear}",
        "entityName": "${entity}${branchName ? `, ${branchName}` : ''}।",
        "paraTitle": "মাইক্রো ক্রেডিট ঋণের মেয়াদোত্তীর্ণ অনাদায়ী টাকা।",
        "involvedAmount": "${totalAmount || '৫৭,৮২৫'}",
        "officeComment": ${hasEvidence ? '"আপত্তিকৃত ঋণ হিসাবসমূহের সমুদয় টাকা আদায় হওয়ায় এবং প্রমাণক হিসেবে আদায় বিবরণী, প্রত্যয়নপত্র ও জমা ভাউচার সংযুক্ত থাকায় জবাব ও প্রমাণকের আলোকে আপত্তিটি নিষ্পত্তি করা হলো।"' : '""'}
      }
    ],
    "signatoryName": "নাসিফ কবির",
    "signatoryTitle": "উপ-পরিচালক",
    "signatoryPhone": "ফোন: ০২৪৭৭৭২২৬৫৬",
    "onulipiList": [
      "উপমহাব্যবস্থাপক, ${entity}, জিএম অফিস, খুলনা। (কপি সংশ্লিষ্ট শাখায় প্রেরণের জন্য অনুরোধ করা হলো)",
      "পিএ টু মহাপরিচালক/পরিচালক, বাণিজ্যিক অডিট অধিদপ্তর, প্রধান কার্যালয়, অডিট কমপ্লেক্স (৮ম ও ৯ ম তলা), সেগুনবাগিচা, ঢাকা।",
      "অফিস কপি।"
    ]
  }
}
`;

          promptParts.push(promptText);

          // Helper to check if MIME type is supported by Gemini inlineData
          const isSupportedInlineMime = (mime: string) => {
            if (!mime) return false;
            const m = mime.toLowerCase();
            return (
              m.startsWith("image/") ||
              m === "application/pdf" ||
              m.startsWith("text/") ||
              m.startsWith("audio/") ||
              m.startsWith("video/")
            );
          };

          // If images/files were attached as base64
          if (originalObjectionFile && originalObjectionFile.base64) {
            const mime = originalObjectionFile.mimeType || "application/pdf";
            if (isSupportedInlineMime(mime)) {
              promptParts.push({
                inlineData: {
                  data: originalObjectionFile.base64.replace(/^data:[^;]+;base64,/, ""),
                  mimeType: mime
                }
              });
            } else {
              promptParts.push(`[সংযুক্ত ফাইল: ${originalObjectionFile.name || 'আপত্তি ফাইল'}]`);
            }
          }

          if (entityReplyFile && entityReplyFile.base64) {
            const mime = entityReplyFile.mimeType || "application/pdf";
            if (isSupportedInlineMime(mime)) {
              promptParts.push({
                inlineData: {
                  data: entityReplyFile.base64.replace(/^data:[^;]+;base64,/, ""),
                  mimeType: mime
                }
              });
            } else {
              promptParts.push(`[সংযুক্ত ফাইল: ${entityReplyFile.name || 'জবাব ফাইল'}]`);
            }
          }

          if (evidenceFile && evidenceFile.base64) {
            const mime = evidenceFile.mimeType || "application/pdf";
            if (isSupportedInlineMime(mime)) {
              promptParts.push({
                inlineData: {
                  data: evidenceFile.base64.replace(/^data:[^;]+;base64,/, ""),
                  mimeType: mime
                }
              });
            } else {
              promptParts.push(`[সংযুক্ত ফাইল: ${evidenceFile.name || 'প্রমাণক ফাইল'}]`);
            }
          }

          const response = await ai.models.generateContent({
            model: "gemini-3.7-flash",
            contents: promptParts,
            config: {
              responseMimeType: "application/json"
            }
          });

          const rawText = response.text || "{}";
          let parsedData: any = {};
          try {
            parsedData = JSON.parse(rawText);
          } catch (e) {
            const cleanJsonMatch = rawText.match(/\{[\s\S]*\}/);
            if (cleanJsonMatch) {
              parsedData = JSON.parse(cleanJsonMatch[0]);
            }
          }

          if (parsedData.isValidAuditDocument === false) {
            return res.json({
              success: true,
              isValid: false,
              source: "gemini_validator",
              errorMessage: parsedData.errorMessage || "আপনি সঠিক অডিট ডকুমেন্ট দেননি। অনুচ্ছেদ নং, নিরীক্ষা বছর ও প্রতিষ্ঠান সম্বলিত সঠিক ডকুমেন্ট প্রদান করে পুনরায় চেষ্টা করুন।",
              validationErrors: parsedData.validationErrors || []
            });
          }

          const verification = parsedData.auditVerification || {};
          const missing = Array.isArray(verification.missingFields) ? verification.missingFields : [];

          // If user hasn't explicitly confirmed yet AND some audit fields are missing:
          if (!userConfirmedProceed && missing.length > 0) {
            const missingText = missing.join(" ও ");
            return res.json({
              success: true,
              isValid: true,
              requiresConfirmation: true,
              auditVerification: verification,
              missingFields: missing,
              confirmationPrompt: `প্রদত্ত নথিতে [${missingText}] পাওয়া যায়নি বা অস্পষ্ট। এটিই কি আপনার কাঙ্ক্ষিত সঠিক অডিট ডকুমেন্ট? আপনি নিশ্চয়তা দিলে বিদ্যমান তথ্যের ভিত্তিতে নোট শিট প্রস্তুত করা হবে।`,
              data: parsedData
            });
          }

          return res.json({
            success: true,
            isValid: true,
            requiresConfirmation: false,
            auditVerification: verification,
            source: "gemini",
            data: parsedData
          });
        } catch (geminiError: any) {
          console.error("Gemini API call failed, falling back to intelligent drafting:", geminiError);
        }
      }

      // Rule-based Document Validation Engine
      const auditKeywords = [
        "আপত্তি", "অনুচ্ছেদ", "নিরীক্ষা", "অডিট", "টাকা", "আদায়", "জবাব", "চালান", "ভাউচার",
        "হিসাব", "স্মারক", "শাখা", "মন্ত্রণালয়", "প্রতিষ্ঠান", "বকেয়া", "ব্যাংক", "ট্রেজারি", "ভ্যাট", "ট্যাক্স",
        "audit", "para", "paragraph", "objection", "recovery", "challan"
      ];

      const hasAuditContext = auditKeywords.some(kw => rawCombined.toLowerCase().includes(kw));

      if (rawCombined.length > 0 && !hasAuditContext && !hasFiles) {
        return res.json({
          success: true,
          isValid: false,
          source: "rule_validator",
          errorMessage: "আপনি সঠিক অডিট ডকুমেন্ট দেননি। অনুচ্ছেদ নং, নিরীক্ষা বছর ও প্রতিষ্ঠান সম্বলিত সঠিক ডকুমেন্ট প্রদান করে পুনরায় চেষ্টা করুন।",
          validationErrors: [
            "প্রদত্ত টেক্সটে কোনো অডিট আপত্তি, অনুচ্ছেদ নম্বর বা নিরীক্ষা সংশ্লিষ্ট তথ্যাদি পাওয়া যায়নি।"
          ]
        });
      }

      if (rawCombined.length < 15 && !hasFiles && (!userClarifications || userClarifications.length === 0)) {
        return res.json({
          success: true,
          isValid: false,
          source: "rule_validator",
          errorMessage: "আপনি সঠিক অডিট ডকুমেন্ট দেননি। অনুচ্ছেদ নং, নিরীক্ষা বছর ও প্রতিষ্ঠান সম্বলিত সঠিক ডকুমেন্ট প্রদান করে পুনরায় চেষ্টা করুন।",
          validationErrors: [
            "ডকুমেন্টের বিবরণ অত্যন্ত সংক্ষিপ্ত বা অস্পষ্ট। সঠিক অনুচ্ছেদ ও জবাবের সফটকপি প্রদান করুন।"
          ]
        });
      }

      // 4-Point Rule Scanning
      const hasParaNo = /অনুচ্ছেদ|para|নং/i.test(rawCombined);
      const hasAuditYear = /২০[০-৯]{2}[-–/][০-৯]{2,4}|20[0-9]{2}[-–/][0-9]{2,4}|নিরীক্ষা\s*বছর/i.test(rawCombined) || !!auditYear;
      const hasEntityName = /প্রতিষ্ঠান|ব্যাংক|মিলস|সংস্থা|লিমিটেড|লি:|দপ্তর|অধিদপ্তর|কার্যালয়/i.test(rawCombined) || (entity && entity !== "সংশ্লিষ্ট প্রতিষ্ঠান");
      const hasChallanInfo = /চালান|ভাউচার|ট্রেজারি|আদায়|টাকা|পরিশোধ|সমন্বয়|রসিদ|জমা/i.test(rawCombined);

      const missingRuleFields: string[] = [];
      if (!hasParaNo) missingRuleFields.push("অনুচ্ছেদ নং");
      if (!hasAuditYear) missingRuleFields.push("নিরীক্ষা বছর");
      if (!hasEntityName) missingRuleFields.push("অডিটকৃত প্রতিষ্ঠান");
      if (!hasChallanInfo) missingRuleFields.push("চালান ও আদায়ের তথ্য");

      const ruleAuditVerification = {
        hasParaNo,
        hasAuditYear,
        hasEntityName,
        hasChallanInfo,
        detectedParaNo: hasParaNo ? (letterMetadata?.paraNo || "১০") : "",
        detectedAuditYear: hasAuditYear ? auditYear : "",
        detectedEntityName: hasEntityName ? entity : "",
        detectedChallanInfo: hasChallanInfo ? (totalAmount ? `${totalAmount} টাকা` : "আদায়/চালান সংক্রান্ত তথ্য") : "",
        missingFields: missingRuleFields,
        summary: missingRuleFields.length === 0 
          ? "নথিতে অনুচ্ছেদ নং, নিরীক্ষা বছর, প্রতিষ্ঠান ও চালানের তথ্য পাওয়া গেছে।"
          : `নথিতে ${missingRuleFields.join(", ")} সরাসরি পাওয়া যায়নি বা অস্পষ্ট।`
      };

      // If missing elements and user hasn't confirmed yet:
      if (!userConfirmedProceed && missingRuleFields.length > 0 && !hasFiles) {
        return res.json({
          success: true,
          isValid: true,
          requiresConfirmation: true,
          auditVerification: ruleAuditVerification,
          missingFields: missingRuleFields,
          confirmationPrompt: `প্রদত্ত নথিতে [${missingRuleFields.join(" ও ")}] সরাসরি পাওয়া যায়নি বা অস্পষ্ট। এটিই কি আপনার কাঙ্ক্ষিত সঠিক অডিট ডকুমেন্ট? আপনি নিশ্চয়তা দিলে বিদ্যমান তথ্যের ভিত্তিতে নোট শিট প্রস্তুত করা হবে।`
        });
      }

      // Fallback Multi-Paragraph structure
      const fallbackNote = {
        isValidAuditDocument: true,
        auditVerification: ruleAuditVerification,
        needsClarification: false,
        clarificationQuestions: [],
        diaryHeader: `ডায়েরি নং- ${diaryNo || "২৩৯"}, তারিখ: ${diaryDate || "৩০/০৭/২০২৬"} খ্রি:`,
        noteTikaText: `টীকা নং- ১১: উপর্যুক্ত ডায়েরিভুক্ত ও সূত্রস্থ পত্রখানা ${entity}, প্রধান কার্যালয়ের স্মারক নং- ${letterNo || "এসবি/প্রকা/ইএসসিডি/সবানি/১৩২"}, তারিখ: ${letterDate || "২৭/০৭/২০২৬"} খ্রি: পত্রটি (পৃষ্ঠা নং- ২৯২) দেখতে সদয় মর্জি হয়। উক্ত পত্রের মাধ্যমে ${ministry}-এর নিয়ন্ত্রণাধীন ${entity}${branchName ? `, ${branchName}` : ''} এর ${auditYear} নিরীক্ষা বছরের ব্রডশীট জবাবের (পৃষ্ঠা নং- ২৬৮-২৯২) ওপর প্রেরিত প্রমাণক যাচাই করে এ কার্যালয়ের মন্তব্য নিম্নে উপস্থাপন করা হলো।`,
        conclusionFinal: `সদয় অনুমোদনের জন্য নথি উপস্থাপন করা হলো।`,
        proposedStatus: "পূর্ণাঙ্গ নিষ্পত্তি",
        paragraphs: [
          {
            sl: "১",
            entityAndAuditYear: `প্রতিষ্ঠান: ${entity}${branchName ? `,\n${branchName}` : ''}\nনিরীক্ষা বছর: ${auditYear || '২০১১-১২'}`,
            paraNo: letterMetadata?.paraNo ? String(letterMetadata.paraNo) : "১০",
            titleAndDetails: originalObjectionText 
              ? (originalObjectionText.length > 120 ? originalObjectionText.substring(0, 120) + "..." : originalObjectionText)
              : `শিরোনাম: ${letterMetadata?.subject || 'অডিট আপত্তি অনুচ্ছেদ'}\nঅনুচ্ছেদের পৃষ্ঠা নং- \nপরিশिष्ट পৃষ্ঠা নং- `,
            entityReplyHeader: entityReplyText || "আপত্তিতে উল্লেখিত দাবিকৃত অর্থ ও চালানের প্রেক্ষিতে জবাব নিম্নরূপ:",
            hasTable: false,
            tableHeaders: ["ক্রমিক", "বিবরণ", "আপত্তিতে জড়িত টাকা", "আদায়/সমন্বয়কৃত টাকা", "অবশিষ্ট বকেয়া", "সমন্বয়ের তারিখ/চালান"],
            tableRows: [
              ["১", branchName || entity, totalAmount || "০", totalAmount || "০", "০", "-"]
            ],
            conclusionBranch: `এমতাবস্থায়, উক্ত আপত্তিটি নিষ্পত্তি হিসেবে গণ্য করার জন্য অনুরোধ করা হলো।`,
            conclusionHeadOffice: `শাখার জবাব ও প্রমাণকের আলোকে আপত্তিটি নিষ্পত্তির জন্য অনুরোধ করা হলো।`,
            conclusionPresenter: hasEvidence
              ? `আপত্তিকৃত টাকার স্বপক্ষে প্রমাণক দাখিল করায় ও আদায় সঠিক থাকায় আপত্তিটি নিষ্পত্তির সুপারিশ করা হলো।`
              : ``,
            status: hasEvidence ? "পূর্ণাঙ্গ নিষ্পত্তি" : "মন্তব্য বিচারাধীন"
          }
        ],
        suggestedIssueLetter: {
          memoNo: "৮২.১০.০০০০.৬০৩.৩৩.০০৫.১৬",
          date: "       /      /২০২৬ খ্রি:",
          recipient: {
            designation: "ব্যবস্থাপনা পরিচালক",
            entityName: entity || "সোনালী ব্যাংক পিএলসি",
            address: "প্রধান কার্যালয়, ৩৫-৪২, ৪৪ মতিঝিল বা/এ",
            city: "ঢাকা – ১০০০"
          },
          subject: `বিষয়: ${entity || "সোনালী ব্যাংক পিএলসি"}${branchName ? `, ${branchName}` : ', দর্শনা শাখা, চুয়াডাঙ্গা'} এর ${auditYear || '২০১১-১৪'} সালের বাণিজ্যিক নিরীক্ষা প্রতিবেদনের ${letterMetadata?.paraType || 'নন-এসএফআই'} অনুচ্ছেদ নং ১০ এর জবাবের উপর মন্তব্য প্রেরণ।`,
          reference: `সূত্র: ${entity || "সোনালী ব্যাংক পিএলসি"} এর পত্র নং ${letterNo || "এসবি/প্রকা/ইএসসিডি/সবানি/১৩২"}, তারিখ: ${letterDate || "২৭/০৭/২০২৬"}`,
          introText: `উপর্যুক্ত বিষয় ও সূত্রস্থ পত্রের প্রতি সদয় দৃষ্টি আকর্ষণ করা যাচ্ছে। সূত্রস্থ পত্রের মাধ্যমে প্রাপ্ত ${entity || "সোনালী ব্যাংক পিএলসি"}${branchName ? `, ${branchName}` : ', দর্শনা শাখা, চুয়াডাঙ্গা'} এর ${auditYear || '২০১১-২০১৪'} সালের নিরীক্ষা প্রতিবেদনের ${letterMetadata?.paraType || 'নন-এসএফআই'} অনুচ্ছেদ নং ১০ এর জবাবের উপর এ কার্যালয়ের মন্তব্য নিম্নরূপ:`,
          tableRows: [
            {
              sl: "১",
              paraAndYear: `১০, ${auditYear || '২০১১-১৪'}`,
              entityName: `${entity || "সোনালী ব্যাংক পিএলসি"}${branchName ? `,\n${branchName}` : ',\nদর্শনা শাখা, চুয়াডাঙ্গা।'}`,
              paraTitle: `মাইক্রো ক্রেডিট (উন্মেষ)\nঋণের মেয়াদোত্তীর্ণ\nঅনাদায়ী ${totalAmount || '৫৭,৮২৫'}\nটাকা।`,
              involvedAmount: `${totalAmount || '৫৭,৮২৫'}`,
              officeComment: hasEvidence
                ? `আপত্তিকৃত ঋণ হিসাবসমূহের সমুদয় টাকা আদায় হওয়ায় এবং প্রমাণক হিসেবে আদায় বিবরণী, প্রত্যয়নপত্র ও জমা ভাউচার সংযুক্ত থাকায় জবাব ও প্রমাণকের আলোকে আপত্তিটি নিষ্পত্তি করা হলো।`
                : ``
            }
          ],
          signatoryName: "নাসিফ কবির",
          signatoryTitle: "উপ-পরিচালক",
          signatoryPhone: "ফোন: ০২৪৭৭৭২২৬৫৬",
          onulipiList: [
            `উপমহাব্যবস্থাপক, ${entity || "সোনালী ব্যাংক পিএলসি"}, জিএম অফিস, খুলনা। (কপি সংশ্লিষ্ট শাখায় প্রেরণের জন্য অনুরোধ করা হলো)`,
            `পিএ টু মহাপরিচালক/পরিচালক, বাণিজ্যিক অডিট অধিদপ্তর, প্রধান কাযায়, অডিট কমপ্লেক্স (৮ম ও ৯ ম তলা), সেগুনবাগিচা, ঢাকা।`,
            `অফিস কপি।`
          ]
        }
      };

      return res.json({
        success: true,
        isValid: true,
        requiresConfirmation: false,
        auditVerification: ruleAuditVerification,
        source: "rule_engine",
        data: fallbackNote
      });

    } catch (err: any) {
      console.error("Error in /api/document-management/analyze-note:", err);
      res.status(500).json({ error: err.message || "ডকুমেন্ট বিশ্লেষণে ত্রুটি দেখা দিয়েছে।" });
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
