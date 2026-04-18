import { createServerFn } from "@tanstack/react-start";

type WeatherInput = { lat: number; lon: number };

export const getWeather = createServerFn({ method: "POST" })
  .inputValidator((d: WeatherInput) => {
    if (typeof d?.lat !== "number" || typeof d?.lon !== "number") throw new Error("lat/lon required");
    return { lat: d.lat, lon: d.lon };
  })
  .handler(async ({ data }) => {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${data.lat}&longitude=${data.lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=5`;
      const r = await fetch(url);
      if (!r.ok) return { ok: false as const, error: "weather fetch failed" };
      const j = await r.json();
      return { ok: true as const, data: j };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "error" };
    }
  });
