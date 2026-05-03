import type { VercelRequest, VercelResponse } from "@vercel/node";

const LANG_NAME = { en: "English", om: "Afaan Oromoo", am: "Amharic" } as const;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const KEY = process.env.LOVABLE_API_KEY;
  if (!KEY) return res.status(500).json({ ok: false, error: "AI not configured" });

  const { reading, lang = "en" } = req.body ?? {};
  if (!reading) return res.status(400).json({ ok: false, error: "reading required" });

  const r = reading;
  const summary = [
    r.crop ? `Crop: ${r.crop}` : null,
    r.moisture != null ? `Soil moisture: ${r.moisture}%` : null,
    r.nitrogen != null ? `Nitrogen (N): ${r.nitrogen} mg/kg` : null,
    r.phosphorus != null ? `Phosphorus (P): ${r.phosphorus} mg/kg` : null,
    r.potassium != null ? `Potassium (K): ${r.potassium} mg/kg` : null,
    r.ph != null ? `Soil pH: ${r.ph}` : null,
    r.temperature != null ? `Soil temperature: ${r.temperature}°C` : null,
  ].filter(Boolean).join("\n");

  const langName = LANG_NAME[lang as keyof typeof LANG_NAME] ?? "English";

  try {
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: `You are an expert agronomist advising smallholder farmers in Ethiopia. Given soil sensor readings, return concise, practical advice ENTIRELY in ${langName}. Always call the function 'soil_advice'. Mention low-cost actions farmers can do themselves.` },
          { role: "user", content: `Soil readings:\n${summary}\n\nGive farming advice.` },
        ],
        tools: [{ type: "function", function: { name: "soil_advice", description: "Return structured soil advice.", parameters: { type: "object", properties: { status: { type: "string" }, advice: { type: "string" }, actions: { type: "array", items: { type: "string" } } }, required: ["status","advice","actions"], additionalProperties: false } } }],
        tool_choice: { type: "function", function: { name: "soil_advice" } },
      }),
    });
    if (!aiRes.ok) {
      if (aiRes.status === 429) return res.status(200).json({ ok: false, error: "Too many requests, try again soon." });
      if (aiRes.status === 402) return res.status(200).json({ ok: false, error: "AI credits exhausted." });
      return res.status(200).json({ ok: false, error: "AI service error" });
    }
    const json = await aiRes.json();
    const tc = json?.choices?.[0]?.message?.tool_calls?.[0];
    if (!tc?.function?.arguments) return res.status(200).json({ ok: false, error: "No advice returned" });
    return res.status(200).json({ ok: true, ...JSON.parse(tc.function.arguments) });
  } catch (e) {
    return res.status(200).json({ ok: false, error: e instanceof Error ? e.message : "Unknown error" });
  }
}
