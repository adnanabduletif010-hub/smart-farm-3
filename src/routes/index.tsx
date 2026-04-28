import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import {
  Leaf, ShoppingBag, BookOpen, MessageCircle,
  CloudSun, Sparkles, ArrowRight, TrendingUp,
  Droplets, Sprout, AlertTriangle, MapPin,
} from "lucide-react";
import heroImg from "@/assets/farm-hero.jpg";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getWeather, type WeatherAlert } from "@/server/weather.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FarmBridge — Home" },
      { name: "description", content: "Your daily farming companion: AI diagnosis, weather, market and experts." },
    ],
  }),
  component: Home,
});

function Home() {
  const { t } = useTranslation();
  const [weather, setWeather] = useState<any>(null);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [weatherPlace, setWeatherPlace] = useState<string>("");
  const [geoStatus, setGeoStatus] = useState<"idle" | "asking" | "denied" | "loading" | "ready" | "error">("asking");

  async function loadFor(lat: number, lon: number) {
    setGeoStatus("loading");
    const r = await getWeather({ data: { lat, lon } });
    if (r.ok) {
      setWeather(r.data);
      setAlerts(r.alerts ?? []);
      setWeatherPlace(r.place ?? "Your location");
      setGeoStatus("ready");
    } else {
      setGeoStatus("error");
    }
  }

  function requestLocation() {
    if (!("geolocation" in navigator)) {
      setGeoStatus("denied");
      return;
    }
    setGeoStatus("asking");
    navigator.geolocation.getCurrentPosition(
      (pos) => loadFor(pos.coords.latitude, pos.coords.longitude),
      () => setGeoStatus("denied"),
      { timeout: 8000, enableHighAccuracy: true },
    );
  }

  useEffect(() => { requestLocation(); }, []);

  const weatherCodeLabel = (code?: number) => {
    if (code == null) return "";
    if (code === 0) return "Clear sky";
    if ([1, 2, 3].includes(code)) return "Partly cloudy";
    if ([45, 48].includes(code)) return "Foggy";
    if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Rain";
    if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
    if ([95, 96, 99].includes(code)) return "Thunderstorm";
    return "Cloudy";
  };

  const severityClass = (s: WeatherAlert["severity"]) =>
    s === "danger" ? "bg-destructive/15 border-destructive/40 text-destructive"
    : s === "warning" ? "bg-sun/20 border-sun/40 text-earth"
    : s === "watch" ? "bg-accent border-border text-foreground"
    : "bg-leaf/15 border-leaf/40 text-primary";

  const features = [
    { to: "/diagnose", icon: Leaf, title: t("home.diagnose"), desc: t("home.diagnoseDesc"), color: "from-leaf to-primary" },
    { to: "/iot", icon: Droplets, title: t("home.iot"), desc: t("home.iotDesc"), color: "from-primary to-leaf" },
    { to: "/guides", icon: Sprout, title: t("home.guides"), desc: t("home.guidesDesc"), color: "from-leaf to-earth" },
    { to: "/market", icon: ShoppingBag, title: t("home.market"), desc: t("home.marketDesc"), color: "from-sun to-earth" },
    { to: "/research", icon: BookOpen, title: t("home.research"), desc: t("home.researchDesc"), color: "from-primary to-primary-glow" },
    { to: "/experts", icon: MessageCircle, title: t("home.experts"), desc: t("home.expertsDesc"), color: "from-earth to-primary" },
  ] as const;

  return (
    <AppShell>
      <section className="relative overflow-hidden rounded-3xl shadow-glow animate-scale-in">
        <img src={heroImg} alt="Sunrise over green farm fields" width={1536} height={1024} className="w-full h-48 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 backdrop-blur px-2.5 py-1 text-[11px] font-semibold text-primary mb-2">
            <Sparkles className="h-3 w-3" /> {t("common.poweredByAI")}
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight leading-tight whitespace-pre-line">
            {t("home.heroTitle")}
          </h1>
        </div>
      </section>

      <Link to="/iot" className="block mt-4">
        <Card className="p-4 border-0 shadow-soft bg-gradient-to-br from-card to-accent/30 animate-fade-up">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-sun shadow-soft">
              <CloudSun className="h-6 w-6 text-sun-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                {t("home.todayWeather")} · {weatherPlace}
              </p>
              {weather?.current ? (
                <>
                  <p className="text-base font-bold leading-tight">
                    {Math.round(weather.current.temperature_2m)}°C ·{" "}
                    <span className="font-semibold">{weatherCodeLabel(weather.current.weather_code)}</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Humidity {weather.current.relative_humidity_2m}% · Wind {Math.round(weather.current.wind_speed_10m)} km/h
                    {typeof weather.current.precipitation === "number" && weather.current.precipitation > 0
                      ? ` · Rain ${weather.current.precipitation} mm`
                      : ""}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Loading weather…</p>
              )}
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </Card>
      </Link>

      <section className="mt-5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1 mb-2.5">
          {t("home.quickActions")}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {features.map((f, i) => (
            <Link
              key={f.to}
              to={f.to}
              className="group animate-fade-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <Card className="relative overflow-hidden p-4 border-0 shadow-soft h-full transition-all duration-300 group-hover:shadow-glow group-active:scale-[0.97]">
                <div className={`absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${f.color} opacity-20 blur-xl transition-all group-hover:opacity-40 group-hover:scale-125`} />
                <div className={`relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${f.color} shadow-soft mb-3`}>
                  <f.icon className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
                </div>
                <p className="text-sm font-bold leading-tight">{f.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{f.desc}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <Link to="/market" className="block mt-5">
        <Card className="p-4 border-0 shadow-soft gradient-primary text-primary-foreground animate-fade-up">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] uppercase tracking-wider opacity-80 font-semibold">
                {t("home.marketPulse")}
              </p>
              <p className="text-base font-bold leading-tight">{t("home.seePrices")}</p>
            </div>
            <ArrowRight className="h-4 w-4" />
          </div>
        </Card>
      </Link>

      <p className="text-center text-[11px] text-muted-foreground mt-6">{t("home.footer")}</p>
    </AppShell>
  );
}
