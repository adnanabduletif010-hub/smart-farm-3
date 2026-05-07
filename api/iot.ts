import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

const LANG_NAME = { en: "English", om: "Afaan Oromoo", am: "Amharic" } as const;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { lang = "en", reading } = req.body ?? {};

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Analyze these soil sensor readings: ${JSON.stringify(reading)}.
    Provide a status summary, practical advice, and a list of 3-5 specific actions the farmer should take.
    Respond strictly in JSON format in ${LANG_NAME[lang as keyof typeof LANG_NAME] ?? "English"}:
    {
      "status": "...",
      "advice": "...",
      "actions": ["...", "...", "..."]
    }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const cleanJson = text.replace(/```json|```/g, "").trim();
    const data = JSON.parse(cleanJson);

    return res.status(200).json({ ok: true, ...data });
  } catch (e: any) {
    console.error("IoT AI error", e);
    return res.status(500).json({ ok: false, error: e.message });
  }
}
