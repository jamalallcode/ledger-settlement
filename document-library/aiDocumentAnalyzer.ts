export interface ExistingDocCheckItem {
  id?: string;
  title?: string;
  memoNo?: string;
  docDate?: string;
  authority?: string;
  description?: string;
  location?: 'vault' | 'pending';
}

export interface DuplicateMatchInfo {
  isDuplicate: boolean;
  matchedId?: string;
  matchedTitle: string;
  matchedMemoNo?: string;
  matchedDocDate?: string;
  location?: 'vault' | 'pending';
  reason: string;
}

export interface DocumentAnalysisResult {
  title: string;
  category: string;
  authority: string;
  memoNo: string;
  docDate: string;
  description: string;
}

export interface AnalyzeDocumentResponse {
  success: boolean;
  isAiAnalyzed: boolean;
  apiKeyMissing?: boolean;
  timedOut?: boolean;
  error?: string;
  data?: DocumentAnalysisResult;
  duplicateMatch?: DuplicateMatchInfo | null;
}

export interface DocumentKeyTakeaway {
  summary: string;
  example?: string;
  isUnclear: boolean;
  unclearNote?: string;
  generatedAt: string;
}

export interface SummarizeDocumentResponse {
  success: boolean;
  apiKeyMissing?: boolean;
  timedOut?: boolean;
  error?: string;
  data?: DocumentKeyTakeaway;
}

const fetchWithTimeout = async (
  url: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> => {
  const { timeoutMs = 16000, ...fetchOpts } = options;
  const controller = new AbortController();
  const externalSignal = fetchOpts.signal;

  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener("abort", onExternalAbort, { once: true });
    }
  }

  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...fetchOpts,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
    if (externalSignal) {
      externalSignal.removeEventListener("abort", onExternalAbort);
    }
  }
};

/**
 * Server-side Document Analyzer with strict timeout protection and AI semantic duplicate check.
 */
export async function analyzeDocumentWithAI(params: {
  fileBase64: string;
  fileName: string;
  mimeType: string;
  existingDocs?: ExistingDocCheckItem[];
  signal?: AbortSignal;
}): Promise<AnalyzeDocumentResponse> {
  const { fileBase64, fileName, mimeType, existingDocs, signal } = params;
  const rawBase64 = fileBase64.includes(",") ? fileBase64.split(",")[1] : fileBase64;
  let detectedMime = mimeType;
  if (!detectedMime) {
    if (fileName.toLowerCase().endsWith(".pdf")) detectedMime = "application/pdf";
    else if (fileName.toLowerCase().endsWith(".png")) detectedMime = "image/png";
    else if (fileName.toLowerCase().endsWith(".webp")) detectedMime = "image/webp";
    else detectedMime = "image/jpeg";
  }

  try {
    const res = await fetchWithTimeout("/api/agent/analyze-document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileBase64: rawBase64,
        fileName,
        mimeType: detectedMime,
        existingDocs: Array.isArray(existingDocs) ? existingDocs.slice(0, 75) : undefined
      }),
      timeoutMs: 17000,
      signal
    });

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await res.json();
      if (data.apiKeyMissing) {
        return {
          success: false,
          isAiAnalyzed: false,
          apiKeyMissing: true,
          error: data.error || "GEMINI_API_KEY কনফিগার করা নেই।"
        };
      }
      if (data.success && data.data && data.isAiAnalyzed) {
        return {
          success: true,
          isAiAnalyzed: true,
          data: data.data,
          duplicateMatch: data.duplicateMatch || null
        };
      }
      return {
        success: false,
        isAiAnalyzed: false,
        apiKeyMissing: !!data.apiKeyMissing,
        error: data.error || "এআই ডকুমেন্টটি বিশ্লেষণ করতে পারেনি।"
      };
    }

    return {
      success: false,
      isAiAnalyzed: false,
      error: `সার্ভার থেকে অপ্রত্যাশিত উত্তর পাওয়া গেছে (HTTP ${res.status})। আপনি নিচে তথ্য লিখতে পারেন বা সরাসরি সার্ভারে পাঠাতে পারেন।`
    };
  } catch (apiErr: any) {
    if (apiErr?.name === "AbortError") {
      return {
        success: false,
        isAiAnalyzed: false,
        timedOut: true,
        error: "এআই রিডিংয়ে সময়সীমা (১৬ সেকেন্ড) অতিক্রম করেছে। আপনি সরাসরি তথ্য লিখতে পারেন অথবা “সরাসরি সার্ভারে পাঠান” বাটনে ক্লিক করতে পারেন।"
      };
    }
    return {
      success: false,
      isAiAnalyzed: false,
      error: apiErr?.message || "এআই সার্ভারের সাথে সংযোগ ব্যর্থ হয়েছে।"
    };
  }
}

export async function checkGeminiStatus(): Promise<{ active: boolean; model: string }> {
  try {
    const res = await fetchWithTimeout("/api/agent/gemini-status", { timeoutMs: 8000 });
    if (res.ok) {
      const data = await res.json();
      if (typeof data.active === "boolean") {
        return { active: data.active, model: data.model || "gemini-3.1-flash-lite" };
      }
    }
  } catch (e) {}

  return {
    active: false,
    model: "gemini-3.1-flash-lite"
  };
}

export async function testGeminiConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetchWithTimeout("/api/agent/gemini-status", {
      method: "POST",
      timeoutMs: 10000
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return { success: true, message: data.message || "জেমিনি এআই সফলভাবে সংযুক্ত এবং সক্রিয় রয়েছে।" };
      }
      return {
        success: false,
        message: data.message || data.error || "GEMINI_API_KEY সেট করা নেই বা সংযোগ ব্যর্থ হয়েছে।"
      };
    }
    return {
      success: false,
      message: `এপিআই সংযোগ ব্যর্থ (HTTP ${res.status})`
    };
  } catch (err: any) {
    if (err?.name === "AbortError") {
      return {
        success: false,
        message: "জেমিনি এআই সংযোগ পরীক্ষায় সময় বেশি লাগছে (Timeout)।"
      };
    }
    return {
      success: false,
      message: "জেমিনি এআই সংযোগ ব্যর্থ: " + (err?.message || "অজানা ত্রুটি")
    };
  }
}

export interface ProcessDocumentRetryResult {
  success: boolean;
  uploadedToArchive?: boolean;
  duplicateDetected?: boolean;
  duplicateInfo?: DuplicateMatchInfo;
  extractedData?: Partial<DocumentAnalysisResult>;
  archiveId?: string;
  archiveUrl?: string;
  archiveDownloadUrl?: string;
  originalFileName?: string;
  savedToSupabaseOnServer?: boolean;
  pendingDocument?: any;
  error?: string;
  attemptsUsed?: number;
}

const formatNonJsonHttpError = (status: number, rawBody: string): { message: string; isPermanent: boolean } => {
  const cleanSnippet = rawBody.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 140);
  if (status === 504 || status === 408) {
    return {
      message: `সার্ভার সময়সীমা অতিক্রম করেছে (HTTP ${status} Timeout)${cleanSnippet ? ` — ${cleanSnippet}` : ""}`,
      isPermanent: false
    };
  }
  if (status === 502 || status === 503 || status === 429) {
    return {
      message: `সার্ভার বা Archive.org সাময়িকভাবে ব্যস্ত/অপ্রাপ্য (HTTP ${status})${cleanSnippet ? ` — ${cleanSnippet}` : ""}`,
      isPermanent: false
    };
  }
  if (status === 413) {
    return {
      message: "ফাইলের আকার সার্ভারের সীমার চেয়ে বেশি (HTTP 413 Payload Too Large) — অনুগ্রহ করে ৪ MB-এর নিচের ফাইল ব্যবহার করুন।",
      isPermanent: true
    };
  }
  if (status === 401 || status === 403) {
    return {
      message: `Archive.org অনুমোদন ত্রুটি (HTTP ${status}) — S3 Access/Secret Key যাচাই করুন।`,
      isPermanent: true
    };
  }
  if (status === 400 || status === 404 || status === 422) {
    return {
      message: `অনুরোধ বা ফাইলের তথ্যে ত্রুটি (HTTP ${status})${cleanSnippet ? ` — ${cleanSnippet}` : ""}`,
      isPermanent: true
    };
  }
  return {
    message: `সার্ভার থেকে অপ্রত্যাশিত ত্রুটি এসেছে (HTTP ${status})${cleanSnippet ? `: ${cleanSnippet}` : ""}`,
    isPermanent: false
  };
};

const isPermanentArchiveErrorText = (status: number, msg: string): boolean => {
  if ([400, 401, 403, 404, 413, 422].includes(status)) return true;
  const lower = (msg || "").toLowerCase();
  return (
    lower.includes("signaturedoesnotmatch") ||
    lower.includes("accessdenied") ||
    lower.includes("invalidaccesskeyid") ||
    lower.includes("requestentitytoolarge") ||
    lower.includes("কনফিগার করা নেই") ||
    lower.includes("প্রদান করা আবশ্যক")
  );
};

/**
 * Archive.org-safe upload helper:
 * - Up to 5 smart retries ONLY on transient errors (504/502/503/network/timeout) with safe backoff (2s, 4s, 6s, 8s)
 * - Never spams Archive.org on permanent errors (403/400/413 or duplicate match)
 * - Switches off heavy AI inside retries after attempt 1 timeout so upload succeeds in 1-3s
 * - Always preserves exact HTTP status & root cause if all attempts fail
 */
export async function uploadToArchiveWithSmartRetry(
  payload: Record<string, any>,
  options?: {
    maxAttempts?: number;
    shouldStop?: () => boolean;
    onAttemptChange?: (attempt: number, maxAttempts: number, label: string) => void;
  }
): Promise<ProcessDocumentRetryResult> {
  const maxAttempts = options?.maxAttempts ?? 5;
  const backoffMs = [0, 2000, 4000, 6000, 8000];
  let lastError = "Archive.org-এ আপলোড সম্পন্ন হয়নি।";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (options?.shouldStop?.()) {
      return { success: false, error: "ব্যবহারকারী কর্তৃক আপলোড থামানো হয়েছে।", attemptsUsed: attempt - 1 };
    }

    if (attempt > 1) {
      const waitMs = backoffMs[Math.min(attempt - 1, backoffMs.length - 1)] || 6000;
      options?.onAttemptChange?.(
        attempt,
        maxAttempts,
        `বিরতি (${Math.round(waitMs / 1000)} সে.) শেষে চেষ্টা ${attempt}/${maxAttempts}...`
      );
      await new Promise(resolve => setTimeout(resolve, waitMs));
      if (options?.shouldStop?.()) {
        return { success: false, error: "ব্যবহারকারী কর্তৃক আপলোড থামানো হয়েছে।", attemptsUsed: attempt - 1 };
      }
    }

    options?.onAttemptChange?.(
      attempt,
      maxAttempts,
      attempt === 1 ? "Archive.org-এ পাঠানো হচ্ছে..." : `পুনরায় চেষ্টা ${attempt}/${maxAttempts}...`
    );

    // On retry after attempt 1 failure/timeout, skip heavy AI re-run so upload finishes fast in 1-3s
    const fallbackTitleFromName =
      String(payload.fileName || "circular")
        .replace(/\.[^/.]+$/, "")
        .replace(/[_-]/g, " ")
        .trim() || "সরকারি সার্কুলার";

    const attemptPayload =
      attempt === 1
        ? payload
        : {
            ...payload,
            autoAnalyze: false,
            existingDocs: undefined,
            title:
              payload.title && String(payload.title).trim()
                ? payload.title
                : fallbackTitleFromName
          };

    try {
      const resp = await fetchWithTimeout("/api/agent/process-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attemptPayload),
        timeoutMs: 28000
      });

      const rawText = await resp.text().catch(() => "");
      let data: any = null;
      if (rawText) {
        try {
          data = JSON.parse(rawText);
        } catch (e) {
          data = null;
        }
      }

      if (data && data.duplicateDetected) {
        return {
          ...data,
          success: false,
          uploadedToArchive: false,
          attemptsUsed: attempt
        };
      }

      if (resp.ok && data && data.success && data.uploadedToArchive) {
        return {
          ...data,
          attemptsUsed: attempt
        };
      }

      if (data && data.error) {
        lastError = String(data.error);
        if (isPermanentArchiveErrorText(resp.status, lastError)) {
          return {
            success: false,
            uploadedToArchive: false,
            error: lastError,
            attemptsUsed: attempt
          };
        }
      } else {
        const formatted = formatNonJsonHttpError(resp.status, rawText);
        lastError = formatted.message;
        if (formatted.isPermanent) {
          return {
            success: false,
            uploadedToArchive: false,
            error: lastError,
            attemptsUsed: attempt
          };
        }
      }
    } catch (err: any) {
      if (err?.name === "AbortError") {
        lastError = "সার্ভারের সাথে সংযোগের সময়সীমা (২৮ সেকেন্ড Timeout) শেষ হয়েছে।";
      } else {
        lastError = `নেটওয়ার্ক বা সার্ভার সংযোগ ত্রুটি: ${err?.message || "ইন্টারনেট সংযোগ বিচ্ছিন্ন"}`;
      }
    }
  }

  return {
    success: false,
    uploadedToArchive: false,
    error: `${maxAttempts} বার নিরাপদ চেষ্টার পরও ব্যর্থ — মূল কারণ: ${lastError}`,
    attemptsUsed: maxAttempts
  };
}

/**
 * Generates a concise, plain-Bengali "মূল কথা" (Key Takeaway) summary of a document
 * with strict zero-guessing behavior for unclear/blurry scans.
 */
export async function summarizeDocumentWithAI(params: {
  fileBase64?: string;
  mimeType?: string;
  archiveId?: string;
  fileName?: string;
  downloadUrl?: string;
  title?: string;
  memoNo?: string;
  authority?: string;
  signal?: AbortSignal;
}): Promise<SummarizeDocumentResponse> {
  const {
    fileBase64,
    mimeType,
    archiveId,
    fileName,
    downloadUrl,
    title,
    memoNo,
    authority,
    signal
  } = params;

  try {
    const res = await fetchWithTimeout("/api/agent/summarize-document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileBase64: fileBase64 || undefined,
        mimeType: mimeType || undefined,
        archiveId: archiveId || undefined,
        fileName: fileName || undefined,
        downloadUrl: downloadUrl || undefined,
        title: title || undefined,
        memoNo: memoNo || undefined,
        authority: authority || undefined
      }),
      timeoutMs: 29000,
      signal
    });

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await res.json();
      if (data.apiKeyMissing) {
        return {
          success: false,
          apiKeyMissing: true,
          error: data.error || "GEMINI_API_KEY কনফিগার করা নেই।"
        };
      }
      if (res.ok && data.success && data.data) {
        return {
          success: true,
          data: data.data
        };
      }
      return {
        success: false,
        apiKeyMissing: !!data.apiKeyMissing,
        error: data.error || "ডকুমেন্টটির মূল কথা তৈরি করা যায়নি।"
      };
    }

    return {
      success: false,
      error: `সার্ভার থেকে অপ্রত্যাশিত উত্তর পাওয়া গেছে (HTTP ${res.status})।`
    };
  } catch (err: any) {
    if (err?.name === "AbortError") {
      return {
        success: false,
        timedOut: true,
        error: "ডকুমেন্টটি পড়ে মূল কথা তৈরি করতে সময় বেশি লাগছে (Timeout)। অনুগ্রহ করে পুনরায় চেষ্টা করুন।"
      };
    }
    return {
      success: false,
      error: err?.message || "এআই সার্ভারের সাথে সংযোগ ব্যর্থ হয়েছে।"
    };
  }
}


