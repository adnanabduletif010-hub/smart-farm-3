import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Upload, Loader2, Sparkles, FlaskConical, Home, Shield, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { diagnoseCrop } from "@/server/diagnose.functions";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/diagnose")({
  head: () => ({
    meta: [
      { title: "AI Plant Doctor — FarmBridge" },
      { name: "description", content: "Take a photo of your plant. AI tells you the disease, scientific solution and a home remedy." },
    ],
  }),
  component: DiagnosePage,
});

type Result = {
  disease: string;
  confidence: string;
  severity: string;
  scientific_solution: string;
  home_remedy: string;
  prevention: string;
  is_plant: boolean;
};

function DiagnosePage() {
  const { user } = useAuth();
  const { i18n, t } = useTranslation();
  const [crop, setCrop] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function onPick(f: File | undefined | null) {
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) {
      toast.error("Image too large (max 8 MB)");
      return;
    }
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  }

  async function diagnose() {
    if (!file) return toast.error("Pick a photo first");
    setLoading(true);
    setResult(null);
    try {
      const b64 = (preview || "").split(",")[1];
      const r = await diagnoseCrop({
        data: {
          imageBase64: b64,
          crop,
          mimeType: file.type || "image/jpeg",
          lang: (i18n.language as "en" | "om" | "am") ?? "en",
        },
      });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      if (!r.is_plant) {
        toast.error("That doesn't look like a plant photo.");
      }
      setResult(r);
      // Save history (associated with user if logged in, otherwise anonymous)
      await supabase.from("diagnoses").insert({
        user_id: user?.id ?? null,
        crop: crop || null,
        disease: r.disease,
        confidence: r.confidence,
        scientific_solution: r.scientific_solution,
        home_remedy: r.home_remedy,
      });
    } catch (e: any) {
      toast.error(e?.message ?? "Diagnosis failed");
    } finally {
      setLoading(false);
    }
  }

  const sevColor =
    result?.severity === "severe"
      ? "bg-destructive/15 text-destructive"
      : result?.severity === "moderate"
        ? "bg-sun/25 text-earth"
        : result?.severity === "mild"
          ? "bg-accent text-accent-foreground"
          : "bg-leaf/20 text-primary";

  return (
    <AppShell title="AI Plant Doctor" subtitle="Snap a leaf — get a diagnosis">
      <Card className="p-4 border-0 shadow-soft animate-fade-up">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="crop">Crop (optional)</Label>
            <Input
              id="crop"
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              placeholder="e.g. Tomato, Maize, Coffee"
            />
          </div>

          <div>
            <Label>Photo</Label>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-1.5 w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-border bg-accent/30 flex items-center justify-center overflow-hidden transition-all hover:border-primary hover:bg-accent/50 active:scale-[0.99]"
            >
              {preview ? (
                <img src={preview} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-muted-foreground p-6">
                  <Camera className="h-10 w-10 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-semibold text-foreground">Tap to take or upload a photo</p>
                  <p className="text-xs mt-1">Clear, close-up of the affected leaf</p>
                </div>
              )}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => onPick(e.target.files?.[0])}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 rounded-full"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-1.5" /> Change
            </Button>
            <Button
              className="flex-[2] rounded-full gradient-primary text-primary-foreground border-0 shadow-soft"
              disabled={!file || loading}
              onClick={diagnose}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-1.5" /> Diagnose
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {loading && (
        <Card className="mt-4 p-6 border-0 shadow-soft text-center animate-fade-in">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-glow animate-pulse-soft">
            <Sparkles className="h-7 w-7 text-primary-foreground" />
          </div>
          <p className="mt-3 text-sm font-semibold">Analyzing your plant…</p>
          <p className="text-xs text-muted-foreground">This usually takes 5–10 seconds</p>
        </Card>
      )}

      {result && (
        <Card className="mt-4 p-5 border-0 shadow-glow animate-scale-in">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground">
                Diagnosis
              </p>
              <h2 className="text-xl font-extrabold leading-tight mt-0.5">{result.disease}</h2>
            </div>
            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${sevColor}`}>
              {result.severity} · {result.confidence}
            </span>
          </div>

          {!result.is_plant && (
            <div className="mt-3 p-3 rounded-xl bg-destructive/10 text-destructive text-xs flex gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>The image doesn't appear to be a plant. Try a closer photo of the leaf.</span>
            </div>
          )}

          <ResultBlock
            icon={<FlaskConical className="h-4 w-4" />}
            label="Scientific solution"
            tone="primary"
            text={result.scientific_solution}
          />
          <ResultBlock
            icon={<Home className="h-4 w-4" />}
            label="Home remedy"
            tone="sun"
            text={result.home_remedy}
          />
          <ResultBlock
            icon={<Shield className="h-4 w-4" />}
            label="Prevention"
            tone="leaf"
            text={result.prevention}
          />
        </Card>
      )}
    </AppShell>
  );
}

function ResultBlock({
  icon, label, text, tone,
}: { icon: React.ReactNode; label: string; text: string; tone: "primary" | "sun" | "leaf" }) {
  const cls =
    tone === "primary"
      ? "bg-primary/10 text-primary"
      : tone === "sun"
        ? "bg-sun/20 text-earth"
        : "bg-leaf/15 text-primary";
  return (
    <div className="mt-4">
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${cls}`}>
        {icon} {label}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-foreground/90 whitespace-pre-line">{text}</p>
    </div>
  );
}
