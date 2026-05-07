import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

const LANG_NAME = { en: "English", om: "Afaan Oromoo", am: "Amharic" } as const;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { imageBase64, crop = "", mimeType = "image/jpeg", lang = "en" } = req.body ?? {};
  if (!imageBase64) return res.status(400).json({ ok: false, error: "imageBase64 required" });

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Analyze this plant leaf image. ${crop ? `The crop is ${crop}.` : ""} 
    Identify the disease if any, confidence level, severity, scientific solution, home remedy, and prevention.
    Also determine if it's a plant leaf or not.
    Respond strictly in JSON format in ${LANG_NAME[lang as keyof typeof LANG_NAME] ?? "English"} language:
    {
      "disease": "name",
      "confidence": "high/medium/low",
      "severity": "mild/moderate/severe",
      "scientific_solution": "...",
      "home_remedy": "...",
      "prevention": "...",
      "is_plant": true/false
    }`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: imageBase64, mimeType } }
    ]);
    const response = await result.response;
    const text = response.text();
    const cleanJson = text.replace(/```json|```/g, "").trim();
    const data = JSON.parse(cleanJson);

    return res.status(200).json({ ok: true, ...data });
  } catch (e: any) {
    console.error("Diagnosis error", e);
    return res.status(500).json({ ok: false, error: e.message });
  }
}
