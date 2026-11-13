import fs from "fs";
import path from "path";

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

    const uniqueId = sanitizeArchiveId(requestedArchiveId || "", cleanSlug);
    const targetUrl = `https://s3.us.archive.org/${uniqueId}/${encodeURIComponent(cleanFileName)}`;

    const resolvedTitle = (title || cleanFileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ")).trim();
    const resolvedCategory = (category || "সার্কুলার").trim();
    const resolvedAuthority = (authority || "গণপ্রজাতন্ত্রী বাংলাদেশ সরকার").trim();
    const resolvedDescription = (description || "অডিট ক্রাইটেরিয়া ভল্টে সংরক্ষিত সরকারি সার্কুলার।").trim();
    const resolvedDate = docDate && /^\d{4}-\d{2}-\d{2}$/.test(docDate)
      ? docDate
      : new Date().toISOString().split("T")[0];

    const headers: Record<string, string> = {
      authorization: `LOW ${cfg.accessKey}:${cfg.secretKey}`,
      "content-type": mimeType || (cleanFileName.endsWith(".pdf") ? "application/pdf" : "image/jpeg"),
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

    if (memoNo && String(memoNo).trim()) {
      headers["x-archive-meta-notes"] = safeArchiveMeta(`Memo No: ${String(memoNo).trim()}`);
    }

    const s3Resp = await fetch(targetUrl, {
      method: "PUT",
      headers,
      body: buffer,
    });

    if (!s3Resp.ok) {
      const errText = await s3Resp.text().catch(() => "");
      console.error("Archive.org S3 PUT failed:", s3Resp.status, errText);
      return res.status(s3Resp.status === 403 ? 403 : 502).json({
        success: false,
        uploadedToArchive: false,
        archiveId: uniqueId,
        error: `Archive.org আপলোড ব্যর্থ হয়েছে (HTTP ${s3Resp.status}): ${errText.slice(0, 200) || "সার্ভার প্রত্যাখ্যান করেছে"}`,
      });
    }

    const archiveUrl = `https://archive.org/details/${uniqueId}`;
    const archiveDownloadUrl = `https://archive.org/download/${uniqueId}/${encodeURIComponent(cleanFileName)}`;

    const pendingDocument = {
      id: `pending_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: resolvedTitle,
      category: resolvedCategory,
      archiveId: uniqueId,
      archiveUrl,
      archiveDownloadUrl,
      originalFileName: cleanFileName,
      docDate: resolvedDate,
      memoNo: (memoNo || "").trim(),
      authority: resolvedAuthority,
      description: resolvedDescription,
      tags: resolvedCategory,
      source,
      senderName: senderName || "Admin Upload",
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    return res.status(200).json({
      success: true,
      uploadedToArchive: true,
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
