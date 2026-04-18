import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import {
  Leaf, ShoppingBag, BookOpen, MessageCircle,
  CloudSun, Sparkles, ArrowRight, TrendingUp,
} from "lucide-react";
import heroImg from "@/assets/farm-hero.jpg";
import { useEffect, useState } from "react";
import { getWeather } from "@/server/weather.functions";

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
  const [weather, setWeather] = useState<any>(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const r = await getWeather({ data: { lat: pos.coords.latitude, lon: pos.coords.longitude } });
        if (r.ok) setWeather(r.data);
      },
      () => {},
      { timeout: 6000 },
    );
  }, []);

  const features = [
    { to: "/diagnose", icon: Leaf, title: "AI Plant Doctor", desc: "Snap a leaf, get diagnosis", color: "from-leaf to-primary" },
    { to: "/market", icon: ShoppingBag, title: "Marketplace", desc: "Buy & sell, see prices", color: "from-sun to-earth" },
    { to: "/research", icon: BookOpen, title: "Research Feed", desc: "Latest agronomy studies", color: "from-primary to-primary-glow" },
    { to: "/experts", icon: MessageCircle, title: "Ask Experts", desc: "Chat with agronomists", color: "from-earth to-primary" },
  ] as const;

  return (
    <AppShell>
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl shadow-glow animate-scale-in">
        <img
          src={heroImg}
          alt="Sunrise over green farm fields"
          width={1536}
          height={1024}
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 backdrop-blur px-2.5 py-1 text-[11px] font-semibold text-primary mb-2">
            <Sparkles className="h-3 w-3" /> Powered by AI
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight leading-tight">
            Grow smarter,<br />together.
          </h1>
        </div>
      </section>

      {/* Weather */}
      <Link to="/diagnose" className="block mt-4">
        <Card className="p-4 border-0 shadow-soft bg-gradient-to-br from-card to-accent/30 animate-fade-up">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-sun shadow-soft">
              <CloudSun className="h-6 w-6 text-sun-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                Today's weather
              </p>
              {weather?.current ? (
                <p className="text-base font-bold leading-tight">
                  {Math.round(weather.current.temperature_2m)}°C ·{" "}
                  <span className="text-muted-foreground font-normal">
                    {weather.current.relative_humidity_2m}% humidity
                  </span>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Allow location to see weather</p>
              )}
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </Card>
      </Link>

      {/* Feature grid */}
      <section className="mt-5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1 mb-2.5">
          Quick actions
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
                <div
                  className={`absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${f.color} opacity-20 blur-xl transition-all group-hover:opacity-40 group-hover:scale-125`}
                />
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

      {/* Market pulse */}
      <Link to="/market" className="block mt-5">
        <Card className="p-4 border-0 shadow-soft gradient-primary text-primary-foreground animate-fade-up">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] uppercase tracking-wider opacity-80 font-semibold">
                Market pulse
              </p>
              <p className="text-base font-bold leading-tight">See current prices & buyers</p>
            </div>
            <ArrowRight className="h-4 w-4" />
          </div>
        </Card>
      </Link>

      <p className="text-center text-[11px] text-muted-foreground mt-6">
        Built with 🌱 for farmers, by FarmBridge
      </p>
    </AppShell>
  );
}
