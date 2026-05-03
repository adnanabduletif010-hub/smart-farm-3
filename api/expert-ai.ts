import type { VercelRequest, VercelResponse } from "@vercel/node";

const LANG_NAME = { en: "English", om: "Afaan Oromoo", am: "Amharic" } as const;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const KEY = process.env.LOVABLE_API_KEY;
  if (!KEY) return res.status(500).json({ ok: false, error: "AI not configured" });

  const { question, topic = "", imageBase64, mimeType = "image/jpeg", lang = "en" } = req.body ?? {};
  if (!question) return res.status(400).json({ ok: false, error: "question required" });

  const langName = LANG_NAME[lang as keyof typeof LANG_NAME] ?? "English";
  const system = `You are an expert agronomist helping smallholder farmers. Answer the farmer's question with practical, concise, low-cost advice. Reply ENTIRELY in ${langName}. Cover: likely cause, scientific solution, low-cost home remedy, and prevention.`;

  const userContent: any[] = [{ type: "text", text: `Topic: ${String(topic).slice(0,80) || "general"}\nQuestion: ${String(question).slice(0,2000)}` }];
  if (imageBase64) userContent.push({ type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } });

  try {
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: [{ role: "system", content: system }, { role: "user", content: userContent }] }),
    });
    if (!aiRes.ok) {
      if (aiRes.status === 429) return res.status(200).json({ ok: false, error: "Too many requests." });
      if (aiRes.status === 402) return res.status(200).json({ ok: false, error: "AI credits exhausted." });
      return res.status(200).json({ ok: false, error: "AI service error" });
    }
    const json = await aiRes.json();
    const text = json?.choices?.[0]?.message?.content;
    if (!text) return res.status(200).json({ ok: false, error: "No answer returned" });
    return res.status(200).json({ ok: true, answer: text });
  } catch (e) {
    return res.status(200).json({ ok: false, error: e instanceof Error ? e.message : "Unknown error" });
  }
}
