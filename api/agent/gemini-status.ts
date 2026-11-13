import { GoogleGenAI, ThinkingLevel } from "@google/genai";

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

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (req.method === "GET") {
    return res.status(200).json({
      active: !!apiKey,
      model: "gemini-3.1-flash-lite"
    });
  }

  if (req.method === "POST") {
    if (!apiKey) {
      return res.status(200).json({
        success: false,
        active: false,
        message: "GEMINI_API_KEY কনফিগার করা নেই। Vercel Environment Variables-এ GEMINI_API_KEY যুক্ত করুন।"
      });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } }
      });

      const pingPromise = ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: "স্বাগতম! শুধুমাত্র 'OK' শব্দটি লিখুন।",
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL }
        }
      });

      const ping: any = await Promise.race([
        pingPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("সংযোগ পরীক্ষা সময়সীমা (8s) অতিক্রম করেছে।")), 8000))
      ]);

      return res.status(200).json({
        success: true,
        active: true,
        response: (ping.text || "").trim(),
        message: "জেমিনি এআই সফলভাবে সংযুক্ত এবং সক্রিয় রয়েছে।"
      });
    } catch (err: any) {
      return res.status(200).json({
        success: false,
        active: false,
        error: err.message || "জেমিনি এপিআই সংযোগে সমস্যা হয়েছে।"
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
