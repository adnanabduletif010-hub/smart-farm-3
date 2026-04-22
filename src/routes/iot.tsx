import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Droplets, Cpu, Sparkles, Trash2, Plus, Radio, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { getSoilAdvice } from "@/server/iot.functions";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/iot")({
  head: () => ({
    meta: [
      { title: "Smart Soil — FarmBridge" },
      {
        name: "description",
        content: "Log soil moisture and nutrient sensor readings, see trends and get AI farming advice.",
      },
    ],
  }),
  component: IoTPage,
});

type Reading = {
  id: string;
  user_id: string | null;
  device_name: string | null;
  field_name: string | null;
  moisture: number | null;
  nitrogen: number | null;
  phosphorus: number | null;
  potassium: number | null;
  ph: number | null;
  temperature: number | null;
  notes: string | null;
  source: string;
  created_at: string;
};

function IoTPage() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [advice, setAdvice] = useState<{ status: string; advice: string; actions: string[] } | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);

  async function load() {
    setLoading(true);
    const q = supabase
      .from("soil_readings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    const { data } = user ? await q.eq("user_id", user.id) : await q.is("user_id", null);
    setReadings((data ?? []) as Reading[]);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, [user?.id]);

  const chartData = useMemo(
    () =>
      [...readings]
        .reverse()
        .map((r) => ({
          time: new Date(r.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
          moisture: r.moisture,
          ph: r.ph,
        })),
    [readings],
  );

  async function askAdvice() {
    if (readings.length === 0) return toast.error(t("iot.noReadings"));
    if (!user) return toast.error("Please sign in to get AI advice.");
    const r = readings[0];
    setAdviceLoading(true);
    setAdvice(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) {
        setAdviceLoading(false);
        return toast.error("Please sign in to get AI advice.");
      }
      const res = await getSoilAdvice({
        data: {
          lang: i18n.language as "en" | "om" | "am",
          reading: {
            moisture: r.moisture,
            nitrogen: r.nitrogen,
            phosphorus: r.phosphorus,
            potassium: r.potassium,
            ph: r.ph,
            temperature: r.temperature,
          },
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      setAdviceLoading(false);
      if (!res.ok) return toast.error(res.error);
      setAdvice({ status: res.status, advice: res.advice, actions: res.actions });
    } catch (e) {
      setAdviceLoading(false);
      const msg = e instanceof Error ? e.message : "Failed to get advice";
      toast.error(msg);
    }
  }

  async function simulate() {
    if (!user) return toast.error("Please sign in to save sensor readings.");
    // Realistic scenarios a smallholder farm might encounter
    const scenarios = [
      { name: "Healthy loam", field: "North field", moisture: [45, 60], n: [40, 60], p: [25, 40], k: [120, 160], ph: [6.2, 6.8], temp: [20, 26] },
      { name: "Dry spell", field: "West field", moisture: [12, 22], n: [25, 40], p: [15, 25], k: [80, 110], ph: [6.0, 7.0], temp: [27, 33] },
      { name: "Low nitrogen", field: "Maize plot", moisture: [35, 50], n: [8, 18], p: [20, 35], k: [100, 140], ph: [6.0, 6.8], temp: [21, 27] },
      { name: "Acidic soil", field: "South slope", moisture: [40, 55], n: [30, 45], p: [10, 20], k: [70, 100], ph: [4.8, 5.4], temp: [19, 24] },
      { name: "Waterlogged", field: "Lowland plot", moisture: [78, 92], n: [20, 35], p: [15, 25], k: [90, 120], ph: [6.5, 7.2], temp: [18, 22] },
    ];
    const s = scenarios[Math.floor(Math.random() * scenarios.length)];
    const rand = ([a, b]: number[], decimals = 0) => +(a + Math.random() * (b - a)).toFixed(decimals);

    const reading = {
      user_id: user.id,
      device_name: `FarmBridge Sensor ${String.fromCharCode(65 + Math.floor(Math.random() * 4))}`,
      field_name: s.field,
      moisture: rand(s.moisture),
      nitrogen: rand(s.n),
      phosphorus: rand(s.p),
      potassium: rand(s.k),
      ph: rand(s.ph, 1),
      temperature: rand(s.temp, 1),
      notes: `Simulated: ${s.name}`,
      source: "simulated",
    };
    const { error } = await supabase.from("soil_readings").insert(reading);
    if (error) return toast.error(error.message);
    toast.success(`${t("iot.saved")} — ${s.name}`);
    load();
  }

  async function remove(id: string) {
    if (!user) return;
    const { error } = await supabase.from("soil_readings").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setReadings((r) => r.filter((x) => x.id !== id));
  }

  return (
    <AppShell title={t("iot.title")} subtitle={t("iot.subtitle")}>
      <div className="flex flex-wrap gap-2 mb-3 justify-end">
        <Button
          size="sm"
          variant="outline"
          className="rounded-full h-9"
          onClick={simulate}
        >
          <Zap className="h-4 w-4 mr-1.5" /> {t("iot.simulate")}
        </Button>
        <AddReadingDialog user={user} onAdded={load} />
      </div>

      {chartData.length >= 2 && (
        <Card className="p-3 border-0 shadow-soft mb-3 animate-fade-up">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold px-1 mb-1">
            {t("iot.chartTitle")}
          </p>
          <div className="h-40 w-full">
            <ResponsiveContainer>
              <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="m" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" opacity={0.2} />
                <XAxis dataKey="time" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="moisture"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#m)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <Card className="p-4 border-0 shadow-soft gradient-primary text-primary-foreground mb-3 animate-fade-up">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-wider opacity-80 font-semibold">
              {t("iot.aiAdvice")}
            </p>
            {advice ? (
              <>
                <p className="text-sm font-bold mt-0.5">{advice.status}</p>
                <p className="text-xs opacity-90 mt-1 whitespace-pre-line">{advice.advice}</p>
                <ul className="mt-2 space-y-1">
                  {advice.actions.map((a, i) => (
                    <li key={i} className="text-xs flex gap-1.5">
                      <span className="opacity-80">•</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-xs opacity-90 mt-0.5">
                {readings.length === 0
                  ? t("iot.noReadings")
                  : "Tap to get tailored advice from your latest reading."}
              </p>
            )}
            <Button
              size="sm"
              variant="secondary"
              className="mt-3 rounded-full h-8 text-xs"
              onClick={askAdvice}
              disabled={adviceLoading || readings.length === 0}
            >
              {adviceLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> {t("iot.thinking")}
                </>
              ) : (
                t("iot.getAdvice")
              )}
            </Button>
          </div>
        </div>
      </Card>

      <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1 mt-4 mb-2">
        {t("iot.history")}
      </h2>
      {loading ? (
        <div className="py-10 text-center">
          <Loader2 className="h-5 w-5 mx-auto animate-spin text-muted-foreground" />
        </div>
      ) : readings.length === 0 ? (
        <Card className="p-8 text-center border-0 shadow-soft">
          <Droplets className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">{t("iot.noReadings")}</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {readings.map((r, i) => (
            <Card
              key={r.id}
              className="p-3 border-0 shadow-soft animate-fade-up"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-leaf/20 text-primary">
                    {r.source === "simulated" ? <Cpu className="h-4 w-4" /> : <Droplets className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">
                      {r.field_name ?? "Unnamed"}{" "}
                      <span className="text-[10px] font-normal text-muted-foreground">
                        · {r.device_name ?? r.source}
                      </span>
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                {user && r.user_id === user.id && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 rounded-full text-muted-foreground hover:text-destructive"
                    onClick={() => remove(r.id)}
                    aria-label="delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-1.5 mt-2 text-center">
                <Stat label={t("iot.moisture")} value={r.moisture} unit="%" />
                <Stat label="N" value={r.nitrogen} />
                <Stat label="P" value={r.phosphorus} />
                <Stat label="K" value={r.potassium} />
                <Stat label="pH" value={r.ph} />
                <Stat label={t("iot.temperature")} value={r.temperature} unit="°C" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}

function Stat({ label, value, unit }: { label: string; value: number | null; unit?: string }) {
  return (
    <div className="bg-accent/40 rounded-lg py-1.5">
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
      <p className="text-xs font-bold">
        {value == null ? "—" : value}
        {value != null && unit ? <span className="text-muted-foreground font-normal">{unit}</span> : null}
      </p>
    </div>
  );
}

function AddReadingDialog({ user, onAdded }: { user: any; onAdded: () => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [f, setF] = useState({
    field_name: "",
    device_name: "",
    moisture: "",
    nitrogen: "",
    phosphorus: "",
    potassium: "",
    ph: "",
    temperature: "",
    notes: "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const num = (s: string) => (s === "" ? null : Number(s));
    const { error } = await supabase.from("soil_readings").insert({
      user_id: user?.id ?? null,
      field_name: f.field_name || null,
      device_name: f.device_name || null,
      moisture: num(f.moisture),
      nitrogen: num(f.nitrogen),
      phosphorus: num(f.phosphorus),
      potassium: num(f.potassium),
      ph: num(f.ph),
      temperature: num(f.temperature),
      notes: f.notes || null,
      source: "manual",
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(t("iot.saved"));
    setOpen(false);
    setF({
      field_name: "",
      device_name: "",
      moisture: "",
      nitrogen: "",
      phosphorus: "",
      potassium: "",
      ph: "",
      temperature: "",
      notes: "",
    });
    onAdded();
  }

  return (
    <>
      <Button
        size="sm"
        className="rounded-full gradient-primary text-primary-foreground border-0 shadow-soft h-9"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-4 w-4 mr-1" /> {t("iot.addReading")}
      </Button>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <Card
            className="w-full max-w-md p-5 border-0 shadow-glow animate-scale-in max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-3">{t("iot.addReading")}</h3>
            <form onSubmit={submit} className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2.5">
                <Field label={t("iot.fieldName")} value={f.field_name} onChange={(v) => setF({ ...f, field_name: v })} placeholder={t("iot.fieldPlaceholder")} />
                <Field label={t("iot.deviceName")} value={f.device_name} onChange={(v) => setF({ ...f, device_name: v })} placeholder={t("iot.devicePlaceholder")} />
                <Field label={`${t("iot.moisture")} (%)`} value={f.moisture} onChange={(v) => setF({ ...f, moisture: v })} type="number" />
                <Field label="pH" value={f.ph} onChange={(v) => setF({ ...f, ph: v })} type="number" />
                <Field label="N (mg/kg)" value={f.nitrogen} onChange={(v) => setF({ ...f, nitrogen: v })} type="number" />
                <Field label="P (mg/kg)" value={f.phosphorus} onChange={(v) => setF({ ...f, phosphorus: v })} type="number" />
                <Field label="K (mg/kg)" value={f.potassium} onChange={(v) => setF({ ...f, potassium: v })} type="number" />
                <Field label={`${t("iot.temperature")} (°C)`} value={f.temperature} onChange={(v) => setF({ ...f, temperature: v })} type="number" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("iot.notes")}</Label>
                <Textarea rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="ghost" className="flex-1 rounded-full" onClick={() => setOpen(false)}>
                  {t("common.cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-full gradient-primary text-primary-foreground border-0"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.save")}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input
        type={type}
        inputMode={type === "number" ? "decimal" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9"
      />
    </div>
  );
}
