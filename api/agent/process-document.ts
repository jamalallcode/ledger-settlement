import fs from "fs";
import path from "path";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

interface ArchiveConfig {
  accessKey: string;
  secretKey: string;
  collection: string;
}

const getArchiveConfig = (): ArchiveConfig => {
  const envAccess = process.env.ARCHIVE_ACCESS_KEY || "";
  const envSecret = process.env.ARCHIVE_SECRET_KEY || "";
  const envCollection = process.env.ARCHIVE_COLLECTION || "";

  if (envAccess && envSecret) {
    return {
      accessKey: envAccess.trim(),
      secretKey: envSecret.trim(),
      collection: (envCollection || "opensource").trim(),
    };
  }

  try {
    const configPath = path.join(process.cwd(), "archive_config.json");
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, "utf-8");
      const parsed = JSON.parse(raw);
      return {
        accessKey: String(parsed.accessKey || "").trim(),
        secretKey: String(parsed.secretKey || "").trim(),
        collection: String(parsed.collection || "opensource").trim(),
      };
    }
  } catch (e) {
    console.warn("Could not read archive_config.json:", e);
  }

  return { accessKey: "", secretKey: "", collection: "opensource" };
};

const safeArchiveMeta = (text: string): string => {
  if (!text) return "";
  const singleLine = text.replace(/[\r\n]+/g, " ").trim();
  if (!singleLine) return "";
  return /^[\x20-\x7E]+$/.test(singleLine)
    ? singleLine
    : `uri(${encodeURIComponent(singleLine)})`;
};

const sanitizeArchiveId = (raw: string, fallbackSlug: string): string => {
  if (raw && raw.trim()) {
    const cleaned = raw
      .trim()
      .replace(/^https?:\/\/.*archive\.org\/(?:details|embed|download|stream)\//i, "")
      .replace(/[^a-zA-Z0-9_\-\.]/g, "_");
    if (cleaned.length >= 5) return cleaned;
  }
  return `bd_audit_${fallbackSlug}_${Date.now()}`;
};

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

interface ExistingDocSummary {
  idx: number;
  id: string;
  title: string;
  memoNo: string;
  docDate: string;
  authority: string;
  description: string;
  location: "vault" | "pending";
}

const tryExtractWithAI = async (
  rawBase64: string,
  mimeType: string,
  normalizedExisting: ExistingDocSummary[] = []
) => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;

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

  const prompt = `আপনি একজন সিনিয়র সরকারি কর্মকর্তা এবং অডিট ও জনপ্রশাসন বিশেষজ্ঞ। সংযুক্ত সার্কুলার/গেজেট/আদেশ/ডকুমেন্টটি (ছবি বা PDF) পড়ে নিচের ফিল্ডগুলোর তথ্য খাঁটি বাংলায় উদ্ধার করুন:
1. "title": ফাইলের ভেতরের মূল বিষয়/শিরোনাম।
2. "category": যেকোনো একটি লিখুন: "সার্কুলার", "প্রজ্ঞাপন", "অফিস আদেশ", "গেজেট", "নীতিমালা" অথবা "অন্যান্য"।
3. "authority": জারি করা মন্ত্রণালয়/বিভাগ/দপ্তরের নাম।
4. "memoNo": স্মারক নম্বর (যদি থাকে)।
5. "docDate": জারির তারিখ (YYYY-MM-DD ফরম্যাটে)।
6. "description": সংক্ষিপ্ত ১-২ লাইনের সারসংক্ষেপ।${
    normalizedExisting.length > 0
      ? `
7. "duplicateMatch": সংযুক্ত ডকুমেন্টটির ভেতরের মূল লেখা, বিষয়বস্তু, স্মারক নম্বর ও তারিখ নিচের "পূর্ববর্তী আপলোডকৃত নথির তালিকা"-র সাথে তুলনা করুন। ফাইল নাম বা শিরোনাম ভিন্ন হলেও যদি দেখেন এটি মূলত একই সার্কুলার/গেজেট/আদেশ, তবে "isDuplicate": true, তালিকার সঠিক index নম্বর "matchedIndex" ও সংক্ষিপ্ত বাংলা কারণ ("reason") দিন; নাহলে "isDuplicate": false ও "matchedIndex": null দিন।`
      : ""
  }${existingListBlock}

শুধুমাত্র একটি ভ্যালিড JSON অবজেক্ট দিন:
{"title":"...","category":"...","authority":"...","memoNo":"...","docDate":"...","description":"..."${
    normalizedExisting.length > 0
      ? `,"duplicateMatch":{"isDuplicate":false,"matchedIndex":null,"reason":""}`
      : ""
  }}`;

  const models = [
    { model: "gemini-3.1-flash-lite", thinkingLevel: ThinkingLevel.MINIMAL, timeoutMs: 7500 },
    { model: "gemini-4-hydrogen", thinkingLevel: ThinkingLevel.LOW, timeoutMs: 7500 }
  ];

  for (const cfg of models) {
    try {
      const res: any = await withTimeout(
        ai.models.generateContent({
          model: cfg.model,
          contents: [
            {
              role: "user",
              parts: [
                { inlineData: { data: rawBase64, mimeType } },
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
      const rawText = res?.text || "";
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e: any) {
      console.warn(`Server AI auto-extract fallback (${cfg.model}):`, e?.message || e);
    }
  }
  return null;
};

const savePendingToSupabaseFromServer = async (pendingDocument: any): Promise<boolean> => {
  try {
    const rawUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "").trim()
      .replace(/\/rest\/v1\/?$/, "")
      .replace(/\/+$/, "");
    const anonKey = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "").trim();
    if (!rawUrl || !rawUrl.startsWith("http") || !anonKey) {
      return false;
    }
    const client = createClient(rawUrl, anonKey);
    const { error } = await client.from("settlement_entries").upsert({
      id: pendingDocument.id,
      content: JSON.stringify(pendingDocument),
      created_at: pendingDocument.createdAt,
    });
    if (error) {
      console.warn("Server Supabase upsert error:", error.message);
      return false;
    }
    return true;
  } catch (e: any) {
    console.warn("Server Supabase save skipped:", e?.message || e);
    return false;
  }
};

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed. Use POST." });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const {
      fileBase64,
      fileName,
      mimeType,
      archiveId: requestedArchiveId,
      source = "direct_upload",
      senderName,
      title,
      category,
      docDate,
      memoNo,
      authority,
      description,
      autoAnalyze = false,
      savePendingOnServer = false,
      existingDocs,
      ignoreDuplicate = false,
    } = body;

    if (!fileBase64) {
      return res.status(400).json({
        success: false,
        uploadedToArchive: false,
        error: "ফাইল ডেটা (fileBase64) প্রদান করা আবশ্যক।",
      });
    }

    const cfg = getArchiveConfig();
    if (!cfg.accessKey || !cfg.secretKey) {
      return res.status(500).json({
        success: false,
        uploadedToArchive: false,
        error: "Archive.org S3 Access Key ও Secret Key কনফিগার করা নেই।",
      });
    }

    const rawBase64 = fileBase64.includes(",") ? fileBase64.split(",")[1] : fileBase64;
    const buffer = Buffer.from(rawBase64, "base64");

    const cleanFileName = (fileName || `circular_${Date.now()}.pdf`)
      .trim()
      .replace(/[^a-zA-Z0-9._-]/g, "_");
    const cleanSlug =
      cleanFileName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_")
        .replace(/_+/g, "_")
        .slice(0, 30) || "circular";

    const detectedMime = mimeType || (cleanFileName.endsWith(".pdf") ? "application/pdf" : "image/jpeg");
    const uniqueId = sanitizeArchiveId(requestedArchiveId || "", cleanSlug);
    const targetUrl = `https://s3.us.archive.org/${uniqueId}/${encodeURIComponent(cleanFileName)}`;

    const normalizedExisting: ExistingDocSummary[] =
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
              location: d.location === "pending" ? "pending" : "vault",
            }))
        : [];

    const shouldRunAi = Boolean(
      autoAnalyze || !title || !String(title).trim() || (!ignoreDuplicate && normalizedExisting.length > 0)
    );

    const aiParsed = shouldRunAi
      ? await tryExtractWithAI(rawBase64, detectedMime, normalizedExisting)
      : null;

    let resolvedCategory = (category || aiParsed?.category || "সার্কুলার").trim();
    const validCategories = ["সার্কুলার", "অফিস আদেশ", "গেজেট", "প্রজ্ঞাপন", "নীতিমালা", "অন্যান্য"];
    if (!validCategories.includes(resolvedCategory)) {
      if (resolvedCategory.includes("আদেশ")) resolvedCategory = "অফিস আদেশ";
      else if (resolvedCategory.includes("গেজেট")) resolvedCategory = "গেজেট";
      else if (resolvedCategory.includes("প্রজ্ঞাপন")) resolvedCategory = "প্রজ্ঞাপন";
      else resolvedCategory = "সার্কুলার";
    }

    const fallbackTitle = cleanFileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
    const resolvedTitle = (
      (title && String(title).trim()) ||
      (aiParsed?.title && String(aiParsed.title).trim()) ||
      fallbackTitle
    ).trim();
    const resolvedAuthority = (
      (authority && String(authority).trim()) ||
      (aiParsed?.authority && String(aiParsed.authority).trim()) ||
      "গণপ্রজাতন্ত্রী বাংলাদেশ সরকার"
    ).trim();
    const resolvedMemoNo = ((memoNo && String(memoNo).trim()) || (aiParsed?.memoNo && String(aiParsed.memoNo).trim()) || "").trim();
    const resolvedDescription = (
      (description && String(description).trim()) ||
      (aiParsed?.description && String(aiParsed.description).trim()) ||
      "অডিট ক্রাইটেরিয়া ভল্টে সংরক্ষিত সরকারি সার্কুলার।"
    ).trim();
    const candidateDate = (docDate && /^\d{4}-\d{2}-\d{2}$/.test(docDate))
      ? docDate
      : (aiParsed?.docDate && /^\d{4}-\d{2}-\d{2}$/.test(aiParsed.docDate) ? aiParsed.docDate : "");
    const resolvedDate = candidateDate || new Date().toISOString().split("T")[0];

    // Pre-upload Duplicate Check (AI Content Match + Memo/Title Match) unless admin explicitly chose ignoreDuplicate
    if (!ignoreDuplicate && normalizedExisting.length > 0) {
      let duplicateInfo: any = null;
      const rawDup = aiParsed?.duplicateMatch;
      if (rawDup && rawDup.isDuplicate && typeof rawDup.matchedIndex === "number") {
        const matched = normalizedExisting[rawDup.matchedIndex];
        if (matched) {
          duplicateInfo = {
            isDuplicate: true,
            matchedId: matched.id,
            matchedTitle: matched.title,
            matchedMemoNo: matched.memoNo,
            matchedDocDate: matched.docDate,
            location: matched.location,
            reason: String(rawDup.reason || "এআই ডকুমেন্টের ভেতরের লেখা পড়ে পূর্ববর্তী নথির সাথে মিল পেয়েছে।").trim(),
          };
        }
      }

      if (!duplicateInfo) {
        const memoCheck = (resolvedMemoNo || aiParsed?.memoNo || "").trim().toLowerCase();
        const titleCheck = (aiParsed?.title || resolvedTitle || "").trim().toLowerCase();
        for (const item of normalizedExisting) {
          if (memoCheck && memoCheck.length >= 3 && item.memoNo && item.memoNo.trim().toLowerCase() === memoCheck) {
            duplicateInfo = {
              isDuplicate: true,
              matchedId: item.id,
              matchedTitle: item.title,
              matchedMemoNo: item.memoNo,
              matchedDocDate: item.docDate,
              location: item.location,
              reason: `স্মারক নম্বর (${item.memoNo}) পূর্ববর্তী নথির সাথে মিলে গেছে।`,
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
              reason: "ডকুমেন্টের মূল শিরোনাম পূর্ববর্তী নথির সাথে মিলে গেছে।",
            };
            break;
          }
        }
      }

      if (duplicateInfo) {
        return res.status(200).json({
          success: false,
          duplicateDetected: true,
          uploadedToArchive: false,
          aiAnalyzed: Boolean(aiParsed),
          duplicateInfo,
          extractedData: {
            title: resolvedTitle,
            category: resolvedCategory,
            authority: resolvedAuthority,
            memoNo: resolvedMemoNo,
            docDate: resolvedDate,
            description: resolvedDescription,
          },
          error: `এই ডকুমেন্টটি পূর্বেই আপলোড করা হয়েছে ("${duplicateInfo.matchedTitle}")।`,
        });
      }
    }

    const headers: Record<string, string> = {
      authorization: `LOW ${cfg.accessKey}:${cfg.secretKey}`,
      "content-type": detectedMime,
      "content-length": String(buffer.length),
      "x-amz-auto-make-bucket": "1",
      "x-archive-auto-make-bucket": "1",
      "x-archive-meta-mediatype": "texts",
      "x-archive-meta-collection": cfg.collection || "opensource",
      "x-archive-meta01-collection": cfg.collection || "opensource",
      "x-archive-meta-title": safeArchiveMeta(resolvedTitle),
      "x-archive-meta-description": safeArchiveMeta(resolvedDescription),
      "x-archive-meta-creator": safeArchiveMeta(resolvedAuthority),
      "x-archive-meta-date": safeArchiveMeta(resolvedDate),
      "x-archive-meta-subject": safeArchiveMeta("Audit Circular; Govt of Bangladesh; Commercial Audit; Public Finance"),
    };

    if (resolvedMemoNo) {
      headers["x-archive-meta-notes"] = safeArchiveMeta(`Memo No: ${resolvedMemoNo}`);
    }

    const s3Controller = new AbortController();
    const s3Timer = setTimeout(() => s3Controller.abort(), 13000);
    let s3Resp: Response;
    try {
      s3Resp = await fetch(targetUrl, {
        method: "PUT",
        headers,
        body: buffer,
        signal: s3Controller.signal,
      });
    } catch (s3Err: any) {
      clearTimeout(s3Timer);
      if (s3Err?.name === "AbortError") {
        return res.status(504).json({
          success: false,
          uploadedToArchive: false,
          archiveId: uniqueId,
          error: "Archive.org সার্ভার থেকে ১৩ সেকেন্ডে সাড়া পাওয়া যায়নি (HTTP 504 Timeout)।",
        });
      }
      throw s3Err;
    } finally {
      clearTimeout(s3Timer);
    }

    if (!s3Resp.ok) {
      const errText = await s3Resp.text().catch(() => "");
      console.error("Archive.org S3 PUT failed:", s3Resp.status, errText);
      const statusOut =
        s3Resp.status === 403 ? 403 : s3Resp.status === 429 || s3Resp.status === 503 ? 503 : s3Resp.status === 400 ? 400 : 502;
      return res.status(statusOut).json({
        success: false,
        uploadedToArchive: false,
        archiveId: uniqueId,
        error: `Archive.org আপলোড ব্যর্থ হয়েছে (HTTP ${s3Resp.status}): ${errText.slice(0, 220) || "সার্ভার প্রত্যাখ্যান করেছে"}`,
      });
    }

    const archiveUrl = `https://archive.org/details/${uniqueId}`;
    const archiveDownloadUrl = `https://archive.org/download/${uniqueId}/${encodeURIComponent(cleanFileName)}`;

    const pendingDocument = {
      id: `pending_doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: resolvedTitle,
      category: resolvedCategory,
      archiveId: uniqueId,
      archiveUrl,
      archiveDownloadUrl,
      originalFileName: cleanFileName,
      docDate: resolvedDate,
      memoNo: resolvedMemoNo,
      authority: resolvedAuthority,
      description: resolvedDescription,
      tags: resolvedCategory,
      source,
      senderName: senderName || "Admin Upload",
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    let savedToSupabaseOnServer = false;
    if (savePendingOnServer) {
      savedToSupabaseOnServer = await savePendingToSupabaseFromServer(pendingDocument);
    }

    return res.status(200).json({
      success: true,
      uploadedToArchive: true,
      aiAnalyzed: Boolean(aiParsed),
      savedToSupabaseOnServer,
      archiveId: uniqueId,
      archiveUrl,
      archiveDownloadUrl,
      originalFileName: cleanFileName,
      message: "ফাইলটি সফলভাবে Archive.org-এ আপলোড সম্পন্ন হয়েছে।",
      pendingDocument,
    });
  } catch (err: any) {
    console.error("Vercel Archive.org process-document error:", err);
    return res.status(500).json({
      success: false,
      uploadedToArchive: false,
      error: err.message || "Archive.org-এ ফাইল পাঠাতে সমস্যা হয়েছে।",
    });
  }
}
