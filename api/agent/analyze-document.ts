import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const { fileBase64, fileName, mimeType } = body;

    if (!fileBase64) {
      return res.status(400).json({ 
        success: false, 
        error: "ফাইল ডেটা (fileBase64) প্রদান করা আবশ্যক" 
      });
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
      console.warn("GEMINI_API_KEY is not configured in Vercel environment variables");
      return res.status(200).json({
        success: false,
        isAiAnalyzed: false,
        apiKeyMissing: true,
        error: "GEMINI_API_KEY কনফিগার করা নেই। Vercel Environment Variables-এ GEMINI_API_KEY যুক্ত করুন।",
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

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `আপনি একজন সিনিয়র সরকারি কর্মকর্তা এবং অডিট ও জনপ্রশাসন বিশেষজ্ঞ। এই সার্কুলার/গেজেট/আদেশ/ডকুমেন্টটি (ছবি বা PDF) খুব সতর্কতার সাথে পড়ে ও OCR বিশ্লেষণ করে নিচের ফিল্ডগুলোর তথ্য খাঁটি বাংলায় উদ্ধার করুন:

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

    const result = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { data: rawBase64, mimeType: detectedMime } },
            { text: prompt }
          ]
        }
      ]
    });

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

    let category = parsedData.category || "সার্কুলার";
    const validCategories = ["সার্কুলার", "অফিস আদেশ", "গেজেট", "প্রজ্ঞাপন", "নীতিমালা", "অন্যান্য"];
    if (!validCategories.includes(category)) {
      if (category.includes("আদেশ")) category = "অফিস আদেশ";
      else if (category.includes("গেজেট")) category = "গেজেট";
      else if (category.includes("প্রজ্ঞাপন")) category = "প্রজ্ঞাপন";
      else category = "সার্কুলার";
    }

    const title = parsedData.title && parsedData.title.trim() && 
      !parsedData.title.toLowerCase().includes("whatsapp image") && 
      !parsedData.title.toLowerCase().includes("camscanner")
        ? parsedData.title.trim()
        : "সরকারি সার্কুলার / আদেশ";

    const responseData = {
      title,
      category,
      authority: parsedData.authority?.trim() || "গণপ্রজাতন্ত্রী বাংলাদেশ সরকার",
      memoNo: parsedData.memoNo?.trim() || "",
      docDate: parsedData.docDate && /^\d{4}-\d{2}-\d{2}$/.test(parsedData.docDate) ? parsedData.docDate : new Date().toISOString().split("T")[0],
      description: parsedData.description?.trim() || "সংগৃহীত সরকারি সার্কুলার।"
    };

    return res.status(200).json({
      success: true,
      isAiAnalyzed: true,
      data: responseData
    });
  } catch (err: any) {
    console.error("Vercel analyze document error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "ডকুমেন্ট বিশ্লেষণ করতে সমস্যা হয়েছে।"
    });
  }
}
