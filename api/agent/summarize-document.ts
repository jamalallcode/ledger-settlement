import fs from "fs";
import path from "path";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

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

const pickBestArchiveFile = (files: any[]): string => {
  if (!Array.isArray(files) || files.length === 0) return "";
  const skipPattern = /(?:_meta\.xml|_files\.xml|_meta\.sqlite|_archive\.torrent|__ia_thumb\.jpg|\.(?:xml|sqlite|torrent|json))$/i;
  const preferredExtPattern = /\.(?:pdf|jpg|jpeg|png|webp|gif)$/i;

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

const detectMimeFromHint = (mime: string, fileHint: string): string => {
  const lowerMime = (mime || "").split(";")[0].trim().toLowerCase();
  if (
    lowerMime === "application/pdf" ||
    lowerMime === "image/jpeg" ||
    lowerMime === "image/png" ||
    lowerMime === "image/webp" ||
    lowerMime === "image/gif"
  ) {
    return lowerMime;
  }
  if (lowerMime === "image/jpg") return "image/jpeg";

  const lowerFile = (fileHint || "").toLowerCase();
  if (lowerFile.endsWith(".pdf")) return "application/pdf";
  if (lowerFile.endsWith(".png")) return "image/png";
  if (lowerFile.endsWith(".webp")) return "image/webp";
  if (lowerFile.endsWith(".gif")) return "image/gif";
  if (lowerFile.endsWith(".jpg") || lowerFile.endsWith(".jpeg")) return "image/jpeg";
  return lowerMime || "";
};

const fetchWithTimeout = async (url: string, init: RequestInit = {}, timeoutMs = 12000): Promise<Response> => {
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

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
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
      mimeType: providedMime,
      archiveId,
      fileName,
      downloadUrl,
      title,
      memoNo,
      authority
    } = body;

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return res.status(200).json({
        success: false,
        apiKeyMissing: true,
        error: "GEMINI_API_KEY কনফিগার করা নেই। সার্ভার এনভায়রনমেন্ট সেটিংসে GEMINI_API_KEY যুক্ত করুন।"
      });
    }

    let rawBase64 = "";
    let detectedMime = "";

    if (fileBase64 && typeof fileBase64 === "string") {
      if (fileBase64.startsWith("data:") && fileBase64.includes(";base64,")) {
        const mimeMatch = fileBase64.match(/^data:([^;]+);/i);
        rawBase64 = fileBase64.split(",")[1] || "";
        detectedMime = detectMimeFromHint(providedMime || (mimeMatch ? mimeMatch[1] : ""), fileName || "");
      } else {
        rawBase64 = fileBase64.includes(",") ? fileBase64.split(",")[1] : fileBase64;
        detectedMime = detectMimeFromHint(providedMime || "", fileName || "");
      }
    } else {
      const cleanId = extractCleanArchiveId(String(archiveId || downloadUrl || ""));
      const rawFileName = String(fileName || "").trim();
      const rawDownloadUrl = String(downloadUrl || "").trim();

      if (!cleanId && !rawDownloadUrl) {
        return res.status(400).json({
          success: false,
          error: "ডকুমেন্ট বিশ্লেষণের জন্য Archive.org আইডি বা ফাইল পাওয়া যায়নি।"
        });
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

      let resolvedMetadataFile = "";
      const tryResolveFromMetadata = async () => {
        if (!cleanId || resolvedMetadataFile) return "";
        try {
          const metaResp = await fetchWithTimeout(
            `https://archive.org/metadata/${encodeURIComponent(cleanId)}/files`,
            { headers: { "User-Agent": "AuditCriteriaVault/1.0" } },
            6000
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
            10000
          );
          const contentType = (resp.headers.get("content-type") || "").toLowerCase();
          if (resp.ok && !contentType.includes("text/html")) {
            finalResp = resp;
            if (candidate.fileHint) finalFileHint = candidate.fileHint;
            break;
          }
        } catch (e) {}
      }

      if (!finalResp && cleanId && rawFileName) {
        const picked = await tryResolveFromMetadata();
        if (picked) {
          const fallbackUrl = `https://archive.org/download/${encodeURIComponent(cleanId)}/${encodeURIComponent(picked)}`;
          if (!attemptedUrls.has(fallbackUrl)) {
            try {
              const resp = await fetchWithTimeout(
                fallbackUrl,
                { headers: { "User-Agent": "AuditCriteriaVault/1.0" } },
                10000
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
          error: "Archive.org থেকে ফাইলটি এখনো পাওয়া যায়নি (নতুন আপলোড হলে ইনডেক্স হতে ১–৩ মিনিট সময় লাগতে পারে)। কিছুক্ষণ পর পুনরায় চেষ্টা করুন।"
        });
      }

      const arrayBuffer = await finalResp.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      if (buffer.length === 0) {
        return res.status(422).json({
          success: false,
          error: "ফাইলটি খালি পাওয়া গেছে, তাই মূল কথা তৈরি করা যায়নি।"
        });
      }
      if (buffer.length > 18 * 1024 * 1024) {
        return res.status(413).json({
          success: false,
          error: "ফাইলের আকার ১৮ MB-এর বেশি হওয়ায় এআই সরাসরি পড়তে পারছে না।"
        });
      }

      rawBase64 = buffer.toString("base64");
      detectedMime = detectMimeFromHint(finalResp.headers.get("content-type") || "", finalFileHint);
    }

    if (!rawBase64) {
      return res.status(400).json({
        success: false,
        error: "ডকুমেন্টের ফাইল ডেটা পাওয়া যায়নি।"
      });
    }

    if (!detectedMime || (!detectedMime.startsWith("image/") && detectedMime !== "application/pdf")) {
      return res.status(415).json({
        success: false,
        error: "এআই শুধুমাত্র PDF বা ছবি (JPG/PNG/WEBP) ফরম্যাটের ডকুমেন্ট পড়ে মূল কথা জানাতে পারে।"
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } }
    });

    const docContextHint = [
      title ? `নথির শিরোনাম: ${String(title).trim()}` : "",
      memoNo ? `স্মারক নম্বর: ${String(memoNo).trim()}` : "",
      authority ? `কর্তৃপক্ষ: ${String(authority).trim()}` : ""
    ]
      .filter(Boolean)
      .join(" | ");

    const systemInstruction = `আপনি একজন অভিজ্ঞ বাংলাদেশি সরকারি অডিট ও প্রশাসন বিশেষজ্ঞ, যিনি জটিল সরকারি সার্কুলার, প্রজ্ঞাপন, অফিস আদেশ ও গেজেট পড়ে সাধারণ ব্যবহারকারীর জন্য অত্যন্ত সহজ-সরল ও প্রমিত বাংলায় "মূল কথা" বুঝিয়ে দেন।

কঠোর নিয়মাবলি (অবশ্যই মেনে চলতে হবে):
১. **অনুমান সম্পূর্ণ নিষিদ্ধ (Zero Guessing Policy):** যদি ডকুমেন্টটি ঝাপসা, অস্পষ্ট, কাটা পড়া, অতি নিম্নমানের স্ক্যান বা অপাঠ্য হয়—তবে কোনো অবস্থাতেই অনুমাননির্ভর বা বানানো কোনো তথ্য লিখবেন না। সেক্ষেত্রে "isUnclear" অবশ্যই true দিন এবং "unclearNote"-এ স্পষ্টভাবে লিখে দিন যে ডকুমেন্টটি/এর অংশবিশেষ অস্পষ্ট হওয়ায় নিশ্চিতভাবে পড়া যাচ্ছে না। যদি কোনো অংশ পরিষ্কার পড়া যায় এবং কোনো অংশ অস্পষ্ট থাকে, তবে কেবল নিশ্চিতভাবে পড়া অংশটুকুই লিখুন এবং অস্পষ্ট অংশের ব্যাপারে অনুমান না করে তা উল্লেখ করুন।
২. **সবকিছু না বলে শুধুমাত্র মূল কথা:** ডকুমেন্টের প্রতিটি ধারা-উপধারা বা জটিল দাপ্তরিক ভাষা হুবহু তুলে ধরবেন না। ব্যবহারকারী যেন সম্পূর্ণ ডকুমেন্টটি না পড়েই বুঝতে পারেন—তাই শুধু আসল সিদ্ধান্ত/নিয়ম/মূল বক্তব্যটি সংক্ষেপে, সহজ-সরল ভাষায় ৩ থেকে ৬টি বাক্যে (অথবা প্রয়োজনে সংক্ষিপ্ত পয়েন্ট আকারে) বুঝিয়ে দিন।
৩. **প্রয়োজনে সহজ উদাহরণ:** যদি মূল বিষয়টি বোঝাতে একটি ছোট ও বাস্তবসম্মত উদাহরণ দরকার হয় (যেমন- অর্থের হিসাব, শতকরা হার, সময়সীমা বা কোন ক্ষেত্রে প্রযোজ্য হবে), তবে ডকুমেন্টের তথ্যের সাথে ১০০% সামঞ্জস্য রেখে "example"-এ ১টি ছোট সহজ উদাহরণ দিন। উদাহরণে কখনোই ডকুমেন্টে নেই এমন কোনো নতুন নিয়ম যোগ করবেন না। উদাহরণ অপ্রয়োজনীয় হলে বা ডকুমেন্ট অস্পষ্ট হলে "example" ফাঁকা ("") রাখুন।
৪. **সত্যতা:** কেবল সংযুক্ত ডকুমেন্টে যা সরাসরি লেখা আছে, তার ওপর ভিত্তি করেই উত্তর দেবেন।`;

    const prompt = `${docContextHint ? `প্রাথমিক সূত্র: ${docContextHint}\n\n` : ""}সংযুক্ত ডকুমেন্টটি (ছবি বা PDF) মনোযোগ দিয়ে পড়ুন এবং শুধুমাত্র মূল কথাটি সহজ বাংলায় নিচের JSON কাঠামোতে দিন:
- "isUnclear": ডকুমেন্টটি অস্পষ্ট/অপাঠ্য হলে true, আর পরিষ্কার পড়া গেলে false।
- "unclearNote": যদি অস্পষ্ট হয় (বা কোনো অংশ অস্পষ্ট থাকে), তার সুস্পষ্ট কারণ (বাংলায়)। পুরোপুরি পরিষ্কার হলে ""।
- "summary": জটিল ভাষা পরিহার করে সহজ-সরল বাংলায় ডকুমেন্টটির সংক্ষিপ্ত "মূল কথা"। (পুরোপুরি অস্পষ্ট হলে summary-তে স্পষ্টভাবে লিখে দিন যে ডকুমেন্টটি অস্পষ্ট হওয়ায় মূল বক্তব্য উদ্ধার করা সম্ভব হয়নি)।
- "example": মূল কথাটি সহজে বোঝার জন্য প্রয়োজনে ১টি সংক্ষিপ্ত উদাহরণ (না লাগলে বা ডকুমেন্ট অস্পষ্ট হলে "")।`;

    const modelConfigs = [
      { model: "gemini-4-hydrogen", thinkingLevel: ThinkingLevel.LOW, timeoutMs: 17000 },
      { model: "gemini-3.1-flash-lite", thinkingLevel: ThinkingLevel.MINIMAL, timeoutMs: 9000 }
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
              systemInstruction,
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  isUnclear: {
                    type: Type.BOOLEAN,
                    description: "True if the document is blurry, illegible, or too unclear to reliably read without guessing."
                  },
                  unclearNote: {
                    type: Type.STRING,
                    description: "Clear Bengali explanation if the document or any critical part is unclear; otherwise empty string."
                  },
                  summary: {
                    type: Type.STRING,
                    description: "Concise, easy-to-understand core takeaway in simple Bengali."
                  },
                  example: {
                    type: Type.STRING,
                    description: "Optional brief practical example in simple Bengali if helpful, or empty string."
                  }
                },
                required: ["isUnclear", "unclearNote", "summary", "example"]
              },
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
        console.warn(`Model ${cfg.model} in summarize-document failed, trying next:`, err?.message || err);
      }
    }

    if (!result || !result.text) {
      throw lastError || new Error("সকল এআই মডেল বর্তমানে ব্যস্ত বা সময়সীমা অতিক্রম করেছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।");
    }

    const rawText = result.text || "";
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    let parsed: any = {};
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.warn("Failed to parse summarize-document JSON:", e);
      }
    }

    const isUnclear = Boolean(parsed.isUnclear);
    const unclearNote = typeof parsed.unclearNote === "string" ? parsed.unclearNote.trim() : "";
    const summary = typeof parsed.summary === "string" ? parsed.summary.trim() : "";
    const example = typeof parsed.example === "string" ? parsed.example.trim() : "";

    if (!summary && !unclearNote) {
      return res.status(502).json({
        success: false,
        error: "এআই ডকুমেন্টটি থেকে নির্ভরযোগ্য মূল কথা তৈরি করতে পারেনি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।"
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        summary: summary || unclearNote,
        example: isUnclear ? "" : example,
        isUnclear,
        unclearNote,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (err: any) {
    console.error("Summarize document error:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "ডকুমেন্টের মূল কথা তৈরি করতে সমস্যা হয়েছে।"
    });
  }
}
