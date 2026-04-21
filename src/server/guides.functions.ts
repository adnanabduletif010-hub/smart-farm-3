import { createServerFn } from "@tanstack/react-start";

type AskInput = {
  crop: string;
  question: string;
  lang?: "en" | "om" | "am";
};

type AskResult = { ok: true; answer: string } | { ok: false; error: string };

const LANG_NAME = { en: "English", om: "Afaan Oromoo", am: "Amharic" } as const;

export const askCropGuide = createServerFn({ method: "POST" })
  .inputValidator((d: AskInput) => {
    if (!d?.crop || !d?.question) throw new Error("crop and question required");
    return {
      crop: d.crop.slice(0, 80),
      question: d.question.slice(0, 1000),
      lang: (d.lang ?? "en") as "en" | "om" | "am",
    };
  })
  .handler(async ({ data }): Promise<AskResult> => {
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
              content: `You are an expert agronomist for smallholder farmers in Ethiopia.
Answer ENTIRELY in ${LANG_NAME[data.lang]}. Be practical, scientific yet simple.
Cover spacing, soil prep, fertilizer (incl. organic options), water, pest/disease prevention,
and harvest timing when relevant. Keep answers under 250 words.`,
            },
            { role: "user", content: `Crop: ${data.crop}\nQuestion: ${data.question}` },
          ],
        }),
      });
      if (!res.ok) {
        if (res.status === 429) return { ok: false, error: "Too many requests" };
        if (res.status === 402) return { ok: false, error: "AI credits exhausted" };
        return { ok: false, error: "AI service error" };
      }
      const json = await res.json();
      const answer = json?.choices?.[0]?.message?.content;
      if (!answer) return { ok: false, error: "Empty answer" };
      return { ok: true, answer };
    } catch (e) {
      console.error("askCropGuide failed", e);
      return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
    }
  });
