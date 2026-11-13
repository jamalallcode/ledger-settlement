import express from "express";
import { createServer as createViteServer } from "vite";
import session from "express-session";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { whatsappService } from "./server/whatsappService";

const withTimeout = <T>(promise: Promise<T>, ms: number, label: string): Promise<T> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timeout (${ms}ms)`)), ms);
    promise.then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });

const savePendingToSupabaseServer = async (pendingDoc: any): Promise<boolean> => {
  try {
    const rawUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "").trim()
      .replace(/\/rest\/v1\/?$/, "")
      .replace(/\/+$/, "");
    const anonKey = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "").trim();
    if (!rawUrl || !rawUrl.startsWith("http") || !anonKey) return false;
    const client = createClient(rawUrl, anonKey);
    const { error } = await client.from("settlement_entries").upsert({
      id: pendingDoc.id,
      content: JSON.stringify(pendingDoc),
      created_at: pendingDoc.createdAt
    });
    return !error;
  } catch {
    return false;
  }
};

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
  return ["jamaluddinkh3424@gmail.com", "websitetogather@gmail.com"];
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

const getDocumentsFile = () => {
  return path.join(process.cwd(), "audit_documents.json");
};

let inMemoryDocuments: any[] | null = null;

const getStoredDocuments = (): any[] => {
  if (inMemoryDocuments) {
    return inMemoryDocuments;
  }
  try {
    const file = getDocumentsFile();
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryDocuments = parsed;
        return inMemoryDocuments;
      }
    }
  } catch (e) {
    console.error("Error reading audit_documents.json:", e);
  }
  return [];
};

const saveStoredDocuments = (docs: any[]) => {
  inMemoryDocuments = docs;
  try {
    const file = getDocumentsFile();
    fs.writeFileSync(file, JSON.stringify(docs, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing audit_documents.json:", e);
  }
  return docs;
};

const getPendingDocumentsFile = () => {
  return path.join(process.cwd(), "pending_audit_documents.json");
};

let inMemoryPendingDocuments: any[] | null = null;

const getStoredPendingDocuments = (): any[] => {
  if (inMemoryPendingDocuments) {
    return inMemoryPendingDocuments;
  }
  try {
    const file = getPendingDocumentsFile();
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        inMemoryPendingDocuments = parsed;
        return inMemoryPendingDocuments;
      }
    }
  } catch (e) {
    console.error("Error reading pending_audit_documents.json:", e);
  }
  return [];
};

const saveStoredPendingDocuments = (docs: any[]) => {
  inMemoryPendingDocuments = docs;
  try {
    const file = getPendingDocumentsFile();
    fs.writeFileSync(file, JSON.stringify(docs, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing pending_audit_documents.json:", e);
  }
  return docs;
};

const getArchiveConfigFile = () => {
  return path.join(process.cwd(), "archive_config.json");
};

let inMemoryArchiveConfig: any = null;

const getStoredArchiveConfig = () => {
  if (inMemoryArchiveConfig) return inMemoryArchiveConfig;
  try {
    const file = getArchiveConfigFile();
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, "utf-8");
      inMemoryArchiveConfig = JSON.parse(raw);
      return inMemoryArchiveConfig;
    }
  } catch (e) {}
  return { accessKey: "", secretKey: "", collection: "opensource_media" };
};

const saveStoredArchiveConfig = (cfg: any) => {
  inMemoryArchiveConfig = cfg;
  try {
    const file = getArchiveConfigFile();
    fs.writeFileSync(file, JSON.stringify(cfg, null, 2), "utf-8");
  } catch (e) {}
  return cfg;
};

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);

  // The application runs behind a reverse proxy that routes external traffic exclusively to port 3000.
  // PORT 3000 must be hardcoded according to runtime container environment constraints.
  const isDev = process.env.NODE_ENV !== "production";
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

  // Audit Documents API
  app.get("/api/admin/documents", (req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    const docs = getStoredDocuments();
    res.json({ documents: docs });
  });

  app.post("/api/admin/documents", (req, res) => {
    const { documents, doc, deleteId } = req.body;
    let current = getStoredDocuments();

    if (deleteId) {
      current = saveStoredDocuments(current.filter(d => d.id !== deleteId));
      return res.json({ success: true, documents: current });
    }

    if (doc && doc.id) {
      const idx = current.findIndex(d => d.id === doc.id);
      if (idx >= 0) {
        current[idx] = doc;
      } else {
        current.unshift(doc);
      }
      current = saveStoredDocuments(current);
      return res.json({ success: true, documents: current });
    }

    if (Array.isArray(documents)) {
      current = saveStoredDocuments(documents);
      return res.json({ success: true, documents: current });
    }

    res.json({ success: true, documents: current });
  });

  // ==========================================
  // AI AGENT: CIRCULAR INGESTION & APPROVAL APIS
  // ==========================================

  // 1. Get Archive.org Config
  app.get("/api/agent/archive-config", (req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    const cfg = getStoredArchiveConfig();
    res.json({
      accessKey: cfg.accessKey ? `${cfg.accessKey.substring(0, 4)}***` : "",
      hasAccessKey: Boolean(cfg.accessKey && cfg.secretKey),
      collection: cfg.collection || "opensource_media"
    });
  });

  // 2. Save Archive.org Config
  app.post("/api/agent/archive-config", (req, res) => {
    const { accessKey, secretKey, collection } = req.body;
    let current = getStoredArchiveConfig();
    if (accessKey !== undefined) current.accessKey = String(accessKey).trim();
    if (secretKey !== undefined) current.secretKey = String(secretKey).trim();
    if (collection !== undefined) current.collection = String(collection).trim() || "opensource_media";
    saveStoredArchiveConfig(current);
    res.json({
      success: true,
      hasAccessKey: Boolean(current.accessKey && current.secretKey),
      collection: current.collection
    });
  });

  // 3. Get Pending Documents
  app.get("/api/agent/pending-documents", (req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    const pending = getStoredPendingDocuments();
    res.json({ pendingDocuments: pending });
  });

  // 4. Update or Delete Pending Document
  app.post("/api/agent/pending-documents", (req, res) => {
    const { doc, deleteId } = req.body;
    let pending = getStoredPendingDocuments();
    if (deleteId) {
      pending = saveStoredPendingDocuments(pending.filter(d => d.id !== deleteId));
      return res.json({ success: true, pendingDocuments: pending });
    }
    if (doc && doc.id) {
      const idx = pending.findIndex(d => d.id === doc.id);
      if (idx >= 0) {
        pending[idx] = { ...pending[idx], ...doc };
      } else {
        pending.unshift(doc);
      }
      pending = saveStoredPendingDocuments(pending);
      return res.json({ success: true, pendingDocuments: pending });
    }
    res.json({ success: true, pendingDocuments: pending });
  });

  // 5. Approve Pending Document (Admin Approval Flow)
  app.post("/api/agent/pending-documents/approve", (req, res) => {
    const { id, overrides } = req.body;
    if (!id) {
      return res.status(400).json({ error: "Document ID required" });
    }

    let pending = getStoredPendingDocuments();
    const targetIdx = pending.findIndex(d => d.id === id);
    if (targetIdx === -1) {
      return res.status(404).json({ error: "Pending document not found" });
    }

    const targetDoc = { ...pending[targetIdx], ...(overrides || {}), status: "approved" };

    // Remove from pending
    pending.splice(targetIdx, 1);
    saveStoredPendingDocuments(pending);

    // Save to published documents
    let docs = getStoredDocuments();
    const cleanDoc = {
      id: targetDoc.id.startsWith("pending_") ? `doc_${Date.now()}` : targetDoc.id,
      title: targetDoc.title || "সরকারি সার্কুলার / আদেশ",
      category: targetDoc.category || "সার্কুলার",
      archiveId: targetDoc.archiveId || "",
      docDate: targetDoc.docDate || new Date().toISOString().split("T")[0],
      description: targetDoc.description || "",
      memoNo: targetDoc.memoNo || "",
      authority: targetDoc.authority || "",
      tags: targetDoc.tags || targetDoc.category || "",
      status: "approved",
      uploadedBy: "AI Agent (Admin Approved)",
      createdAt: new Date().toISOString(),
      fileData: targetDoc.fileData || ""
    };

    docs.unshift(cleanDoc);
    saveStoredDocuments(docs);

    return res.json({
      success: true,
      approvedDocument: cleanDoc,
      pendingDocuments: pending,
      documents: docs
    });
  });

  // 6. Reject / Delete Pending Document
  app.post("/api/agent/pending-documents/reject", (req, res) => {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: "Document ID required" });
    }
    let pending = getStoredPendingDocuments();
    pending = saveStoredPendingDocuments(pending.filter(d => d.id !== id));
    res.json({ success: true, pendingDocuments: pending });
  });

  // Helper function: Upload to Archive.org via S3 API
  const uploadToArchiveOrg = async (
    fileBuffer: Buffer,
    fileName: string,
    metadata: { title: string; description: string; authority: string; archiveId?: string; docDate?: string; memoNo?: string; mimeType?: string }
  ): Promise<{ success: boolean; archiveId: string; archiveUrl: string; archiveDownloadUrl?: string; error?: string }> => {
    const cfg = getStoredArchiveConfig();
    const cleanFileName = (fileName || `circular_${Date.now()}.pdf`).trim().replace(/[^a-zA-Z0-9._-]/g, "_");
    const cleanSlug = cleanFileName.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").slice(0, 30) || "circular";
    const timestamp = Date.now();
    const rawRequested = (metadata.archiveId || "").trim().replace(/^https?:\/\/.*archive\.org\/(?:details|embed|download|stream)\//i, "").replace(/[^a-zA-Z0-9_\-\.]/g, "_");
    const uniqueId = rawRequested.length >= 5 ? rawRequested : `bd_audit_${cleanSlug}_${timestamp}`;

    const accessKey = process.env.ARCHIVE_ACCESS_KEY || cfg.accessKey;
    const secretKey = process.env.ARCHIVE_SECRET_KEY || cfg.secretKey;
    const collection = process.env.ARCHIVE_COLLECTION || cfg.collection || "opensource";

    if (!accessKey || !secretKey) {
      return {
        success: false,
        archiveId: uniqueId,
        archiveUrl: `https://archive.org/details/${uniqueId}`,
        error: "Archive.org S3 Access Key ও Secret Key কনফিগার করা নেই।"
      };
    }

    try {
      // Archive.org S3 API specification:
      // Multi-byte or UTF-8 metadata strings in headers must be URI-encoded like uri(...)
      const safeArchiveMeta = (text: string) => {
        if (!text) return '';
        const singleLine = text.replace(/[\r\n]+/g, ' ').trim();
        if (!singleLine) return '';
        return /^[\x20-\x7E]+$/.test(singleLine) ? singleLine : `uri(${encodeURIComponent(singleLine)})`;
      };

      const targetUrl = `https://s3.us.archive.org/${uniqueId}/${encodeURIComponent(cleanFileName)}`;
      const headers: Record<string, string> = {
        authorization: `LOW ${accessKey}:${secretKey}`,
        "content-type": metadata.mimeType || (cleanFileName.endsWith(".pdf") ? "application/pdf" : "image/jpeg"),
        "content-length": String(fileBuffer.length),
        "x-amz-auto-make-bucket": "1",
        "x-archive-auto-make-bucket": "1",
        "x-archive-meta-mediatype": "texts",
        "x-archive-meta-collection": collection,
        "x-archive-meta01-collection": collection,
        "x-archive-meta-title": safeArchiveMeta(metadata.title || "Government Circular"),
        "x-archive-meta-description": safeArchiveMeta(metadata.description || "Uploaded via Audit Ledger System"),
        "x-archive-meta-creator": safeArchiveMeta(metadata.authority || "Directorate of Commercial Audit, Govt of Bangladesh"),
        "x-archive-meta-subject": safeArchiveMeta("Audit Circular; Govt of Bangladesh; Commercial Audit; Public Finance")
      };

      if (metadata.docDate && /^\d{4}-\d{2}-\d{2}$/.test(metadata.docDate)) {
        headers["x-archive-meta-date"] = safeArchiveMeta(metadata.docDate);
      }
      if (metadata.memoNo && metadata.memoNo.trim()) {
        headers["x-archive-meta-notes"] = safeArchiveMeta(`Memo No: ${metadata.memoNo.trim()}`);
      }

      const resp = await fetch(targetUrl, {
        method: "PUT",
        headers,
        body: fileBuffer
      });

      const archiveDownloadUrl = `https://archive.org/download/${uniqueId}/${encodeURIComponent(cleanFileName)}`;
      if (resp.ok) {
        return {
          success: true,
          archiveId: uniqueId,
          archiveUrl: `https://archive.org/details/${uniqueId}`,
          archiveDownloadUrl
        };
      } else {
        const errText = await resp.text();
        console.warn("Archive.org upload HTTP warning:", resp.status, errText);
        return {
          success: false,
          archiveId: uniqueId,
          archiveUrl: `https://archive.org/details/${uniqueId}`,
          error: `Archive.org response ${resp.status}: ${errText}`
        };
      }
    } catch (err: any) {
      console.error("Archive.org upload exception:", err);
      return {
        success: false,
        archiveId: uniqueId,
        archiveUrl: `https://archive.org/details/${uniqueId}`,
        error: err.message
      };
    }
  };

  // 6.4. Gemini AI Connection Status & Ping Check
  app.get("/api/agent/gemini-status", (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    res.json({
      active: !!apiKey,
      model: "gemini-3.1-flash-lite"
    });
  });

  const handleTestGeminiPing = async (_req: any, res: any) => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return res.json({
        success: false,
        active: false,
        message: "GEMINI_API_KEY কনফিগার করা নেই।"
      });
    }
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } }
      });
      const ping: any = await withTimeout(
        ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: "স্বাগতম! শুধুমাত্র 'OK' শব্দটি লিখুন।",
          config: { thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL } }
        }),
        8000,
        "gemini-ping"
      );
      return res.json({
        success: true,
        active: true,
        response: (ping.text || "").trim(),
        message: "জেমিনি এআই সফলভাবে সংযুক্ত এবং সক্রিয় রয়েছে।"
      });
    } catch (err: any) {
      return res.json({
        success: false,
        active: false,
        error: err.message || "জেমিনি এপিআই সংযোগে সমস্যা হয়েছে।"
      });
    }
  };

  app.post("/api/agent/gemini-status", handleTestGeminiPing);
  app.post("/api/agent/test-gemini", handleTestGeminiPing);

  // 6.5. AI Multimodal Document Analysis Endpoint (Gemini 3.8 Flash OCR & Metadata Extraction)
  app.post("/api/agent/analyze-document", async (req, res) => {
    try {
      const { fileBase64, fileName, mimeType, existingDocs } = req.body;
      if (!fileBase64) {
        return res.status(400).json({ error: "ফাইল ডেটা (fileBase64) প্রদান করা আবশ্যক" });
      }

      const cleanFileName = (fileName || `document_${Date.now()}.pdf`).trim();
      const rawBase64 = fileBase64.includes(",") ? fileBase64.split(",")[1] : fileBase64;

      let detectedMime = mimeType;
      if (!detectedMime) {
        if (cleanFileName.toLowerCase().endsWith(".pdf")) detectedMime = "application/pdf";
        else if (cleanFileName.toLowerCase().endsWith(".png")) detectedMime = "image/png";
        else if (cleanFileName.toLowerCase().endsWith(".webp")) detectedMime = "image/webp";
        else detectedMime = "image/jpeg";
      }

      const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        console.warn("GEMINI_API_KEY is not configured in process.env");
        return res.json({
          success: false,
          isAiAnalyzed: false,
          apiKeyMissing: true,
          error: "GEMINI_API_KEY কনফিগার করা নেই। Vercel বা এনভায়রনমেন্ট সেটিংসে GEMINI_API_KEY যুক্ত করুন।",
          data: {
            title: "",
            category: "সার্কুলার",
            authority: "গণপ্রজাতন্ত্রী বাংলাদেশ সরকার",
            memoNo: "",
            docDate: new Date().toISOString().split("T")[0],
            description: ""
          }
        });
      }

      const normalizedExisting = Array.isArray(existingDocs)
        ? existingDocs
            .filter((d: any) => d && (d.title || d.memoNo))
            .slice(0, 75)
            .map((d: any, idx: number) => ({
              idx,
              id: String(d.id || ""),
              title: String(d.title || "").slice(0, 140),
              memoNo: String(d.memoNo || "").slice(0, 70),
              docDate: String(d.docDate || "").slice(0, 20),
              authority: String(d.authority || "").slice(0, 80),
              description: String(d.description || "").slice(0, 140),
              location: d.location === "pending" ? "pending" : "vault"
            }))
        : [];

      const existingListBlock =
        normalizedExisting.length > 0
          ? `\n\nপূর্ববর্তী আপলোডকৃত নথির তালিকা (মিল যাচাইয়ের জন্য):\n${normalizedExisting
              .map(
                (d) =>
                  `[${d.idx}] শিরোনাম: "${d.title}"${d.memoNo ? ` | স্মারক: "${d.memoNo}"` : ""}${d.docDate ? ` | তারিখ: ${d.docDate}` : ""}${d.authority ? ` | কর্তৃপক্ষ: "${d.authority}"` : ""}${d.description ? ` | সারসংক্ষেপ: "${d.description}"` : ""}`
              )
              .join("\n")}`
          : "";

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } }
      });
      const prompt = `আপনি একজন সিনিয়র সরকারি কর্মকর্তা এবং অডিট ও প্রশাসন বিশেষজ্ঞ। এই সার্কুলার/গেজেট/আদেশ/ডকুমেন্টটি (ছবি বা PDF) খুব সতর্কতার সাথে পড়ে ও OCR বিশ্লেষণ করে নিচের ফিল্ডগুলোর তথ্য খাঁটি বাংলায় উদ্ধার করুন:

১. "title": ফাইলের ভেতরে "বিষয়:" (Subject) অংশে যা লেখা আছে হুবহু বা সুন্দর প্রমিত বাংলায় সার্কুলারের মূল বিষয়/শিরোনাম। ফাইলের নাম (যেমন: WhatsApp Image... বা CamScanner... ইত্যাদি) কোনোভাবেই শিরোনাম হবে না। ভেতরে বিষয় না থাকলে ডকুমেন্টের মূল বক্তব্যের ওপর ভিত্তি করে সংক্ষেপে মার্জিত বাংলা শিরোনাম দিন।
২. "category": ডকুমেন্টের ধরণ অনুযায়ী শুধুমাত্র যেকোনো একটি লিখুন: "সার্কুলার", "প্রজ্ঞাপন", "অফিস আদেশ", "গেজেট", "নীতিমালা" অথবা "অন্যান্য"।
৩. "authority": কোন মন্ত্রণালয়, বিভাগ, অধিদপ্তর বা কর্তৃপক্ষ এটি জারি করেছে (যেমন: "অর্থ বিভাগ, অর্থ মন্ত্রণালয়", "বাংলাদেশ ব্যাংক", "জনপ্রশাসন মন্ত্রণালয়" ইত্যাদি)।
৪. "memoNo": নথির স্মারক নম্বর / পত্র নম্বর (যেমন: ০৭.০০.০০০০... ইত্যাদি, যদি থাকে)।
৫. "docDate": জারির তারিখ বা স্বাক্ষরের তারিখ (YYYY-MM-DD ফরম্যাটে, যেমন: 2026-03-25)।
৬. "description": সার্কুলারের মূল সিদ্ধান্তের সংক্ষিপ্ত ১-২ লাইনের সারসংক্ষেপ।${
        normalizedExisting.length > 0
          ? `
৭. "duplicateMatch": সংযুক্ত ডকুমেন্টটির ভেতরের মূল লেখা, বিষয়বস্তু, স্মারক নম্বর ও তারিখ নিচের "পূর্ববর্তী আপলোডকৃত নথির তালিকা"-র সাথে গভীরভাবে তুলনা করুন। ফাইল নাম বা শিরোনাম ভিন্ন হলেও যদি দেখেন এটি মূলত একই সার্কুলার/গেজেট/আদেশ, তবে "isDuplicate": true, তালিকার সঠিক index নম্বর "matchedIndex" ও সংক্ষিপ্ত বাংলা কারণ ("reason") দিন; নাহলে "isDuplicate": false ও "matchedIndex": null দিন।`
          : ""
      }${existingListBlock}

শুধুমাত্র একটি ভ্যালিড JSON অবজেক্ট আউটপুট দিন:
{
  "title": "...",
  "category": "...",
  "authority": "...",
  "memoNo": "...",
  "docDate": "...",
  "description": "..."${
        normalizedExisting.length > 0
          ? `,
  "duplicateMatch": {
    "isDuplicate": false,
    "matchedIndex": null,
    "reason": ""
  }`
          : ""
      }
}`;

      const modelConfigs = [
        { model: "gemini-3.1-flash-lite", thinkingLevel: ThinkingLevel.MINIMAL, timeoutMs: 9500 },
        { model: "gemini-4-hydrogen", thinkingLevel: ThinkingLevel.LOW, timeoutMs: 11500 }
      ];

      let result: any = null;
      let lastError: any = null;

      for (const cfg of modelConfigs) {
        try {
          result = await withTimeout(
            ai.models.generateContent({
              model: cfg.model,
              contents: [
                {
                  role: "user",
                  parts: [
                    { inlineData: { data: rawBase64, mimeType: detectedMime } },
                    { text: prompt }
                  ]
                }
              ],
              config: {
                responseMimeType: "application/json",
                thinkingConfig: { thinkingLevel: cfg.thinkingLevel }
              }
            }),
            cfg.timeoutMs,
            cfg.model
          );
          if (result && result.text) {
            break;
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`Model ${cfg.model} in server failed, trying next candidate:`, err.message || err);
        }
      }

      if (!result || !result.text) {
        throw lastError || new Error("সকল জেমিনি মডেল বর্তমানে ব্যস্ত বা সময়সীমা অতিক্রম করেছে। অনুগ্রহ করে কয়েক সেকেন্ড পর আবার চেষ্টা করুন।");
      }

      const rawText = result.text || "";
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      let parsedData: any = {};
      if (jsonMatch) {
        try {
          parsedData = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.warn("Error parsing Gemini JSON response:", e);
        }
      }

      // Validating and standardizing category
      let category = parsedData.category || "সার্কুলার";
      const validCategories = ["সার্কুলার", "অফিস আদেশ", "গেজেট", "প্রজ্ঞাপন", "নীতিমালা", "অন্যান্য"];
      if (!validCategories.includes(category)) {
        if (category.includes("আদেশ")) category = "অফিস আদেশ";
        else if (category.includes("গেজেট")) category = "গেজেট";
        else category = "সার্কুলার";
      }

      const responseData = {
        title: parsedData.title && parsedData.title.trim() && !parsedData.title.toLowerCase().includes("whatsapp image") && !parsedData.title.toLowerCase().includes("camscanner")
          ? parsedData.title.trim()
          : "সরকারি সার্কুলার / আদেশ",
        category: category,
        authority: parsedData.authority && parsedData.authority.trim() ? parsedData.authority.trim() : "গণপ্রজাতন্ত্রী বাংলাদেশ সরকার",
        memoNo: parsedData.memoNo && parsedData.memoNo.trim() ? parsedData.memoNo.trim() : "",
        docDate: parsedData.docDate && /^\d{4}-\d{2}-\d{2}$/.test(parsedData.docDate) ? parsedData.docDate : new Date().toISOString().split("T")[0],
        description: parsedData.description && parsedData.description.trim() ? parsedData.description.trim() : "সংগৃহীত সরকারি সার্কুলার।"
      };

      let duplicateMatch: any = null;
      const rawDup = parsedData.duplicateMatch;
      if (rawDup && rawDup.isDuplicate && typeof rawDup.matchedIndex === "number") {
        const matched = normalizedExisting[rawDup.matchedIndex];
        if (matched) {
          duplicateMatch = {
            isDuplicate: true,
            matchedId: matched.id,
            matchedTitle: matched.title,
            matchedMemoNo: matched.memoNo,
            matchedDocDate: matched.docDate,
            location: matched.location,
            reason: String(rawDup.reason || "ডকুমেন্টের ভেতরের বিষয়বস্তু পূর্ববর্তী নথির সাথে মিলে গেছে।").trim()
          };
        }
      }

      if (!duplicateMatch && normalizedExisting.length > 0) {
        const extractedMemo = responseData.memoNo.trim().toLowerCase();
        const extractedTitle = responseData.title.trim().toLowerCase();
        for (const item of normalizedExisting) {
          if (extractedMemo && extractedMemo.length >= 3 && item.memoNo && item.memoNo.trim().toLowerCase() === extractedMemo) {
            duplicateMatch = {
              isDuplicate: true,
              matchedId: item.id,
              matchedTitle: item.title,
              matchedMemoNo: item.memoNo,
              matchedDocDate: item.docDate,
              location: item.location,
              reason: `স্মারক নম্বর (${item.memoNo}) পূর্ববর্তী নথির সাথে মিলে গেছে।`
            };
            break;
          }
          if (extractedTitle && extractedTitle.length >= 8 && item.title && item.title.trim().toLowerCase() === extractedTitle) {
            duplicateMatch = {
              isDuplicate: true,
              matchedId: item.id,
              matchedTitle: item.title,
              matchedMemoNo: item.memoNo,
              matchedDocDate: item.docDate,
              location: item.location,
              reason: "ডকুমেন্টের মূল শিরোনাম পূর্ববর্তী নথির সাথে মিলে গেছে।"
            };
            break;
          }
        }
      }

      return res.json({
        success: true,
        isAiAnalyzed: true,
        data: responseData,
        duplicateMatch
      });
    } catch (err: any) {
      console.error("Analyze document error:", err);
      return res.status(500).json({ 
        error: err.message || "ডকুমেন্ট বিশ্লেষণ করতে সমস্যা হয়েছে।",
        success: false 
      });
    }
  });

  // 7. Core AI Agent Processing Endpoint: Accepts file/base64 -> Gemini Vision/Analysis -> Archive.org Upload -> Pending Queue
  app.post("/api/agent/process-document", async (req, res) => {
    try {
      const { 
        fileBase64, 
        fileName, 
        mimeType, 
        archiveId: customArchiveId,
        source = "direct_upload", 
        senderName,
        title: customTitle,
        category: customCategory,
        docDate: customDocDate,
        memoNo: customMemoNo,
        authority: customAuthority,
        description: customDescription,
        autoAnalyze = false,
        savePendingOnServer = false,
        existingDocs,
        ignoreDuplicate = false
      } = req.body;
      if (!fileBase64) {
        return res.status(400).json({ success: false, uploadedToArchive: false, error: "File base64 content is required" });
      }

      const rawBase64 = fileBase64.includes(",") ? fileBase64.split(",")[1] : fileBase64;
      const cleanFileName = (fileName || `circular_${Date.now()}.pdf`).trim().replace(/[^a-zA-Z0-9._-]/g, "_");
      const detectedMime = mimeType || (cleanFileName.endsWith(".pdf") ? "application/pdf" : "image/jpeg");
      const buffer = Buffer.from(rawBase64, "base64");

      const normalizedExisting =
        !ignoreDuplicate && Array.isArray(existingDocs)
          ? existingDocs
              .filter((d: any) => d && (d.title || d.memoNo))
              .slice(0, 75)
              .map((d: any, idx: number) => ({
                idx,
                id: String(d.id || ""),
                title: String(d.title || "").slice(0, 140),
                memoNo: String(d.memoNo || "").slice(0, 70),
                docDate: String(d.docDate || "").slice(0, 20),
                authority: String(d.authority || "").slice(0, 80),
                description: String(d.description || "").slice(0, 140),
                location: d.location === "pending" ? "pending" : "vault"
              }))
          : [];

      // Step 1: Fast AI extraction if requested or title omitted or duplicate check requested
      let extractedData = {
        title: customTitle || cleanFileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "),
        category: customCategory || "সার্কুলার",
        docDate: customDocDate || new Date().toISOString().split("T")[0],
        memoNo: customMemoNo || "",
        authority: customAuthority || "গণপ্রজাতন্ত্রী বাংলাদেশ সরকার",
        description: customDescription || "হোয়াটসঅ্যাপ/মেসেঞ্জার থেকে স্বয়ংক্রিয়ভাবে সংগৃহীত সার্কুলার।"
      };
      let aiAnalyzed = false;
      let aiDuplicateRaw: any = null;
      let aiExtractedTitle = "";

      if (autoAnalyze || !customTitle || (!ignoreDuplicate && normalizedExisting.length > 0)) {
        try {
          const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
          if (apiKey) {
            const ai = new GoogleGenAI({
              apiKey,
              httpOptions: { headers: { "User-Agent": "aistudio-build" } }
            });
            const existingListBlock =
              normalizedExisting.length > 0
                ? `\n\nপূর্ববর্তী আপলোডকৃত নথির তালিকা (মিল যাচাইয়ের জন্য):\n${normalizedExisting
                    .map(
                      (d) =>
                        `[${d.idx}] শিরোনাম: "${d.title}"${d.memoNo ? ` | স্মারক: "${d.memoNo}"` : ""}${d.docDate ? ` | তারিখ: ${d.docDate}` : ""}${d.authority ? ` | কর্তৃপক্ষ: "${d.authority}"` : ""}${d.description ? ` | সারসংক্ষেপ: "${d.description}"` : ""}`
                    )
                    .join("\n")}`
                : "";

            const prompt = `আপনি একজন সিনিয়র সরকারি কর্মকর্তা এবং অডিট স্পেশালিস্ট। এই সার্কুলার/গেজেট/আদেশটি ভালোভাবে পড়ে নিচের ফিল্ডগুলো উদ্ধার করে শুধুমাত্র একটি ভ্যালিড JSON অবজেক্ট আকারে আউটপুট দিন:
{
  "title": "ফাইলের যথার্থ ও সুনির্দিষ্ট শিরোনাম বা বিষয় (বাংলায়)",
  "category": "সার্কুলার" অথবা "গেজেট" অথবা "অফিস আদেশ" অথবা "নীতিমালা" অথবা "অন্যান্য",
  "docDate": "জারির তারিখ YYYY-MM-DD ফরম্যাটে",
  "memoNo": "স্মারক নম্বর (যদি থাকে)",
  "authority": "মন্ত্রণালয়/বিভাগ/অধিদপ্তরের নাম (বাংলায়)",
  "description": "সার্কুলারের মূল নির্দেশনার সংক্ষিপ্ত সারসংক্ষেপ (১-২ বাক্য)"${
              normalizedExisting.length > 0
                ? `,
  "duplicateMatch": { "isDuplicate": false, "matchedIndex": null, "reason": "যদি ফাইল নাম বা শিরোনাম ভিন্ন হলেও ভেতরের বিষয়/স্মারক/তারিখ নিচের তালিকার কোনো নথির সাথে মিলে গিয়ে একই সার্কুলার হয় তবে true, matchedIndex ও সংক্ষিপ্ত বাংলা কারণ দিন" }`
                : ""
            }
}${existingListBlock}`;

            const result: any = await withTimeout(
              ai.models.generateContent({
                model: "gemini-3.1-flash-lite",
                contents: [
                  {
                    role: "user",
                    parts: [
                      { inlineData: { data: rawBase64, mimeType: detectedMime } },
                      { text: prompt }
                    ]
                  }
                ],
                config: {
                  responseMimeType: "application/json",
                  thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL }
                }
              }),
              9000,
              "process-doc-ai"
            );

            const rawText = result.text || "";
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              if (parsed.title) {
                aiExtractedTitle = parsed.title;
                if (!customTitle) extractedData.title = parsed.title;
              }
              if (!customCategory && parsed.category) extractedData.category = parsed.category;
              if (!customDocDate && parsed.docDate && /^\d{4}-\d{2}-\d{2}$/.test(parsed.docDate)) extractedData.docDate = parsed.docDate;
              if (!customMemoNo && parsed.memoNo) extractedData.memoNo = parsed.memoNo;
              if ((!customAuthority || customAuthority === "গণপ্রজাতন্ত্রী বাংলাদেশ সরকার") && parsed.authority) extractedData.authority = parsed.authority;
              if (!customDescription && parsed.description) extractedData.description = parsed.description;
              if (parsed.duplicateMatch) aiDuplicateRaw = parsed.duplicateMatch;
              aiAnalyzed = true;
            }
          }
        } catch (aiErr: any) {
          console.warn("Gemini agent analysis fallback:", aiErr.message);
        }
      }

      // Pre-upload Duplicate Check unless admin explicitly chose ignoreDuplicate
      if (!ignoreDuplicate && normalizedExisting.length > 0) {
        let duplicateInfo: any = null;
        if (aiDuplicateRaw && aiDuplicateRaw.isDuplicate && typeof aiDuplicateRaw.matchedIndex === "number") {
          const matched = normalizedExisting[aiDuplicateRaw.matchedIndex];
          if (matched) {
            duplicateInfo = {
              isDuplicate: true,
              matchedId: matched.id,
              matchedTitle: matched.title,
              matchedMemoNo: matched.memoNo,
              matchedDocDate: matched.docDate,
              location: matched.location,
              reason: String(aiDuplicateRaw.reason || "এআই ডকুমেন্টের ভেতরের লেখা পড়ে পূর্ববর্তী নথির সাথে মিল পেয়েছে।").trim()
            };
          }
        }

        if (!duplicateInfo) {
          const memoCheck = (extractedData.memoNo || "").trim().toLowerCase();
          const titleCheck = (aiExtractedTitle || extractedData.title || "").trim().toLowerCase();
          for (const item of normalizedExisting) {
            if (memoCheck && memoCheck.length >= 3 && item.memoNo && item.memoNo.trim().toLowerCase() === memoCheck) {
              duplicateInfo = {
                isDuplicate: true,
                matchedId: item.id,
                matchedTitle: item.title,
                matchedMemoNo: item.memoNo,
                matchedDocDate: item.docDate,
                location: item.location,
                reason: `স্মারক নম্বর (${item.memoNo}) পূর্ববর্তী নথির সাথে মিলে গেছে।`
              };
              break;
            }
            if (titleCheck && titleCheck.length >= 8 && item.title && item.title.trim().toLowerCase() === titleCheck) {
              duplicateInfo = {
                isDuplicate: true,
                matchedId: item.id,
                matchedTitle: item.title,
                matchedMemoNo: item.memoNo,
                matchedDocDate: item.docDate,
                location: item.location,
                reason: "ডকুমেন্টের মূল শিরোনাম পূর্ববর্তী নথির সাথে মিলে গেছে।"
              };
              break;
            }
          }
        }

        if (duplicateInfo) {
          return res.json({
            success: false,
            duplicateDetected: true,
            uploadedToArchive: false,
            aiAnalyzed,
            duplicateInfo,
            extractedData,
            error: `এই ডকুমেন্টটি পূর্বেই আপলোড করা হয়েছে ("${duplicateInfo.matchedTitle}")।`
          });
        }
      }

      // Step 2: Upload to Archive.org
      const uploadRes = await uploadToArchiveOrg(buffer, cleanFileName, {
        title: extractedData.title,
        description: extractedData.description,
        authority: extractedData.authority,
        archiveId: customArchiveId,
        docDate: extractedData.docDate,
        memoNo: extractedData.memoNo,
        mimeType: detectedMime
      });

      if (!uploadRes.success) {
        return res.status(502).json({
          success: false,
          uploadedToArchive: false,
          archiveId: uploadRes.archiveId,
          error: uploadRes.error || "Archive.org আপলোড ব্যর্থ হয়েছে।"
        });
      }

      // Step 3: Store lightweight metadata in Pending Documents Queue (NO heavy fileData!)
      const pendingDoc = {
        id: `pending_doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: extractedData.title,
        category: extractedData.category,
        archiveId: uploadRes.archiveId,
        archiveUrl: uploadRes.archiveUrl,
        archiveDownloadUrl: uploadRes.archiveDownloadUrl,
        docDate: extractedData.docDate,
        memoNo: extractedData.memoNo,
        authority: extractedData.authority,
        description: extractedData.description,
        tags: extractedData.category,
        originalFileName: cleanFileName,
        source: source,
        senderName: senderName || "WhatsApp / Messenger Group",
        status: "pending",
        createdAt: new Date().toISOString()
      };

      const currentPending = getStoredPendingDocuments();
      currentPending.unshift(pendingDoc);
      saveStoredPendingDocuments(currentPending);

      let savedToSupabaseOnServer = false;
      if (savePendingOnServer) {
        savedToSupabaseOnServer = await savePendingToSupabaseServer(pendingDoc);
      }

      return res.json({
        success: true,
        uploadedToArchive: true,
        aiAnalyzed,
        savedToSupabaseOnServer,
        archiveId: uploadRes.archiveId,
        archiveUrl: uploadRes.archiveUrl,
        archiveDownloadUrl: uploadRes.archiveDownloadUrl,
        originalFileName: cleanFileName,
        message: "সার্কুলারটি সফলভাবে Archive.org-এ আপলোড সম্পন্ন হয়েছে।",
        pendingDocument: pendingDoc,
        pendingCount: currentPending.length
      });
    } catch (err: any) {
      console.error("Agent process-document error:", err);
      return res.status(500).json({ success: false, uploadedToArchive: false, error: err.message || "সার্কুলার প্রসেস করতে ব্যর্থ হয়েছে।" });
    }
  });

  // 8. WhatsApp / Messenger Webhook Ingestion Endpoint
  app.post("/api/agent/whatsapp-webhook", async (req, res) => {
    try {
      // Log incoming webhook
      console.log("[WhatsApp Webhook] Incoming message:", JSON.stringify(req.body).slice(0, 300));
      const { fileBase64, fileName, mimeType, sender, messageText } = req.body;

      if (!fileBase64) {
        return res.json({ status: "received_text_only", message: "No document attached in message." });
      }

      // Reuse the process document pipeline
      const buffer = Buffer.from(fileBase64, "base64");
      const cleanFileName = (fileName || `whatsapp_doc_${Date.now()}.pdf`).trim();
      const detectedMime = mimeType || "application/pdf";

      let extractedData = {
        title: cleanFileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "),
        category: "সার্কুলার",
        docDate: new Date().toISOString().split("T")[0],
        memoNo: "",
        authority: "গণপ্রজাতন্ত্রী বাংলাদেশ সরকার",
        description: messageText || "হোয়াটসঅ্যাপ গ্রুপ থেকে ফরওয়ার্ডকৃত সরকারি সার্কুলার।"
      };

      try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey) {
          const ai = new GoogleGenAI({ apiKey });
          const prompt = `আপনি একজন সিনিয়র সরকারি কর্মকর্তা এবং অডিট স্পেশালিস্ট। এই সার্কুলার/গেজেটটি পড়ে তথ্য উদ্ধার করুন:
{
  "title": "ফাইলের শিরোনাম বা বিষয় (বাংলায়)",
  "category": "সার্কুলার" অথবা "গেজেট" অথবা "আদেশ" অথবা "নীতিমালা" অথবা "অন্যান্য",
  "docDate": "জারির তারিখ YYYY-MM-DD ফরম্যাটে",
  "memoNo": "স্মারক নম্বর (যদি থাকে)",
  "authority": "মন্ত্রণালয়/বিভাগ/অধিদপ্তরের নাম (বাংলায়)",
  "description": "সার্কুলারের মূল নির্দেশনার সংক্ষিপ্ত সারসংক্ষেপ (১-২ বাক্য)"
}`;
          const result = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite",
            contents: [
              {
                role: "user",
                parts: [
                  { inlineData: { data: fileBase64, mimeType: detectedMime } },
                  { text: prompt }
                ]
              }
            ],
            config: {
              thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL }
            }
          });
          const rawText = result.text || "";
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.title) extractedData.title = parsed.title;
            if (parsed.category) extractedData.category = parsed.category;
            if (parsed.docDate && /^\d{4}-\d{2}-\d{2}$/.test(parsed.docDate)) extractedData.docDate = parsed.docDate;
            if (parsed.memoNo) extractedData.memoNo = parsed.memoNo;
            if (parsed.authority) extractedData.authority = parsed.authority;
            if (parsed.description) extractedData.description = parsed.description;
          }
        }
      } catch (e) {}

      const uploadRes = await uploadToArchiveOrg(buffer, cleanFileName, {
        title: extractedData.title,
        description: extractedData.description,
        authority: extractedData.authority
      });

      const pendingDoc = {
        id: `pending_doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: extractedData.title,
        category: extractedData.category,
        archiveId: uploadRes.archiveId,
        archiveUrl: uploadRes.archiveUrl,
        docDate: extractedData.docDate,
        memoNo: extractedData.memoNo,
        authority: extractedData.authority,
        description: extractedData.description,
        tags: extractedData.category,
        originalFileName: cleanFileName,
        source: "whatsapp",
        senderName: sender || "WhatsApp Group",
        status: "pending",
        createdAt: new Date().toISOString()
      };

      const currentPending = getStoredPendingDocuments();
      currentPending.unshift(pendingDoc);
      saveStoredPendingDocuments(currentPending);

      return res.json({
        success: true,
        message: "সার্কুলারটি স্বয়ংক্রিয়ভাবে অডিট ক্রাইটেরিয়ার অপেক্ষমাণ তালিকায় সংরক্ষিত হয়েছে।",
        pendingDocumentId: pendingDoc.id
      });
    } catch (webhookErr: any) {
      console.error("WhatsApp webhook error:", webhookErr);
      return res.status(500).json({ error: webhookErr.message });
    }
  });

  // 9. WhatsApp Web QR Code Status API
  app.get("/api/agent/whatsapp-status", (req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.json(whatsappService.getStatus());
  });

  // 10. WhatsApp Web Start/Connect API (Triggers QR Code Generation)
  app.post("/api/agent/whatsapp-connect", async (req, res) => {
    try {
      whatsappService.connect();
      await new Promise(resolve => setTimeout(resolve, 800));
      res.json(whatsappService.getStatus());
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to initialize WhatsApp connection" });
    }
  });

  // 11. WhatsApp Web Disconnect/Logout API
  app.post("/api/agent/whatsapp-disconnect", async (req, res) => {
    try {
      await whatsappService.disconnect();
      res.json(whatsappService.getStatus());
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to disconnect WhatsApp" });
    }
  });

  // Register real-time document listener on WhatsApp service
  whatsappService.setDocumentHandler(async ({ buffer, fileName, mimeType, sender, caption }) => {
    try {
      console.log(`[WhatsApp Agent Ingest] Auto-processing group document: ${fileName} from ${sender}`);
      let extractedData = {
        title: fileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "),
        category: "সার্কুলার",
        docDate: new Date().toISOString().split("T")[0],
        memoNo: "",
        authority: "গণপ্রজাতন্ত্রী বাংলাদেশ সরকার",
        description: caption || "হোয়াটসঅ্যাপ গ্রুপ থেকে স্বয়ংক্রিয়ভাবে সংগৃহীত সরকারি সার্কুলার।"
      };

      try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey) {
          const ai = new GoogleGenAI({ apiKey });
          const base64 = buffer.toString("base64");
          const prompt = `আপনি একজন সিনিয়র সরকারি কর্মকর্তা এবং অডিট স্পেশালিস্ট। এই সার্কুলার/গেজেটটি পড়ে তথ্য উদ্ধার করুন:
{
  "title": "ফাইলের শিরোনাম বা বিষয় (বাংলায়)",
  "category": "সার্কুলার" অথবা "গেজেট" অথবা "আদেশ" অথবা "নীতিমালা" অথবা "অন্যান্য",
  "docDate": "জারির তারিখ YYYY-MM-DD ফরম্যাটে",
  "memoNo": "স্মারক নম্বর (যদি থাকে)",
  "authority": "মন্ত্রণালয়/বিভাগ/অধিদপ্তরের নাম (বাংলায়)",
  "description": "সার্কুলারের মূল নির্দেশনার সংক্ষিপ্ত সারসংক্ষেপ (১-২ বাক্য)"
}`;
          const result = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite",
            contents: [
              {
                role: "user",
                parts: [
                  { inlineData: { data: base64, mimeType } },
                  { text: prompt }
                ]
              }
            ],
            config: {
              thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL }
            }
          });
          const rawText = result.text || "";
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.title) extractedData.title = parsed.title;
            if (parsed.category) extractedData.category = parsed.category;
            if (parsed.docDate && /^\d{4}-\d{2}-\d{2}$/.test(parsed.docDate)) extractedData.docDate = parsed.docDate;
            if (parsed.memoNo) extractedData.memoNo = parsed.memoNo;
            if (parsed.authority) extractedData.authority = parsed.authority;
            if (parsed.description) extractedData.description = parsed.description;
          }
        }
      } catch (e) {}

      const uploadRes = await uploadToArchiveOrg(buffer, fileName, {
        title: extractedData.title,
        description: extractedData.description,
        authority: extractedData.authority
      });

      const pendingDoc = {
        id: `pending_doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: extractedData.title,
        category: extractedData.category,
        archiveId: uploadRes.archiveId,
        archiveUrl: uploadRes.archiveUrl,
        docDate: extractedData.docDate,
        memoNo: extractedData.memoNo,
        authority: extractedData.authority,
        description: extractedData.description,
        tags: extractedData.category,
        originalFileName: fileName,
        source: "whatsapp_group",
        senderName: sender || "WhatsApp Group",
        status: "pending",
        createdAt: new Date().toISOString()
      };

      const currentPending = getStoredPendingDocuments();
      currentPending.unshift(pendingDoc);
      saveStoredPendingDocuments(currentPending);
      console.log(`[WhatsApp Agent Ingest] Successfully saved to pending queue: "${pendingDoc.title}"`);
    } catch (ingestErr) {
      console.error("[WhatsApp Agent Ingest] Error processing document:", ingestErr);
    }
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
  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send("Application index.html not found.");
      }
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT} (mode: ${isDev ? 'development' : 'production'})`);
  });

  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });
}

startServer();
