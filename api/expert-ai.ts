import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

const LANG_NAME = { en: "English", om: "Afaan Oromoo", am: "Amharic" } as const;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { question, topic, imageBase64, mimeType, lang = "en" } = req.body ?? {};

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    let prompt = `You are a professional agricultural expert. Answer the following question${topic ? ` related to ${topic}` : ""}: "${question}".
    Provide detailed, practical advice in ${LANG_NAME[lang as keyof typeof LANG_NAME] ?? "English"}.
    Respond strictly in JSON format:
    {
      "answer": "..."
    }`;

    let result;
    if (imageBase64) {
      result = await model.generateContent([
        prompt,
        { inlineData: { data: imageBase64, mimeType: mimeType || "image/jpeg" } }
      ]);
    } else {
      result = await model.generateContent(prompt);
    }

    const response = await result.response;
    const text = response.text();
    const cleanJson = text.replace(/```json|```/g, "").trim();
    const data = JSON.parse(cleanJson);

    return res.status(200).json({ ok: true, ...data });
  } catch (e: any) {
    console.error("Expert AI error", e);
    return res.status(500).json({ ok: false, error: e.message });
  }
}
