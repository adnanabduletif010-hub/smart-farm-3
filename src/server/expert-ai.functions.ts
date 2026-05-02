import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 10;
const ipHits = new Map<string, number[]>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const arr = (ipHits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (arr.length >= RATE_MAX) { ipHits.set(ip, arr); return false; }
  arr.push(now);
  ipHits.set(ip, arr);
  return true;
}

function getClientIp(): string {
  try {
    const req = getRequest();
    const h = req?.headers;
    if (!h) return "unknown";
    const fwd =
      h.get("cf-connecting-ip") ||
      h.get("x-real-ip") ||
      h.get("x-forwarded-for");
    if (fwd) return fwd.split(",")[0].trim();
  } catch {}
  return "unknown";
}

const LANG_NAME = { en: "English", om: "Afaan Oromoo", am: "Amharic" } as const;

type Input = {
  question: string;
  topic?: string;
  imageBase64?: string;
  mimeType?: string;
  lang?: "en" | "om" | "am";
};

export const askAIExpert = createServerFn({ method: "POST" })
  .inputValidator((d: Input) => {
    if (!d?.question || typeof d.question !== "string") throw new Error("question required");
    return {
      question: d.question.slice(0, 2000),
      topic: (d.topic ?? "").slice(0, 80),
      imageBase64: d.imageBase64,
      mimeType: d.mimeType ?? "image/jpeg",
      lang: (d.lang ?? "en") as "en" | "om" | "am",
    };
  })
  .handler(async ({ data }) => {
    const KEY = process.env.LOVABLE_API_KEY;
    if (!KEY) return { ok: false as const, error: "AI not configured" };

    const ip = getClientIp();
    if (!checkRateLimit(ip)) {
      return { ok: false as const, error: "Too many AI requests, please wait a few minutes." };
    }

    const lang = LANG_NAME[data.lang];
    const system = `You are an expert agronomist helping smallholder farmers.
Answer the farmer's question with practical, concise, low-cost advice.
Reply ENTIRELY in ${lang}. If a photo is attached, use it to inform the answer.
Cover: likely cause, scientific solution (with active ingredient & dosage if relevant), low-cost home remedy, and prevention.`;

    const userContent: any[] = [
      { type: "text", text: `Topic: ${data.topic || "general"}\nQuestion: ${data.question}` },
    ];
    if (data.imageBase64) {
      userContent.push({
        type: "image_url",
        image_url: { url: `data:${data.mimeType};base64,${data.imageBase64}` },
      });
    }

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: system },
            { role: "user", content: userContent },
          ],
        }),
      });
      if (!res.ok) {
        if (res.status === 429) return { ok: false as const, error: "Too many requests, try again in a minute." };
        if (res.status === 402) return { ok: false as const, error: "AI credits exhausted. Add credits in Workspace > Usage." };
        return { ok: false as const, error: "AI service error" };
      }
      const json = await res.json();
      const text = json?.choices?.[0]?.message?.content as string | undefined;
      if (!text) return { ok: false as const, error: "No answer returned" };
      return { ok: true as const, answer: text };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "Unknown error" };
    }
  });
