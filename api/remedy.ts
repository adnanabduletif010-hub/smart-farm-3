import type { VercelRequest, VercelResponse } from "@vercel/node";

const LANG_NAME = { en: "English", om: "Afaan Oromoo", am: "Amharic" } as const;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const KEY = process.env.LOVABLE_API_KEY;
  if (!KEY) return res.status(500).json({ ok: false, error: "AI not configured" });

  const { disease, crop = "", available, lang = "en" } = req.body ?? {};
  if (!disease || !available) return res.status(400).json({ ok: false, error: "disease and available required" });

  const langName = LANG_NAME[lang as keyof typeof LANG_NAME] ?? "English";

  try {
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: `You are an expert agronomist helping a smallholder farmer treat a plant disease using ONLY items they already have at home. Respond ENTIRELY in ${langName}. Use ONLY the items the farmer lists. Give an exact mixing recipe (quantities, ratios, water amount), how to apply, how often, and safety notes. Keep it under 200 words and farmer-friendly.` },
          { role: "user", content: `Crop: ${String(crop).slice(0,80) || "unknown"}\nDisease/problem: ${String(disease).slice(0,200)}\nItems I have at home: ${String(available).slice(0,1000)}\n\nGive me a step-by-step home remedy using only these items.` },
        ],
      }),
    });
    if (!aiRes.ok) {
      if (aiRes.status === 429) return res.status(200).json({ ok: false, error: "Too many requests" });
      if (aiRes.status === 402) return res.status(200).json({ ok: false, error: "AI credits exhausted" });
      return res.status(200).json({ ok: false, error: "AI service error" });
    }
    const json = await aiRes.json();
    const remedy = json?.choices?.[0]?.message?.content;
    if (!remedy) return res.status(200).json({ ok: false, error: "Empty answer" });
    return res.status(200).json({ ok: true, remedy });
  } catch (e) {
    return res.status(200).json({ ok: false, error: e instanceof Error ? e.message : "Unknown error" });
  }
}
