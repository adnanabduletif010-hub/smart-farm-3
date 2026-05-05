import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import {
  Sprout, Droplets, FlaskConical, Bug, Calendar, Layers, MapPin,
  Sparkles, Loader2, ArrowLeft, Plus, Pencil, Trash2,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { toast } from "sonner";
import { askCropGuide } from "@/lib/api-helpers";

export const Route = createFileRoute("/guides")({
  head: () => ({
    meta: [
      { title: "Crop Guides — FarmBridge" },
      { name: "description", content: "Scientific crop-by-crop growing guides for Ethiopian farmers in English, Afaan Oromoo and Amharic." },
    ],
  }),
  component: GuidesPage,
});

type Lang = "en" | "om" | "am";

type GuideRow = {
  id: string;
  slug: string;
  emoji: string | null;
  name_en: string; name_om: string | null; name_am: string | null;
  zone_en: string | null; zone_om: string | null; zone_am: string | null;
  spacing_en: string | null; spacing_om: string | null; spacing_am: string | null;
  soil_en: string | null; soil_om: string | null; soil_am: string | null;
  fertilizer_en: string | null; fertilizer_om: string | null; fertilizer_am: string | null;
  water_en: string | null; water_om: string | null; water_am: string | null;
  pests_en: string | null; pests_om: string | null; pests_am: string | null;
  harvest_en: string | null; harvest_om: string | null; harvest_am: string | null;
};

const FIELDS = ["zone", "spacing", "soil", "fertilizer", "water", "pests", "harvest"] as const;

function pick(g: GuideRow, base: typeof FIELDS[number] | "name", lang: Lang): string {
  const key = `${base}_${lang}` as keyof GuideRow;
  return (g[key] as string | null) || (g[`${base}_en` as keyof GuideRow] as string | null) || "";
}

function GuidesPage() {
  const { t, i18n } = useTranslation();
  const lang = (["en", "om", "am"].includes(i18n.language) ? i18n.language : "en") as Lang;
  const [active, setActive] = useState<GuideRow | null>(null);
  const [guides, setGuides] = useState<GuideRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<GuideRow | null>(null);
  const { isAdmin } = useIsAdmin();

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("crop_guides").select("*").order("name_en");
    if (error) toast.error(error.message);
    setGuides((data ?? []) as GuideRow[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function deleteGuide(g: GuideRow) {
    if (!confirm(`Delete guide "${g.name_en}"?`)) return;
    const { error } = await supabase.from("crop_guides").delete().eq("id", g.id);
    if (error) return toast.error(error.message);
    toast.success("Guide deleted");
    if (active?.id === g.id) setActive(null);
    load();
  }

  if (active) {
    return (
      <GuideDetail
        guide={active}
        lang={lang}
        isAdmin={isAdmin}
        onBack={() => setActive(null)}
        onEdit={() => { setEditing(active); setEditorOpen(true); }}
        onDelete={() => deleteGuide(active)}
      />
    );
  }

  return (
    <AppShell title={t("guides.title")} subtitle={t("guides.subtitle")}>
      <div className="flex items-center justify-between mb-3 px-1">
        <p className="text-sm text-muted-foreground">{t("guides.selectCrop")}</p>
        {isAdmin && (
          <Button
            size="sm"
            onClick={() => { setEditing(null); setEditorOpen(true); }}
            className="rounded-full gradient-primary text-primary-foreground border-0 shadow-soft h-8"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add guide
          </Button>
        )}
      </div>

      {loading ? (
        <div className="py-10 text-center"><Loader2 className="h-5 w-5 mx-auto animate-spin text-muted-foreground" /></div>
      ) : guides.length === 0 ? (
        <Card className="p-8 text-center border-0 shadow-soft">
          <p className="text-sm text-muted-foreground">No crop guides yet.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {guides.map((g, i) => (
            <div key={g.id} className="relative animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
              <button onClick={() => setActive(g)} className="block w-full text-left">
                <Card className="p-4 border-0 shadow-soft hover:shadow-glow transition-all active:scale-[0.97] h-full">
                  <div className="text-3xl mb-2">{g.emoji ?? "🌱"}</div>
                  <p className="text-sm font-bold leading-tight">{pick(g, "name", lang)}</p>
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{pick(g, "zone", lang)}</p>
                </Card>
              </button>
              {isAdmin && (
                <div className="absolute top-1 right-1 flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7 bg-card/90 backdrop-blur"
                    onClick={(e) => { e.stopPropagation(); setEditing(g); setEditorOpen(true); }}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 bg-card/90 backdrop-blur text-destructive"
                    onClick={(e) => { e.stopPropagation(); deleteGuide(g); }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <GuideEditor
        open={editorOpen}
        setOpen={setEditorOpen}
        existing={editing}
        onSaved={() => { setEditorOpen(false); setEditing(null); load(); }}
      />
    </AppShell>
  );
}

function GuideDetail({
  guide, lang, isAdmin, onBack, onEdit, onDelete,
}: {
  guide: GuideRow; lang: Lang; isAdmin: boolean;
  onBack: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const { t, i18n } = useTranslation();
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setAnswer(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) {
        setLoading(false);
        return toast.error("Please sign in to ask the AI agronomist.");
      }
      const res = await askCropGuide({
        data: { crop: guide.name_en, question: q, lang: i18n.language as Lang },
        headers: { Authorization: `Bearer ${token}` },
      });
      setLoading(false);
      if (!res.ok) return toast.error(res.error);
      setAnswer(res.answer);
    } catch (err) {
      setLoading(false);
      toast.error(err instanceof Error ? err.message : "Failed to get answer");
    }
  }

  const sections: { icon: any; label: string; text: string }[] = [
    { icon: MapPin, label: "Zone", text: pick(guide, "zone", lang) },
    { icon: Layers, label: "Spacing", text: pick(guide, "spacing", lang) },
    { icon: Sprout, label: "Soil", text: pick(guide, "soil", lang) },
    { icon: FlaskConical, label: "Fertilizer", text: pick(guide, "fertilizer", lang) },
    { icon: Droplets, label: "Water", text: pick(guide, "water", lang) },
    { icon: Bug, label: "Pests", text: pick(guide, "pests", lang) },
    { icon: Calendar, label: "Harvest", text: pick(guide, "harvest", lang) },
  ].filter((s) => s.text);

  return (
    <AppShell title={`${guide.emoji ?? "🌱"} ${pick(guide, "name", lang)}`} subtitle={t("guides.subtitle")}>
      <div className="flex items-center justify-between mb-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="h-8 rounded-full -ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> {t("common.back")}
        </Button>
        {isAdmin && (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={onEdit} className="h-8">
              <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete} className="h-8 text-destructive">
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {sections.map((s, i) => (
          <Card key={s.label} className="p-3.5 border-0 shadow-soft animate-fade-up" style={{ animationDelay: `${i * 30}ms` }}>
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
          <Textarea rows={2} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("guides.askFollowUp")} className="resize-none" />
          <Button type="submit" disabled={loading || !q.trim()} className="w-full h-10 rounded-full gradient-primary text-primary-foreground border-0 shadow-soft">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("guides.askAI")}
          </Button>
        </form>
        {answer && (
          <div className="mt-3 pt-3 border-t border-border animate-fade-in">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-1">{t("guides.aiAnswer")}</p>
            <p className="text-sm leading-relaxed whitespace-pre-line">{answer}</p>
          </div>
        )}
      </Card>
    </AppShell>
  );
}

type EditorForm = {
  slug: string; emoji: string;
  name_en: string; name_om: string; name_am: string;
  zone_en: string; zone_om: string; zone_am: string;
  spacing_en: string; spacing_om: string; spacing_am: string;
  soil_en: string; soil_om: string; soil_am: string;
  fertilizer_en: string; fertilizer_om: string; fertilizer_am: string;
  water_en: string; water_om: string; water_am: string;
  pests_en: string; pests_om: string; pests_am: string;
  harvest_en: string; harvest_om: string; harvest_am: string;
};

const emptyEditor: EditorForm = {
  slug: "", emoji: "🌱",
  name_en: "", name_om: "", name_am: "",
  zone_en: "", zone_om: "", zone_am: "",
  spacing_en: "", spacing_om: "", spacing_am: "",
  soil_en: "", soil_om: "", soil_am: "",
  fertilizer_en: "", fertilizer_om: "", fertilizer_am: "",
  water_en: "", water_om: "", water_am: "",
  pests_en: "", pests_om: "", pests_am: "",
  harvest_en: "", harvest_om: "", harvest_am: "",
};

function GuideEditor({
  open, setOpen, existing, onSaved,
}: { open: boolean; setOpen: (v: boolean) => void; existing: GuideRow | null; onSaved: () => void }) {
  const [form, setForm] = useState<EditorForm>(emptyEditor);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (existing) {
      setForm({
        slug: existing.slug,
        emoji: existing.emoji ?? "🌱",
        name_en: existing.name_en, name_om: existing.name_om ?? "", name_am: existing.name_am ?? "",
        zone_en: existing.zone_en ?? "", zone_om: existing.zone_om ?? "", zone_am: existing.zone_am ?? "",
        spacing_en: existing.spacing_en ?? "", spacing_om: existing.spacing_om ?? "", spacing_am: existing.spacing_am ?? "",
        soil_en: existing.soil_en ?? "", soil_om: existing.soil_om ?? "", soil_am: existing.soil_am ?? "",
        fertilizer_en: existing.fertilizer_en ?? "", fertilizer_om: existing.fertilizer_om ?? "", fertilizer_am: existing.fertilizer_am ?? "",
        water_en: existing.water_en ?? "", water_om: existing.water_om ?? "", water_am: existing.water_am ?? "",
        pests_en: existing.pests_en ?? "", pests_om: existing.pests_om ?? "", pests_am: existing.pests_am ?? "",
        harvest_en: existing.harvest_en ?? "", harvest_om: existing.harvest_om ?? "", harvest_am: existing.harvest_am ?? "",
      });
    } else {
      setForm(emptyEditor);
    }
  }, [open, existing]);

  function set<K extends keyof EditorForm>(k: K, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name_en.trim()) return toast.error("English name is required");
    const slug = (form.slug || form.name_en).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (!slug) return toast.error("Provide a valid slug or name");
    setSaving(true);
    const payload = {
      ...form,
      slug,
      name_om: form.name_om || null, name_am: form.name_am || null,
      zone_en: form.zone_en || null, zone_om: form.zone_om || null, zone_am: form.zone_am || null,
      spacing_en: form.spacing_en || null, spacing_om: form.spacing_om || null, spacing_am: form.spacing_am || null,
      soil_en: form.soil_en || null, soil_om: form.soil_om || null, soil_am: form.soil_am || null,
      fertilizer_en: form.fertilizer_en || null, fertilizer_om: form.fertilizer_om || null, fertilizer_am: form.fertilizer_am || null,
      water_en: form.water_en || null, water_om: form.water_om || null, water_am: form.water_am || null,
      pests_en: form.pests_en || null, pests_om: form.pests_om || null, pests_am: form.pests_am || null,
      harvest_en: form.harvest_en || null, harvest_om: form.harvest_om || null, harvest_am: form.harvest_am || null,
    };
    const { error } = existing
      ? await supabase.from("crop_guides").update(payload).eq("id", existing.id)
      : await supabase.from("crop_guides").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(existing ? "Guide updated" : "Guide created");
    onSaved();
  }

  const trio = (label: string, base: typeof FIELDS[number]) => (
    <div className="space-y-1.5">
      <Label className="capitalize">{label}</Label>
      <Textarea rows={2} placeholder={`${label} (English)`} value={form[`${base}_en` as keyof EditorForm]} onChange={(e) => set(`${base}_en` as keyof EditorForm, e.target.value)} />
      <Textarea rows={2} placeholder={`${label} (Afaan Oromoo)`} value={form[`${base}_om` as keyof EditorForm]} onChange={(e) => set(`${base}_om` as keyof EditorForm, e.target.value)} />
      <Textarea rows={2} placeholder={`${label} (አማርኛ)`} value={form[`${base}_am` as keyof EditorForm]} onChange={(e) => set(`${base}_am` as keyof EditorForm, e.target.value)} />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{existing ? "Edit crop guide" : "Add crop guide"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1.5">
              <Label>Emoji</Label>
              <Input value={form.emoji} onChange={(e) => set("emoji", e.target.value)} placeholder="🌽" />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto from name" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input required placeholder="Name (English)" value={form.name_en} onChange={(e) => set("name_en", e.target.value)} />
            <Input placeholder="Maqaa (Afaan Oromoo)" value={form.name_om} onChange={(e) => set("name_om", e.target.value)} />
            <Input placeholder="ስም (አማርኛ)" value={form.name_am} onChange={(e) => set("name_am", e.target.value)} />
          </div>
          {trio("Zone", "zone")}
          {trio("Spacing", "spacing")}
          {trio("Soil", "soil")}
          {trio("Fertilizer", "fertilizer")}
          {trio("Water", "water")}
          {trio("Pests", "pests")}
          {trio("Harvest", "harvest")}
          <Button disabled={saving} className="w-full h-11 rounded-full gradient-primary text-primary-foreground border-0 shadow-soft">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (existing ? "Save changes" : "Create guide")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
