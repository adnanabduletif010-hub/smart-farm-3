import type { VercelRequest, VercelResponse } from "@vercel/node";

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 5;
const ipHits = new Map<string, number[]>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const arr = (ipHits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (arr.length >= RATE_MAX) { ipHits.set(ip, arr); return false; }
  arr.push(now);
  ipHits.set(ip, arr);
  return true;
}

const LANG_NAME = { en: "English", om: "Afaan Oromoo", am: "Amharic" } as const;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const KEY = process.env.LOVABLE_API_KEY;
  if (!KEY) return res.status(500).json({ ok: false, error: "AI not configured" });

  const ip = (req.headers["x-forwarded-for"] as string || req.headers["x-real-ip"] as string || "unknown").split(",")[0].trim();
  if (!checkRateLimit(ip)) return res.status(429).json({ ok: false, error: "Too many diagnoses from this device. Please wait a few minutes." });

  const { imageBase64, crop = "", mimeType = "image/jpeg", lang = "en" } = req.body ?? {};
  if (!imageBase64) return res.status(400).json({ ok: false, error: "imageBase64 required" });

  try {
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: `You are an expert agronomist and plant pathologist helping smallholder farmers. Analyze the uploaded crop/leaf photo. Identify any disease, pest or deficiency. Always respond by calling the function 'report_diagnosis'. Write ALL string fields ENTIRELY in ${LANG_NAME[lang as keyof typeof LANG_NAME] ?? "English"}. Be practical, concise, farmer-friendly. Provide BOTH a scientific/commercial treatment AND a low-cost home remedy. If the image is not a plant, set is_plant=false.` },
          { role: "user", content: [{ type: "text", text: `Crop hint: ${crop.slice(0,80) || "unknown"}. Diagnose this plant photo.` }, { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } }] },
        ],
        tools: [{ type: "function", function: { name: "report_diagnosis", description: "Return a structured diagnosis for the crop photo.", parameters: { type: "object", properties: { is_plant: { type: "boolean" }, disease: { type: "string" }, confidence: { type: "string", enum: ["low","medium","high"] }, severity: { type: "string", enum: ["none","mild","moderate","severe"] }, scientific_solution: { type: "string" }, home_remedy: { type: "string" }, prevention: { type: "string" } }, required: ["is_plant","disease","confidence","severity","scientific_solution","home_remedy","prevention"], additionalProperties: false } } }],
        tool_choice: { type: "function", function: { name: "report_diagnosis" } },
      }),
    });
    if (!aiRes.ok) {
      if (aiRes.status === 429) return res.status(200).json({ ok: false, error: "Too many requests, try again in a minute." });
      if (aiRes.status === 402) return res.status(200).json({ ok: false, error: "AI credits exhausted." });
      return res.status(200).json({ ok: false, error: "AI service error" });
    }
    const json = await aiRes.json();
    const tc = json?.choices?.[0]?.message?.tool_calls?.[0];
    if (!tc?.function?.arguments) return res.status(200).json({ ok: false, error: "No diagnosis returned" });
    return res.status(200).json({ ok: true, ...JSON.parse(tc.function.arguments) });
  } catch (e) {
    return res.status(200).json({ ok: false, error: e instanceof Error ? e.message : "Unknown error" });
  }
}
