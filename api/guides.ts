import type { VercelRequest, VercelResponse } from "@vercel/node";

const LANG_NAME = { en: "English", om: "Afaan Oromoo", am: "Amharic" } as const;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const KEY = process.env.LOVABLE_API_KEY;
  if (!KEY) return res.status(500).json({ ok: false, error: "AI not configured" });

  const { crop, question, lang = "en" } = req.body ?? {};
  if (!crop || !question) return res.status(400).json({ ok: false, error: "crop and question required" });

  const langName = LANG_NAME[lang as keyof typeof LANG_NAME] ?? "English";

  try {
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: `You are an expert agronomist for smallholder farmers in Ethiopia. Answer ENTIRELY in ${langName}. Be practical, scientific yet simple. Cover spacing, soil prep, fertilizer, water, pest/disease prevention, and harvest timing when relevant. Keep answers under 250 words.` },
          { role: "user", content: `Crop: ${String(crop).slice(0,80)}\nQuestion: ${String(question).slice(0,1000)}` },
        ],
      }),
    });
    if (!aiRes.ok) {
      if (aiRes.status === 429) return res.status(200).json({ ok: false, error: "Too many requests" });
      if (aiRes.status === 402) return res.status(200).json({ ok: false, error: "AI credits exhausted" });
      return res.status(200).json({ ok: false, error: "AI service error" });
    }
    const json = await aiRes.json();
    const answer = json?.choices?.[0]?.message?.content;
    if (!answer) return res.status(200).json({ ok: false, error: "Empty answer" });
    return res.status(200).json({ ok: true, answer });
  } catch (e) {
    return res.status(200).json({ ok: false, error: e instanceof Error ? e.message : "Unknown error" });
  }
}
