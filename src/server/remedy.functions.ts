import { createServerFn } from "@tanstack/react-start";

type RemedyInput = {
  disease: string;
  crop?: string;
  available: string;
  lang?: "en" | "om" | "am";
};

type RemedyResult = { ok: true; remedy: string } | { ok: false; error: string };

const LANG_NAME = { en: "English", om: "Afaan Oromoo", am: "Amharic" } as const;

export const customRemedy = createServerFn({ method: "POST" })
  .inputValidator((d: RemedyInput) => {
    if (!d?.disease || !d?.available) throw new Error("disease and available required");
    return {
      disease: d.disease.slice(0, 200),
      crop: (d.crop ?? "").slice(0, 80),
      available: d.available.slice(0, 1000),
      lang: (d.lang ?? "en") as "en" | "om" | "am",
    };
  })
  .handler(async ({ data }): Promise<RemedyResult> => {
    const KEY = process.env.LOVABLE_API_KEY;
    if (!KEY) return { ok: false, error: "AI not configured" };
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You are an expert agronomist helping a smallholder farmer treat a plant disease using ONLY items they already have at home.
Respond ENTIRELY in ${LANG_NAME[data.lang]}.
- Use ONLY the items the farmer lists. Do not require anything else.
- If the items are insufficient, say so clearly and suggest the cheapest local substitute.
- Give an exact mixing recipe (quantities, ratios, water amount), how to apply, how often, and safety notes.
- Keep it under 200 words and farmer-friendly.`,
            },
            {
              role: "user",
              content: `Crop: ${data.crop || "unknown"}
Disease/problem: ${data.disease}
Items I have at home: ${data.available}

Give me a step-by-step home remedy using only these items.`,
            },
          ],
        }),
      });
      if (!res.ok) {
        if (res.status === 429) return { ok: false, error: "Too many requests" };
        if (res.status === 402) return { ok: false, error: "AI credits exhausted" };
        return { ok: false, error: "AI service error" };
      }
      const json = await res.json();
      const remedy = json?.choices?.[0]?.message?.content;
      if (!remedy) return { ok: false, error: "Empty answer" };
      return { ok: true, remedy };
    } catch (e) {
      console.error("customRemedy failed", e);
      return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
    }
  });
