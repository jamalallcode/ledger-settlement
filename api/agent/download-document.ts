import fs from "fs";
import path from "path";

interface ArchiveConfig {
  accessKey: string;
  secretKey: string;
}

const getArchiveKeys = (): ArchiveConfig => {
  const envAccess = process.env.ARCHIVE_ACCESS_KEY || "";
  const envSecret = process.env.ARCHIVE_SECRET_KEY || "";
  if (envAccess && envSecret) {
    return { accessKey: envAccess.trim(), secretKey: envSecret.trim() };
  }
  try {
    const configPath = path.join(process.cwd(), "archive_config.json");
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, "utf-8");
      const parsed = JSON.parse(raw);
      return {
        accessKey: String(parsed.accessKey || "").trim(),
        secretKey: String(parsed.secretKey || "").trim()
      };
    }
  } catch (e) {}
  return { accessKey: "", secretKey: "" };
};

const extractCleanArchiveId = (raw: string): string => {
  if (!raw) return "";
  const trimmed = raw.trim();
  const match = trimmed.match(/archive\.org\/(?:details|embed|download|stream)\/([^/?#]+)/i);
  const candidate = match && match[1] ? match[1].trim() : trimmed;
  return candidate.replace(/[^a-zA-Z0-9._-]/g, "_");
};

const inferExtensionFromMime = (mime: string): string => {
  const lower = (mime || "").toLowerCase();
  if (lower.includes("pdf")) return ".pdf";
  if (lower.includes("jpeg") || lower.includes("jpg")) return ".jpg";
  if (lower.includes("png")) return ".png";
  if (lower.includes("webp")) return ".webp";
  if (lower.includes("gif")) return ".gif";
  if (lower.includes("msword") || lower.includes("wordprocessingml")) return ".docx";
  if (lower.includes("excel") || lower.includes("spreadsheetml")) return ".xlsx";
  return "";
};

const pickBestArchiveFile = (files: any[]): string => {
  if (!Array.isArray(files) || files.length === 0) return "";
  const skipPattern = /(?:_meta\.xml|_files\.xml|_meta\.sqlite|_archive\.torrent|__ia_thumb\.jpg|\.(?:xml|sqlite|torrent|json))$/i;
  const preferredExtPattern = /\.(?:pdf|jpg|jpeg|png|webp|gif|doc|docx|xls|xlsx)$/i;

  const candidates = files.filter((f) => {
    const name = String(f?.name || "");
    if (!name || skipPattern.test(name)) return false;
    return true;
  });

  if (candidates.length === 0) return "";

  const originalPreferred = candidates.find(
    (f) => f?.source === "original" && preferredExtPattern.test(String(f?.name || ""))
  );
  if (originalPreferred) return String(originalPreferred.name);

  const anyPreferred = candidates.find((f) => preferredExtPattern.test(String(f?.name || "")));
  if (anyPreferred) return String(anyPreferred.name);

  const anyOriginal = candidates.find((f) => f?.source === "original");
  return String((anyOriginal || candidates[0]).name || "");
};

const fetchWithTimeout = async (url: string, init: RequestInit = {}, timeoutMs = 15000): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      redirect: "follow",
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
};

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const rawArchiveId = String(req.query?.archiveId || "").trim();
    const rawFileName = String(req.query?.fileName || "").trim();
    const rawDownloadUrl = String(req.query?.downloadUrl || "").trim();
    const rawTitle = String(req.query?.title || "").trim();

    const cleanId = extractCleanArchiveId(rawArchiveId || rawDownloadUrl);
    if (!cleanId && !rawDownloadUrl) {
      return res.status(400).json({ success: false, error: "ডাউনলোডের জন্য Archive.org আইডি পাওয়া যায়নি।" });
    }

    const keys = getArchiveKeys();
    const attemptedUrls = new Set<string>();
    const candidateRequests: Array<{ url: string; headers?: Record<string, string>; fileHint?: string }> = [];

    if (rawDownloadUrl && /^https:\/\/(?:[a-z0-9-]+\.)*archive\.org\//i.test(rawDownloadUrl)) {
      candidateRequests.push({ url: rawDownloadUrl, fileHint: rawFileName || rawDownloadUrl.split("/").pop() });
    }

    if (cleanId && rawFileName) {
      const encodedName = encodeURIComponent(rawFileName);
      candidateRequests.push({
        url: `https://archive.org/download/${encodeURIComponent(cleanId)}/${encodedName}`,
        fileHint: rawFileName
      });
      if (keys.accessKey && keys.secretKey) {
        candidateRequests.push({
          url: `https://s3.us.archive.org/${encodeURIComponent(cleanId)}/${encodedName}`,
          headers: { Authorization: `LOW ${keys.accessKey}:${keys.secretKey}` },
          fileHint: rawFileName
        });
      }
    }

    // Try metadata lookup if no direct filename worked or none was supplied
    let resolvedMetadataFile = "";
    const tryResolveFromMetadata = async () => {
      if (!cleanId || resolvedMetadataFile) return "";
      try {
        const metaResp = await fetchWithTimeout(
          `https://archive.org/metadata/${encodeURIComponent(cleanId)}/files`,
          { headers: { "User-Agent": "AuditCriteriaVault/1.0" } },
          8000
        );
        if (metaResp.ok) {
          const metaJson: any = await metaResp.json().catch(() => null);
          const picked = pickBestArchiveFile(metaJson?.result || []);
          if (picked) {
            resolvedMetadataFile = picked;
            return picked;
          }
        }
      } catch (e) {}
      return "";
    };

    if (!rawFileName && cleanId) {
      const picked = await tryResolveFromMetadata();
      if (picked) {
        candidateRequests.push({
          url: `https://archive.org/download/${encodeURIComponent(cleanId)}/${encodeURIComponent(picked)}`,
          fileHint: picked
        });
      }
    }

    let finalResp: Response | null = null;
    let finalFileHint = rawFileName || resolvedMetadataFile || "circular";

    for (const candidate of candidateRequests) {
      if (attemptedUrls.has(candidate.url)) continue;
      attemptedUrls.add(candidate.url);
      try {
        const resp = await fetchWithTimeout(
          candidate.url,
          {
            headers: {
              "User-Agent": "AuditCriteriaVault/1.0",
              ...(candidate.headers || {})
            }
          },
          18000
        );
        const contentType = (resp.headers.get("content-type") || "").toLowerCase();
        if (resp.ok && !contentType.includes("text/html")) {
          finalResp = resp;
          if (candidate.fileHint) finalFileHint = candidate.fileHint;
          break;
        }
      } catch (e) {}
    }

    // Last-chance metadata lookup if explicit filename failed (e.g. Archive.org renamed or normalized filename)
    if (!finalResp && cleanId && rawFileName) {
      const picked = await tryResolveFromMetadata();
      if (picked) {
        const fallbackUrl = `https://archive.org/download/${encodeURIComponent(cleanId)}/${encodeURIComponent(picked)}`;
        if (!attemptedUrls.has(fallbackUrl)) {
          try {
            const resp = await fetchWithTimeout(
              fallbackUrl,
              { headers: { "User-Agent": "AuditCriteriaVault/1.0" } },
              18000
            );
            const contentType = (resp.headers.get("content-type") || "").toLowerCase();
            if (resp.ok && !contentType.includes("text/html")) {
              finalResp = resp;
              finalFileHint = picked;
            }
          } catch (e) {}
        }
      }
    }

    if (!finalResp) {
      return res.status(404).json({
        success: false,
        error: "Archive.org থেকে ফাইলটি এখনো ডাউনলোডের জন্য প্রস্তুত হয়নি অথবা আইটেমে কোনো মূল ফাইল নেই। অনুগ্রহ করে ১-২ মিনিট পর পুনরায় চেষ্টা করুন।"
      });
    }

    const arrayBuffer = await finalResp.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = finalResp.headers.get("content-type") || "application/octet-stream";

    let ext = path.extname(finalFileHint.split("?")[0] || "");
    if (!ext || ext.length > 6) {
      ext = inferExtensionFromMime(contentType) || ".pdf";
    }

    const cleanedTitle = rawTitle
      .replace(/[\\/:*?"<>|\r\n]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 90);
    const baseName = cleanedTitle || path.basename(finalFileHint.split("?")[0] || "document", ext) || "document";
    const utf8DownloadName = baseName.toLowerCase().endsWith(ext.toLowerCase()) ? baseName : `${baseName}${ext}`;
    const asciiSafeSlug =
      utf8DownloadName
        .replace(/[^\x20-\x7E]/g, "")
        .replace(/[^a-zA-Z0-9._-]+/g, "_")
        .replace(/^_+|_+$/g, "") || `document${ext}`;
    const asciiFallbackName = asciiSafeSlug.toLowerCase().endsWith(ext.toLowerCase()) ? asciiSafeSlug : `document${ext}`;

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Length", String(buffer.length));
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${asciiFallbackName}"; filename*=UTF-8''${encodeURIComponent(utf8DownloadName)}`
    );
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(buffer);
  } catch (err: any) {
    const isAbort = err?.name === "AbortError";
    return res.status(isAbort ? 504 : 502).json({
      success: false,
      error: isAbort
        ? "Archive.org থেকে ডাউনলোডের সময়সীমা অতিক্রম করেছে (HTTP 504)। অনুগ্রহ করে পুনরায় চেষ্টা করুন।"
        : `ডাউনলোড প্রক্সি ত্রুটি: ${err?.message || "Archive.org সংযোগ ব্যর্থ"}`
    });
  }
}
