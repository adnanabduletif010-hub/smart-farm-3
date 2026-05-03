import type { VercelRequest, VercelResponse } from "@vercel/node";

async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const r = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&count=1&language=en&format=json`);
    if (!r.ok) return null;
    const j = await r.json();
    const first = j?.results?.[0];
    if (!first) return null;
    return [first.name, first.admin1, first.country].filter(Boolean).join(", ");
  } catch { return null; }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { lat, lon } = req.body ?? {};
  if (typeof lat !== "number" || typeof lon !== "number") return res.status(400).json({ ok: false, error: "lat/lon required" });

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&timezone=auto&forecast_days=14`;
    const [wRes, place] = await Promise.all([fetch(url), reverseGeocode(lat, lon)]);
    if (!wRes.ok) return res.status(200).json({ ok: false, error: "weather fetch failed" });
    const data = await wRes.json();
    return res.status(200).json({ ok: true, data, place, alerts: [] });
  } catch (e) {
    return res.status(200).json({ ok: false, error: e instanceof Error ? e.message : "error" });
  }
}
