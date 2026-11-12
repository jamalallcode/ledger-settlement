import { GoogleGenAI } from '@google/genai';

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
  error?: string;
  data?: DocumentAnalysisResult;
}

const AI_PROMPT = `আপনি একজন সিনিয়র সরকারি কর্মকর্তা এবং অডিট ও জনপ্রশাসন বিশেষজ্ঞ। সংযুক্ত সার্কুলার/গেজেট/আদেশ/ডকুমেন্টটি (ছবি বা PDF) খুব সতর্কতার সাথে পড়ে ও OCR বিশ্লেষণ করে নিচের ফিল্ডগুলোর তথ্য খাঁটি বাংলায় উদ্ধার করুন:

১. "title": ফাইলের ভেতরে "বিষয়:" (Subject) অংশে যা লেখা আছে হুবহু বা সুন্দর প্রমিত বাংলায় সার্কুলারের মূল বিষয়/শিরোনাম। ফাইলের নাম (যেমন: WhatsApp Image... বা CamScanner... ইত্যাদি) কোনোভাবেই শিরোনাম হবে না। ভেতরে বিষয় না থাকলে ডকুমেন্টের মূল বক্তব্যের ওপর ভিত্তি করে সংক্ষেপে মার্জিত বাংলা শিরোনাম দিন।
২. "category": ডকুমেন্টের ধরণ অনুযায়ী শুধুমাত্র যেকোনো একটি লিখুন: "সার্কুলার", "প্রজ্ঞাপন", "অফিস আদেশ", "গেজেট", "নীতিমালা" অথবা "অন্যান্য"।
৩. "authority": কোন মন্ত্রণালয়, বিভাগ, অধিদপ্তর বা কর্তৃপক্ষ এটি জারি করেছে (যেমন: "অর্থ বিভাগ, অর্থ মন্ত্রণালয়", "বাংলাদেশ ব্যাংক", "জনপ্রশাসন মন্ত্রণালয়" ইত্যাদি)।
৪. "memoNo": নথির স্মারক নম্বর / পত্র নম্বর (যেমন: ০৭.০০.০০০০... ইত্যাদি, যদি থাকে)।
৫. "docDate": জারির তারিখ বা স্বাক্ষরের তারিখ (YYYY-MM-DD ফরম্যাটে, যেমন: 2026-03-25)।
৬. "description": সার্কুলারের মূল সিদ্ধান্তের সংক্ষিপ্ত ১-২ লাইনের সারসংক্ষেপ।

শুধুমাত্র একটি ভ্যালিড JSON অবজেক্ট আউটপুট দিন, কোনো কোড ব্লক (markdown \`\`\`json) বা অতিরিক্ত টেক্সট ছাড়া:
{
  "title": "...",
  "category": "...",
  "authority": "...",
  "memoNo": "...",
  "docDate": "...",
  "description": "..."
}`;

export const extractDataFromGeminiResponse = (rawText: string, fileName: string): DocumentAnalysisResult => {
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  let parsed: any = {};
  if (jsonMatch) {
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.warn('JSON parse error from Gemini text:', e);
    }
  }

  let category = parsed.category || 'সার্কুলার';
  const validCategories = ['সার্কুলার', 'অফিস আদেশ', 'গেজেট', 'প্রজ্ঞাপন', 'নীতিমালা', 'অন্যান্য'];
  if (!validCategories.includes(category)) {
    if (category.includes('আদেশ')) category = 'অফিস আদেশ';
    else if (category.includes('গেজেট')) category = 'গেজেট';
    else if (category.includes('প্রজ্ঞাপন')) category = 'প্রজ্ঞাপন';
    else category = 'সার্কুলার';
  }

  const cleanFileName = fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');

  const title = parsed.title && parsed.title.trim() && 
    !parsed.title.toLowerCase().includes('whatsapp image') && 
    !parsed.title.toLowerCase().includes('camscanner')
      ? parsed.title.trim()
      : (cleanFileName || 'সরকারি সার্কুলার / আদেশ');

  return {
    title,
    category,
    authority: parsed.authority?.trim() || 'গণপ্রজাতন্ত্রী বাংলাদেশ সরকার',
    memoNo: parsed.memoNo?.trim() || '',
    docDate: parsed.docDate && /^\d{4}-\d{2}-\d{2}$/.test(parsed.docDate) 
      ? parsed.docDate 
      : new Date().toISOString().split('T')[0],
    description: parsed.description?.trim() || 'সংগৃহীত সরকারি সার্কুলার নথি।'
  };
};

/**
 * Universal Document Analyzer:
 * 1. Calls backend /api/agent/analyze-document (works in local dev & Vercel serverless).
 * 2. If endpoint fails or returns HTML, falls back to direct client-side @google/genai
 *    if VITE_GEMINI_API_KEY is available in browser env.
 * 3. Accurately reports if GEMINI_API_KEY is missing so the user is never confused.
 */
export async function analyzeDocumentWithAI(params: {
  fileBase64: string;
  fileName: string;
  mimeType: string;
}): Promise<AnalyzeDocumentResponse> {
  const { fileBase64, fileName, mimeType } = params;
  const rawBase64 = fileBase64.includes(',') ? fileBase64.split(',')[1] : fileBase64;
  let detectedMime = mimeType;
  if (!detectedMime) {
    if (fileName.toLowerCase().endsWith('.pdf')) detectedMime = 'application/pdf';
    else if (fileName.toLowerCase().endsWith('.png')) detectedMime = 'image/png';
    else if (fileName.toLowerCase().endsWith('.webp')) detectedMime = 'image/webp';
    else detectedMime = 'image/jpeg';
  }

  // Step 1: Try backend API (/api/agent/analyze-document)
  try {
    const res = await fetch('/api/agent/analyze-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileBase64: rawBase64,
        fileName,
        mimeType: detectedMime
      })
    });

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (data.apiKeyMissing) {
        // Fallback to client-side if VITE_GEMINI_API_KEY is in browser
        return tryClientSideGemini(rawBase64, detectedMime, fileName, true);
      }
      if (data.success && data.data && data.isAiAnalyzed) {
        return {
          success: true,
          isAiAnalyzed: true,
          data: data.data
        };
      }
      if (!data.success && data.error) {
        return {
          success: false,
          isAiAnalyzed: false,
          apiKeyMissing: !!data.apiKeyMissing,
          error: data.error
        };
      }
    }
  } catch (apiErr) {
    console.warn('Backend /api/agent/analyze-document call failed, trying client fallback:', apiErr);
  }

  // Step 2: Client-side Gemini fallback (if VITE_GEMINI_API_KEY is provided)
  return tryClientSideGemini(rawBase64, detectedMime, fileName, false);
}

async function tryClientSideGemini(
  rawBase64: string, 
  mimeType: string, 
  fileName: string, 
  knownBackendMissingKey: boolean
): Promise<AnalyzeDocumentResponse> {
  const clientKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (window as any)?.__GEMINI_API_KEY__;
  if (!clientKey) {
    return {
      success: false,
      isAiAnalyzed: false,
      apiKeyMissing: true,
      error: 'GEMINI_API_KEY কনফিগার করা নেই। Vercel বা এনভায়রনমেন্ট সেটিংসে GEMINI_API_KEY অথবা VITE_GEMINI_API_KEY যুক্ত করুন।'
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: clientKey });
    const candidateModels = [
      'gemini-2.5-flash',
      'gemini-flash-latest',
      'gemini-3.8-flash',
      'gemini-3.1-flash-lite'
    ];

    let result: any = null;
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        result = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: [
                { inlineData: { data: rawBase64, mimeType } },
                { text: AI_PROMPT }
              ]
            }
          ]
        });
        if (result && result.text) {
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Client model ${modelName} failed, falling back:`, err?.message || err);
        await new Promise(r => setTimeout(r, 600));
      }
    }

    if (!result || !result.text) {
      throw lastError || new Error("সকল জেমিনি মডেল বর্তমানে ব্যস্ত। অনুগ্রহ করে কয়েক সেকেন্ড পর আবার চেষ্টা করুন।");
    }

    const rawText = result.text || '';
    const parsedData = extractDataFromGeminiResponse(rawText, fileName);

    return {
      success: true,
      isAiAnalyzed: true,
      data: parsedData
    };
  } catch (err: any) {
    console.error('Client-side Gemini extraction error:', err);
    return {
      success: false,
      isAiAnalyzed: false,
      error: err.message || 'ডকুমেন্ট বিশ্লেষণ করতে সমস্যা হয়েছে।'
    };
  }
}

export async function checkGeminiStatus(): Promise<{ active: boolean; model: string }> {
  try {
    const res = await fetch('/api/agent/gemini-status');
    if (res.ok) {
      const data = await res.json();
      if (typeof data.active === 'boolean') {
        return { active: data.active, model: data.model || 'gemini-3.8-flash' };
      }
    }
  } catch (e) {}

  const clientKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (window as any)?.__GEMINI_API_KEY__;
  return {
    active: !!clientKey,
    model: 'gemini-3.8-flash'
  };
}

export async function testGeminiConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/agent/gemini-status', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return { success: true, message: data.message || 'জেমিনি এআই সফলভাবে সংযুক্ত এবং সক্রিয় রয়েছে।' };
      }
      if (data.active === false) {
        return { success: false, message: data.message || data.error || 'GEMINI_API_KEY সেট করা নেই।' };
      }
    }
  } catch (e) {}

  const clientKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (window as any)?.__GEMINI_API_KEY__;
  if (!clientKey) {
    return {
      success: false,
      message: 'GEMINI_API_KEY বা VITE_GEMINI_API_KEY কোনোটিই পাওয়া যায়নি।'
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: clientKey });
    const ping = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: "OK"
    });
    return {
      success: true,
      message: 'জেমিনি এআই ব্রাউজার থেকে সরাসরি সফলভাবে সংযুক্ত ও সক্রিয় আছে!'
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'জেমিনি এআই সংযোগ ব্যর্থ: ' + (err.message || 'অজানা ত্রুটি')
    };
  }
}
