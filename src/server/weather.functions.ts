import { createServerFn } from "@tanstack/react-start";

type WeatherInput = { lat: number; lon: number };

export type WeatherAlert = {
  severity: "info" | "watch" | "warning" | "danger";
  type: "heatwave" | "frost" | "heavy_rain" | "storm" | "snow" | "drought" | "high_wind" | "fog";
  title: string;
  message: string;
};

function buildAlerts(j: any): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  const cur = j?.current ?? {};
  const daily = j?.daily ?? {};
  const code = cur.weather_code as number | undefined;
  const wind = cur.wind_speed_10m as number | undefined;
  const temp = cur.temperature_2m as number | undefined;
  const maxTemps: number[] = daily.temperature_2m_max ?? [];
  const minTemps: number[] = daily.temperature_2m_min ?? [];
  const rain: number[] = daily.precipitation_sum ?? [];
  const codes: number[] = daily.weather_code ?? [];

  // Storm / thunderstorm
  if (code != null && [95, 96, 99].includes(code)) {
    alerts.push({ severity: "danger", type: "storm", title: "Thunderstorm now", message: "Move livestock to shelter, secure tools and avoid open fields." });
  } else if (codes.slice(0, 2).some((c) => [95, 96, 99].includes(c))) {
    alerts.push({ severity: "warning", type: "storm", title: "Thunderstorms expected", message: "Storms forecast in the next 48 hours. Plan field work accordingly." });
  }

  // Snow
  if (code != null && [71, 73, 75, 77, 85, 86].includes(code)) {
    alerts.push({ severity: "warning", type: "snow", title: "Snow / hail now", message: "Cover seedlings; protect tender crops from cold damage." });
  }

  // Heavy rain — daily sum > 25mm
  const heavyDay = rain.findIndex((r) => r >= 25);
  if (heavyDay >= 0) {
    alerts.push({
      severity: heavyDay === 0 ? "danger" : "warning",
      type: "heavy_rain",
      title: heavyDay === 0 ? "Heavy rain today" : `Heavy rain in ${heavyDay} day(s)`,
      message: `Expect ~${Math.round(rain[heavyDay])} mm. Risk of flooding, soil erosion and runoff. Clear drainage and delay fertilizer.`,
    });
  }

  // Drought — 5 days near zero rain and high temps
  if (rain.length >= 5 && rain.slice(0, 5).every((r) => r < 1) && maxTemps.slice(0, 5).every((t) => t >= 28)) {
    alerts.push({ severity: "warning", type: "drought", title: "Dry spell ahead", message: "No meaningful rain for 5 days with hot weather. Mulch beds and irrigate early morning." });
  }

  // Heatwave — max ≥ 35°C two days running
  if (maxTemps.slice(0, 3).filter((t) => t >= 35).length >= 2) {
    alerts.push({ severity: "warning", type: "heatwave", title: "Heatwave warning", message: "Temperatures above 35°C expected. Shade greenhouses, water deeply, watch livestock for heat stress." });
  }

  // Frost — min ≤ 2°C
  const frostDay = minTemps.findIndex((t) => t <= 2);
  if (frostDay >= 0) {
    alerts.push({
      severity: minTemps[frostDay] <= 0 ? "danger" : "warning",
      type: "frost",
      title: minTemps[frostDay] <= 0 ? "Frost expected" : "Cold night ahead",
      message: `Lows near ${Math.round(minTemps[frostDay])}°C in ${frostDay} day(s). Cover seedlings, smudge if possible.`,
    });
  }

  // High wind
  if (wind != null && wind >= 40) {
    alerts.push({ severity: wind >= 60 ? "danger" : "warning", type: "high_wind", title: "Strong winds", message: `Winds ${Math.round(wind)} km/h. Stake tall plants, secure greenhouses and loose materials.` });
  }

  // Fog
  if (code != null && [45, 48].includes(code)) {
    alerts.push({ severity: "info", type: "fog", title: "Foggy conditions", message: "Damp leaves favour fungal disease — delay overhead watering." });
  }

  return alerts;
}

async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const r = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&count=1&language=en&format=json`);
    if (!r.ok) return null;
    const j = await r.json();
    const first = j?.results?.[0];
    if (!first) return null;
    return [first.name, first.admin1, first.country].filter(Boolean).join(", ");
  } catch {
    return null;
  }
}

export const getWeather = createServerFn({ method: "POST" })
  .inputValidator((d: WeatherInput) => {
    if (typeof d?.lat !== "number" || typeof d?.lon !== "number") throw new Error("lat/lon required");
    return { lat: d.lat, lon: d.lon };
  })
  .handler(async ({ data }) => {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${data.lat}&longitude=${data.lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&timezone=auto&forecast_days=14`;
      const [wRes, place] = await Promise.all([fetch(url), reverseGeocode(data.lat, data.lon)]);
      if (!wRes.ok) return { ok: false as const, error: "weather fetch failed" };
      const j = await wRes.json();
      const alerts = buildAlerts(j);
      return { ok: true as const, data: j, place, alerts };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "error" };
    }
  });
