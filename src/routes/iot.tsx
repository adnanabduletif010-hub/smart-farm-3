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
import { getSoilAdvice } from "@/lib/api-helpers";

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

  async function remove(id: string) {
    if (!user) return;
    const { error } = await supabase.from("soil_readings").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setReadings((r) => r.filter((x) => x.id !== id));
  }

  return (
    <AppShell title={t("iot.title")} subtitle={t("iot.subtitle")}>
      <div className="flex flex-wrap gap-2 mb-3 justify-end">
        <DeviceSetupDialog user={user} />
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
                    {r.source === "device" ? <Radio className="h-4 w-4" /> : r.source === "simulated" ? <Cpu className="h-4 w-4" /> : <Droplets className="h-4 w-4" />}
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

type DeviceToken = {
  id: string;
  device_name: string;
  field_name: string | null;
  token: string;
  created_at: string;
  last_used_at: string | null;
};

function DeviceSetupDialog({ user }: { user: any }) {
  const [open, setOpen] = useState(false);
  const [tokens, setTokens] = useState<DeviceToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [fieldName, setFieldName] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const ingestUrl =
    typeof window !== "undefined" ? `${window.location.origin}/api/public/iot/ingest` : "";

  async function load() {
    if (!user) return;
    const { data } = await supabase
      .from("iot_device_tokens")
      .select("*")
      .order("created_at", { ascending: false });
    setTokens((data ?? []) as DeviceToken[]);
  }

  useEffect(() => {
    if (open) load();
  }, [open, user?.id]);

  function genToken() {
    const arr = new Uint8Array(24);
    crypto.getRandomValues(arr);
    return "iot_" + Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
  }

  async function create() {
    if (!user) return toast.error("Please sign in.");
    if (!deviceName.trim()) return toast.error("Device name required");
    setLoading(true);
    const { error } = await supabase.from("iot_device_tokens").insert({
      user_id: user.id,
      device_name: deviceName.trim(),
      field_name: fieldName.trim() || null,
      token: genToken(),
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Device registered");
    setDeviceName("");
    setFieldName("");
    load();
  }

  async function remove(id: string) {
    const { error } = await supabase.from("iot_device_tokens").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setTokens((t) => t.filter((x) => x.id !== id));
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="rounded-full h-9"
        onClick={() => setOpen(true)}
      >
        <Radio className="h-4 w-4 mr-1.5" /> Connect device
      </Button>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <Card
            className="w-full max-w-lg p-5 border-0 shadow-glow animate-scale-in max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-1">Connect a real sensor</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Register your ESP32, Arduino, or Raspberry Pi to send live readings to FarmBridge.
            </p>

            <div className="space-y-2.5 mb-5">
              <div className="grid grid-cols-2 gap-2.5">
                <Field label="Device name" value={deviceName} onChange={setDeviceName} placeholder="ESP32 #1" />
                <Field label="Field name" value={fieldName} onChange={setFieldName} placeholder="North field" />
              </div>
              <Button
                onClick={create}
                disabled={loading}
                className="w-full rounded-full gradient-primary text-primary-foreground border-0"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate device token"}
              </Button>
            </div>

            {tokens.length > 0 && (
              <>
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Your devices
                </h4>
                <div className="space-y-2 mb-4">
                  {tokens.map((tk) => {
                    const curl = `curl -X POST ${ingestUrl} \\
  -H "Content-Type: application/json" \\
  -H "X-Device-Token: ${tk.token}" \\
  -d '{"moisture":42,"nitrogen":35,"phosphorus":22,"potassium":110,"ph":6.5,"temperature":24.5}'`;
                    return (
                      <div key={tk.id} className="rounded-xl border bg-accent/30 p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-bold truncate">{tk.device_name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {tk.field_name ?? "—"} · last used:{" "}
                              {tk.last_used_at ? new Date(tk.last_used_at).toLocaleString() : "never"}
                            </p>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 rounded-full text-muted-foreground hover:text-destructive"
                            onClick={() => remove(tk.id)}
                            aria-label="delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <code className="flex-1 text-[10px] bg-background rounded px-2 py-1 truncate font-mono">
                            {tk.token}
                          </code>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 rounded-full"
                            onClick={() => copy(tk.token, `t-${tk.id}`)}
                          >
                            {copied === `t-${tk.id}` ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                        <details className="text-[11px]">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            Show example request
                          </summary>
                          <div className="relative mt-1.5">
                            <pre className="text-[10px] bg-background rounded p-2 overflow-x-auto font-mono whitespace-pre">
{curl}
                            </pre>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 rounded absolute top-1 right-1"
                              onClick={() => copy(curl, `c-${tk.id}`)}
                            >
                              {copied === `c-${tk.id}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            </Button>
                          </div>
                        </details>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <div className="rounded-xl bg-accent/40 p-3 text-[11px] text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">Endpoint</p>
              <code className="block bg-background rounded px-2 py-1 font-mono text-[10px] break-all">
                POST {ingestUrl}
              </code>
              <p className="mt-2">
                Send <code className="font-mono">moisture</code>, <code className="font-mono">nitrogen</code>,{" "}
                <code className="font-mono">phosphorus</code>, <code className="font-mono">potassium</code>,{" "}
                <code className="font-mono">ph</code>, <code className="font-mono">temperature</code> as JSON
                with header <code className="font-mono">X-Device-Token</code>.
              </p>
            </div>

            <Button
              variant="ghost"
              className="w-full mt-4 rounded-full"
              onClick={() => setOpen(false)}
            >
              Close
            </Button>
          </Card>
        </div>
      )}
    </>
  );
}
