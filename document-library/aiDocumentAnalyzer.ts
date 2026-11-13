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
