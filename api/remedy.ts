import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

const LANG_NAME = { en: "English", om: "Afaan Oromoo", am: "Amharic" } as const;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { disease, crop, available, lang = "en" } = req.body ?? {};

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Create a custom home remedy for ${disease} on ${crop}. 
    The user only has these materials: ${available}.
    Provide a clear recipe/instructions in ${LANG_NAME[lang as keyof typeof LANG_NAME] ?? "English"}.
    Respond strictly in JSON format:
    {
      "remedy": "..."
    }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const cleanJson = text.replace(/```json|```/g, "").trim();
    const data = JSON.parse(cleanJson);

    return res.status(200).json({ ok: true, ...data });
  } catch (e: any) {
    console.error("Remedy error", e);
    return res.status(500).json({ ok: false, error: e.message });
  }
}
