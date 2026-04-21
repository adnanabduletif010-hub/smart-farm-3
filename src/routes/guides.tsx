import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "react-i18next";
import { CROP_GUIDES, type CropGuide } from "@/data/crop-guides";
import { Sprout, Droplets, FlaskConical, Bug, Calendar, Layers, MapPin, Sparkles, Loader2, ArrowLeft } from "lucide-react";
import { askCropGuide } from "@/server/guides.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/guides")({
  head: () => ({
    meta: [
      { title: "Crop Guides — FarmBridge" },
      { name: "description", content: "Scientific crop-by-crop growing guides for Ethiopian farmers in English, Afaan Oromoo and Amharic." },
    ],
  }),
  component: GuidesPage,
});

function GuidesPage() {
  const { t, i18n } = useTranslation();
  const lang = (["en", "om", "am"].includes(i18n.language) ? i18n.language : "en") as "en" | "om" | "am";
  const [active, setActive] = useState<CropGuide | null>(null);

  if (active) return <GuideDetail guide={active} lang={lang} onBack={() => setActive(null)} />;

  return (
    <AppShell title={t("guides.title")} subtitle={t("guides.subtitle")}>
      <p className="text-sm text-muted-foreground mb-3 px-1">{t("guides.selectCrop")}</p>
      <div className="grid grid-cols-2 gap-3">
        {CROP_GUIDES.map((g, i) => (
          <button
            key={g.id}
            onClick={() => setActive(g)}
            className="text-left animate-fade-up"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <Card className="p-4 border-0 shadow-soft hover:shadow-glow transition-all active:scale-[0.97] h-full">
              <div className="text-3xl mb-2">{g.emoji}</div>
              <p className="text-sm font-bold leading-tight">{g.name[lang]}</p>
              <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{g.zone[lang]}</p>
            </Card>
          </button>
        ))}
      </div>
    </AppShell>
  );
}

function GuideDetail({ guide, lang, onBack }: { guide: CropGuide; lang: "en" | "om" | "am"; onBack: () => void }) {
  const { t, i18n } = useTranslation();
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setAnswer(null);
    const res = await askCropGuide({
      data: { crop: guide.name.en, question: q, lang: i18n.language as "en" | "om" | "am" },
    });
    setLoading(false);
    if (!res.ok) return toast.error(res.error);
    setAnswer(res.answer);
  }

  const sections: { icon: any; label: string; text: string }[] = [
    { icon: MapPin, label: "Zone", text: guide.zone[lang] },
    { icon: Layers, label: "Spacing", text: guide.spacing[lang] },
    { icon: Sprout, label: "Soil", text: guide.soil[lang] },
    { icon: FlaskConical, label: "Fertilizer", text: guide.fertilizer[lang] },
    { icon: Droplets, label: "Water", text: guide.water[lang] },
    { icon: Bug, label: "Pests", text: guide.pests[lang] },
    { icon: Calendar, label: "Harvest", text: guide.harvest[lang] },
  ];

  return (
    <AppShell title={`${guide.emoji} ${guide.name[lang]}`} subtitle={t("guides.subtitle")}>
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-3 h-8 rounded-full">
        <ArrowLeft className="h-4 w-4 mr-1" /> {t("common.back")}
      </Button>

      <div className="space-y-3">
        {sections.map((s, i) => (
          <Card
            key={s.label}
            className="p-3.5 border-0 shadow-soft animate-fade-up"
            style={{ animationDelay: `${i * 30}ms` }}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-leaf/20 text-primary">
                <s.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">{s.label}</p>
                <p className="text-sm leading-snug mt-0.5">{s.text}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-4 p-4 border-0 shadow-soft bg-gradient-to-br from-card to-accent/40">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <p className="text-sm font-bold">{t("guides.askAI")}</p>
        </div>
        <form onSubmit={ask} className="space-y-2">
          <Textarea
            rows={2}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("guides.askFollowUp")}
            className="resize-none"
          />
          <Button
            type="submit"
            disabled={loading || !q.trim()}
            className="w-full h-10 rounded-full gradient-primary text-primary-foreground border-0 shadow-soft"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("guides.askAI")}
          </Button>
        </form>
        {answer && (
          <div className="mt-3 pt-3 border-t border-border animate-fade-in">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-1">
              {t("guides.aiAnswer")}
            </p>
            <p className="text-sm leading-relaxed whitespace-pre-line">{answer}</p>
          </div>
        )}
      </Card>
    </AppShell>
  );
}
