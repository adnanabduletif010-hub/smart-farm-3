// Lightweight client-side wrappers around the /api/* endpoints.
// These replace the previous TanStack server-fn calls that referenced
// non-existent server functions.

type Lang = "en" | "om" | "am";

export type WeatherAlert = {
  type: string;
  severity: "info" | "watch" | "warning" | "danger";
  title: string;
  message: string;
};

async function postJSON<T>(url: string, body: any): Promise<T> {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.json() as Promise<T>;
}

export type WeatherResult =
  | { ok: true; data: any; place?: string; alerts?: WeatherAlert[] }
  | { ok: false; error: string };

export async function getWeather({ data }: { data: { lat: number; lon: number } }): Promise<WeatherResult> {
  return postJSON("/api/weather", data);
}

export type GuideResult = { ok: true; answer: string } | { ok: false; error: string };

export async function askCropGuide({
  data,
}: {
  data: { crop: string; question: string; lang: Lang };
  headers?: Record<string, string>;
}): Promise<GuideResult> {
  return postJSON("/api/guides", data);
}

export type ExpertAIResult = { ok: true; answer: string } | { ok: false; error: string };

export async function askAIExpert({
  data,
}: {
  data: {
    question: string;
    topic?: string;
    imageBase64?: string;
    mimeType?: string;
    lang: Lang;
  };
}): Promise<ExpertAIResult> {
  return postJSON("/api/expert-ai", data);
}

export type SoilAdviceResult =
  | { ok: true; status: string; advice: string; actions: string[] }
  | { ok: false; error: string };

export async function getSoilAdvice({
  data,
}: {
  data: { lang: Lang; reading: Record<string, number | null | undefined> };
  headers?: Record<string, string>;
}): Promise<SoilAdviceResult> {
  return postJSON("/api/iot", data);
}
