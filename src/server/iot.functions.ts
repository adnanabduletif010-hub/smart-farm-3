import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type AdviceInput = {
  lang?: "en" | "om" | "am";
  reading: {
    crop?: string;
    moisture?: number | null;
    nitrogen?: number | null;
    phosphorus?: number | null;
    potassium?: number | null;
    ph?: number | null;
    temperature?: number | null;
  };
};

type AdviceResult =
  | { ok: true; status: string; advice: string; actions: string[] }
  | { ok: false; error: string };

const LANG_NAME = { en: "English", om: "Afaan Oromoo", am: "Amharic" } as const;

export const getSoilAdvice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: AdviceInput) => {
    if (!d?.reading) throw new Error("reading required");
    return {
      lang: (d.lang ?? "en") as "en" | "om" | "am",
      reading: d.reading,
    };
  })
  .handler(async ({ data }): Promise<AdviceResult> => {
    const KEY = process.env.LOVABLE_API_KEY;
    if (!KEY) return { ok: false, error: "AI not configured" };

    const r = data.reading;
    const summary = [
      r.crop ? `Crop: ${r.crop}` : null,
      r.moisture != null ? `Soil moisture: ${r.moisture}%` : null,
      r.nitrogen != null ? `Nitrogen (N): ${r.nitrogen} mg/kg` : null,
      r.phosphorus != null ? `Phosphorus (P): ${r.phosphorus} mg/kg` : null,
      r.potassium != null ? `Potassium (K): ${r.potassium} mg/kg` : null,
      r.ph != null ? `Soil pH: ${r.ph}` : null,
      r.temperature != null ? `Soil temperature: ${r.temperature}°C` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const SYSTEM = `You are an expert agronomist advising smallholder farmers in Ethiopia.
Given soil sensor readings, return concise, practical advice ENTIRELY in ${LANG_NAME[data.lang]}.
Always call the function 'soil_advice'. Mention low-cost actions farmers can do themselves
(compost, mulching, intercropping, irrigation timing, organic fertilizer alternatives).`;

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM },
            { role: "user", content: `Soil readings:\n${summary}\n\nGive farming advice.` },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "soil_advice",
                description: "Return structured soil advice.",
                parameters: {
                  type: "object",
                  properties: {
                    status: {
                      type: "string",
                      description: "One-line overall status (e.g. 'Soil too dry', 'Healthy', 'Low nitrogen').",
                    },
                    advice: {
                      type: "string",
                      description: "2-4 sentence farmer-friendly explanation.",
                    },
                    actions: {
                      type: "array",
                      items: { type: "string" },
                      description: "3-5 concrete, low-cost action items.",
                    },
                  },
                  required: ["status", "advice", "actions"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "soil_advice" } },
        }),
      });

      if (!res.ok) {
        if (res.status === 429) return { ok: false, error: "Too many requests, try again soon." };
        if (res.status === 402) return { ok: false, error: "AI credits exhausted." };
        return { ok: false, error: "AI service error" };
      }
      const json = await res.json();
      const tc = json?.choices?.[0]?.message?.tool_calls?.[0];
      if (!tc?.function?.arguments) return { ok: false, error: "No advice returned" };
      const args = JSON.parse(tc.function.arguments);
      return { ok: true, ...args };
    } catch (e) {
      console.error("getSoilAdvice failed", e);
      return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
    }
  });
