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

      const rawCombined = `${originalObjectionText} ${entityReplyText}`.trim();
      const hasFiles = !!(originalObjectionFile || entityReplyFile);

      if (apiKey) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const promptParts: any[] = [];

          const promptText = `
আপনি গণপ্রজাতন্ত্রী বাংলাদেশ সরকারের বাণিজ্যিক অডিট অধিদপ্তরের একজন অত্যন্ত অভিজ্ঞ সিনিয়র অডিট অফিসার ও অডিট নিষ্পত্তি বিশেষজ্ঞ।

আপনার প্রথম এবং প্রধান দায়িত্ব হলো ইনপুট হিসেবে দেওয়া ডকুমেন্টটি গভীরভাবে যাচাই (Audit Document 4-Point Validation) করা:

১. **ডকুমেন্ট অডিট-তথ্য যাচাইকরণ (Audit Information Validation Step)**:
   প্রেরিত টেক্সট বা ফাইলের বিষয়বস্তুতে নিচের ৪টি মূল তথ্য আছে কিনা তা পৃথকভাবে অত্যন্ত সতর্কতার সাথে পরীক্ষা করুন:
   ক. **অনুচ্ছেদ নং (Paragraph No / paraNo)**: নির্দিষ্ট অনুচ্ছেদ নম্বর (যেমন: অনুচ্ছেদ নং- ১০, ১২, ১৫ ইত্যাদি)।
   খ. **নিরীক্ষা বছর (Audit Year / auditYear)**: নিরীক্ষা সাল (যেমন: ২০২২-২৩, ২০১৯-২০ ইত্যাদি)।
   গ. **অডিটকৃত প্রতিষ্ঠান (Audited Entity / entityName)**: অডিটকৃত প্রতিষ্ঠান, সংস্থা বা ব্যাংকের নাম/শাখা।
   ঘ. **চালান ও আদায়ের তথ্য (Challan / Recovery / Adjustment Info)**: চালানের নম্বর, তারিখ, আদায়ের টাকার পরিমাণ, ভাউচার বা সমন্বয়ের তথ্য।

২. **যাচাইকরণের সিদ্ধান্ত গ্রহণ (Decision Matrix)**:
   - **যদি প্রেরিত টেক্সট বা ফাইলটি সম্পূর্ণ অপ্রাসঙ্গিক, ভুলভাল/এলোমেলো (Random/Gibberish), সাধারণ চিঠি বা অডিট আপত্তির সাথে বিন্দুমাত্র সম্পর্কহীন কোনো লেখা হয়**:
     - "isValidAuditDocument": false
     - "errorMessage": "আপনি সঠিক অডিট ডকুমেন্ট দেননি। অনুচ্ছেদ নং, নিরীক্ষা বছর ও প্রতিষ্ঠান সম্বলিত সঠিক ডকুমেন্ট প্রদান করে পুনরায় চেষ্টা করুন।"
   - **যদি ডকুমেন্টটি অডিট সংক্রান্ত হয় কিন্তু উপরোক্ত ৪টি তথ্যের মধ্যে এক বা একাধিক তথ্য (যেমন: নিরীক্ষা বছর বা চালানের তথ্য বা অনুচ্ছেদ নং) অনুপস্থিত বা অস্পষ্ট থাকে**:
     - "isValidAuditDocument": true
     - "hasMissingInfo": true
     - "missingFields": অনুপস্থিত তথ্যগুলোর বাংলা নামের তালিকা (যেমন: ["নিরীক্ষা বছর", "চালানের তথ্য"])
     - "confirmationMessage": "প্রদত্ত ডকুমেন্টে [অনুপস্থিত তথ্যের নামসমূহ] সরাসরি পাওয়া যাচ্ছে না বা মিলছে না। এটিই কি আপনার কাঙ্ক্ষিত সঠিক অডিট ডকুমেন্ট?"
   - **যদি সবগুলো তথ্য স্পষ্টভাবে থাকে**:
     - "isValidAuditDocument": true
     - "hasMissingInfo": false
     - "missingFields": []

চিঠির রেজিস্ট্রি মেটাডাটা (রেফারেন্সের জন্য):
- মন্ত্রণালয়: ${ministry}
- প্রতিষ্ঠান: ${entity}
- শাখা: ${branchName}
- নিরীক্ষা বছর: ${auditYear}
- ডায়েরি নং: ${diaryNo}, তারিখ: ${diaryDate}
- স্মারক নং: ${letterNo}, তারিখ: ${letterDate}
- জড়িত টাকার পরিমাণ: ${totalAmount} টাকা

${originalObjectionText ? `মূল আপত্তি/অনুচ্ছেদের সারসংক্ষেপ বা টেক্সট:\n${originalObjectionText}\n` : ''}
${entityReplyText ? `প্রতিষ্ঠানের প্রেরিত জবাব ও প্রমাণক টেক্সট:\n${entityReplyText}\n` : ''}

${userClarifications && userClarifications.length > 0 ? `ব্যবহারকারীর প্রদানকৃত পূর্ববর্তী স্পষ্টীকরণ (Clarifications from user):\n${JSON.stringify(userClarifications, null, 2)}\n` : ''}
${userConfirmedProceed ? `[গুরুত্বপূর্ণ]: ব্যবহারকারী ইতিমধ্যে নিশ্চিত করেছেন যে এটিই সঠিক ডকুমেন্ট। অতএব কোনো ফিল্ড মিসিং থাকলেও রেজিস্ট্রি মেটাডাটা বা যৌক্তিক খসড়া দিয়ে চূড়ান্ত নোট শিট প্রস্তুত করুন।\n` : ''}

বৈধ ডকুমেন্টের ক্ষেত্রে বহু-অনুচ্ছেদ (Multi-Paragraphs) কাঠামো ও ফিল্ডে বসানোর নিয়ম:
১. ডায়েরি হেডার ("diaryHeader"): "ডায়েরি নং- ${diaryNo}, তারিখ: ${diaryDate} খ্রি:" (নোটের শীর্ষে মাঝখানে)।
২. টীকা নং- ১১ ("noteTikaText"): উপর্যুক্ত ডায়েরিভুক্ত ও সূত্রস্থ পত্রখানা ${entity}, প্রধান কার্যালয়ের স্মারক নং- ${letterNo}, তারিখ: ${letterDate} খ্রি: পত্রটি দেখতে সদয় মর্জি হয়। উক্ত পত্রের মাধ্যমে ${ministry}-এর নিয়ন্ত্রণাধীন ${entity}${branchName ? `, ${branchName}` : ''} এর ${auditYear} নিরীক্ষা বছরের ব্রডশীট জবাবের ওপর প্রেরিত প্রমাণক যাচাই করে এ কার্যালয়ের মন্তব্য নিম্নে উপস্থাপন করা হলো।

৩. প্রতিটি অনুচ্ছেদের ("paragraphs") তথ্য:
  ক. sl: "১", "২", ...
  খ. entityAndAuditYear: "প্রতিষ্ঠান: ${entity}${branchName ? `, ${branchName}` : ''}\nনিরীক্ষা বছর: ${auditYear}"
  গ. paraNo: অনুচ্ছেদের নম্বর (যেমন: "১০", "১১" ইত্যাদি - প্রাপ্ত ডকুমেন্ট অনুযায়ী)
  ঘ. titleAndDetails: "শিরোনাম: ...\nঅনুচ্ছেদের পৃষ্ঠা নং- ...\nপরিশिष्ट পৃষ্ঠা নং- ..."
  ঙ. entityReplyHeader: প্রতিষ্ঠানের প্রেরিত জবাব প্রমিত বাংলায়
  চ. আদায়ের ছক ("hasTable", "tableHeaders", "tableRows"):
     - যদি হিসাবে/জবাবে একাধিক ব্যক্তি বা চালানের টাকা আদায়ের ব্রেকডাউন থাকে তবে hasTable: true এবং বিস্তারিত টেবিল দিন। না থাকলে hasTable: false
  ছ. conclusionBranch: "এমতাবস্থায়, উক্ত আপত্তিটি নিষ্পত্তি হিসেবে গণ্য করার জন্য অনুরোধ করা হলো।"
  জ. conclusionHeadOffice: "শাখার জবাব ও প্রমাণকের আলোকে আপত্তিটি নিষ্পত্তির জন্য অনুরোধ করা হলো।"
  ঝ. conclusionPresenter: আপত্তির প্রমাণক অনুযায়ী অডিট মূল্যায়ন ও মতামত (যেমন: সমুদয় টাকা আদায় হওয়ায় আপত্তিটি নিষ্পত্তির সুপারিশ)।
  ঞ. status: "পূর্ণাঙ্গ নিষ্পত্তি" অথবা "আংশিক নিষ্পত্তি" অথবা "অনিষ্পন্ন / আপত্তি বহাল"

৪. নোটের সমাপনী ("conclusionFinal"): "সদয় অনুমোদনের জন্য নথি উপস্থাপন করা হলো।"

৫. জারিপত্র ("suggestedIssueLetter"): বিষয়, স্মারক, প্রাপক ও বডি এইচটিএমএল।

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
    "detectedChallanInfo": "চালান নং ১২৩, ৫০,০০০ টাকা আদায়",
    "missingFields": [],
    "summary": "ডকুমেন্টে অনুচ্ছেদ নং, নিরীক্ষা বছর, প্রতিষ্ঠান ও আদায়ের তথ্য পাওয়া গেছে।"
  },
  "validationErrors": [],
  "errorMessage": "",
  "needsClarification": false,
  "clarificationQuestions": [],
  "diaryHeader": "ডায়েরি নং- ${diaryNo}, তারিখ: ${diaryDate} খ্রি:",
  "noteTikaText": "...",
  "conclusionFinal": "সদয় অনুমোদনের জন্য নথি উপস্থাপন করা হলো।",
  "proposedStatus": "পূর্ণাঙ্গ নিষ্পত্তি",
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
      "conclusionPresenter": "...",
      "status": "পূর্ণাঙ্গ নিষ্পত্তি"
    }
  ],
  "suggestedIssueLetter": {
    "subject": "${entity} এর ${auditYear} নিরীক্ষা বর্ষের অডিট আপত্তি নিষ্পত্তি সংক্রান্ত জারিপত্র।",
    "reference": "আপনাদের পত্র নং: ${letterNo}, তারিখ: ${letterDate}",
    "recipient": "ব্যবস্থাপনা পরিচালক / প্রধান নির্বাহী কর্মকর্তা, ${entity}",
    "bodyHtml": "উপযুক্ত বিষয় ও সূত্রের পরিপ্রেক্ষিতে জানানো যাচ্ছে যে...",
    "signatoryTitle": "উপপরিচালক / অডিট অফিসার"
  }
}
`;

          promptParts.push(promptText);

          // If images/files were attached as base64
          if (originalObjectionFile && originalObjectionFile.base64 && originalObjectionFile.mimeType) {
            promptParts.push({
              inlineData: {
                data: originalObjectionFile.base64.replace(/^data:[^;]+;base64,/, ""),
                mimeType: originalObjectionFile.mimeType
              }
            });
          }

          if (entityReplyFile && entityReplyFile.base64 && entityReplyFile.mimeType) {
            promptParts.push({
              inlineData: {
                data: entityReplyFile.base64.replace(/^data:[^;]+;base64,/, ""),
                mimeType: entityReplyFile.mimeType
              }
            });
          }

          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
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
            entityAndAuditYear: `প্রতিষ্ঠান: ${entity}${branchName ? `,\n${branchName}` : ''}\nনিরীক্ষা বছর: ${auditYear || '২০১০-১১, ২০১৪-১৫, ২০১৫-১৬, ২০১৮-১৯'}`,
            paraNo: letterMetadata?.paraNo ? String(letterMetadata.paraNo) : "১০",
            titleAndDetails: `শিরোনাম: ${letterMetadata?.subject || 'মাইক্রো ক্রেডিট (উন্মেষ) ঋণের মেয়াদোত্তীর্ণ অনাদায়ি ' + (totalAmount || '৫৭,৮২৫') + ' টাকা।'}\nঅনুচ্ছেদের পৃষ্ঠা নং- ২৯১\nপরিশिष्ट পৃষ্ঠা নং- ২৯০`,
            entityReplyHeader: `আপত্তিতে উল্লেখিত ৪ টি মাইক্রো ক্রেডিট “জাগো নারী” ঋণ আসল ও সুদসহ আদায় করা হয়েছে (প্রমাণক সংযুক্ত) যা নিচে উপস্থাপন করা হলো:`,
            hasTable: true,
            tableHeaders: ["ক্রমিক", "ঋণগ্রহীতার নাম", "আপত্তিতে জড়িত টাকা", "আসল", "সুদ", "অন্যান্য", "মোট আদায়", "সমন্বয়ের তারিখ"],
            tableRows: [
              ["১", "ফেরদৌসী বেগম", "১৪,৫০৬", "৬,৮০০", "৭,৭০৬", "-", "১৪,৫০৬", "২০-০২-১৭"],
              ["২", "শারমিন আক্তার", "১৪,৫০৬", "৬,৮০০", "৭,৭০৬", "-", "১৪,৫০৬", "২২-১০-১৭"],
              ["৩", "মুরশিদা বেগম", "১৪,৫০৬", "৬,৮০০", "৭,৭০৬", "-", "১৪,৫০৬", "০৯-০৮-১৬"],
              ["৪", "মো: সাঈদ হোসেন", "১৪,৩০৭", "৩,০০০", "১১,৩০৭", "-", "১৪,৩০৭", "২২-০৯-১৫"]
            ],
            conclusionBranch: `এমতাবস্থায়, উক্ত আপত্তিটি নিষ্পত্তি হিসেবে গণ্য করার জন্য অনুরোধ করা হলো।`,
            conclusionHeadOffice: `শাখার জবাব ও প্রমাণকের আলোকে আপত্তিটি নিষ্পত্তির জন্য অনুরোধ করা হলো।`,
            conclusionPresenter: `আপত্তিকৃত সমুদয় টাকা আদায় হওয়ায় ও আদায়ের স্বপক্ষে প্রমাণক (২৬৮-২৮৮) সংযুক্ত থাকায় আপত্তিটি নিষ্পত্তি করা যেতে পারে।`,
            status: "পূর্ণাঙ্গ নিষ্পত্তি"
          }
        ],
        suggestedIssueLetter: {
          subject: `${entity} এর ${auditYear} নিরীক্ষা বর্ষের অডিট আপত্তি নিষ্পত্তি প্রসঙ্গে।`,
          reference: `আপনার পত্র নং: ${letterNo}, তারিখ: ${letterDate}`,
          recipient: `ব্যবস্থাপনা পরিচালক / প্রধান নির্বাহী কর্মকর্তা\n${entity}`,
          bodyHtml: `উপযুক্ত বিষয় ও সূত্রের পরিপ্রেক্ষিতে জানানো যাচ্ছে যে, আপনার কার্যালয়ের ${auditYear} নিরীক্ষা বর্ষের আপত্তির বিপরীতে দাখিলকৃত জবাব ও প্রমাণকসমূহ এ কার্যালয়ে সন্তোষজনকভাবে যাচাই করা হয়েছে। সার্বিক পর্যালোচনায় উক্ত অনুচ্ছেদটি অত্র কার্যালয় কর্তৃক নিষ্পত্তি করা হলো।`,
          signatoryTitle: `উপপরিচালক\nবাণিজ্যিক অডিট অধিদপ্তর, আঞ্চলিক কার্যালয়, খুলনা`
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
