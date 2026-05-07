import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { lat, lon } = req.body ?? {};
  if (!lat || !lon) return res.status(400).json({ ok: false, error: "lat and lon required" });

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&timezone=auto&forecast_days=14`;
    
    const wRes = await fetch(url);
    const data = await wRes.json();
    
    const geoUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    const geoRes = await fetch(geoUrl, { headers: { "User-Agent": "FarmBridgeApp/1.0" } });
    const geoData = await geoRes.json();
    const place = geoData.display_name?.split(",")[0] || "Your location";

    const alerts = [];
    if (data.current.temperature_2m > 30) {
      alerts.push({ type: "heat", severity: "warning", title: "High Temperature", message: "Drink water and protect your crops from heat stress." });
    }
    if (data.daily.precipitation_sum[0] > 10) {
      alerts.push({ type: "rain", severity: "watch", title: "Heavy Rain Expected", message: "Ensure proper drainage in your fields." });
    }

    return res.status(200).json({ ok: true, data, place, alerts });
  } catch (e: any) {
    console.error("Weather error", e);
    return res.status(500).json({ ok: false, error: e.message });
  }
}
