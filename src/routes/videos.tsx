import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Video, Loader2, Trash2, Pencil, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useAccountType } from "@/hooks/use-account-type";
import { toast } from "sonner";

export const Route = createFileRoute("/videos")({
  head: () => ({
    meta: [
      { title: "Instructional Videos — FarmBridge" },
      { name: "description", content: "How-to videos for farmers from experts and research centers." },
    ],
  }),
  component: VideosPage,
});

type V = { id: string; user_id: string; title: string; description: string | null; url: string; topic: string | null; created_at: string };

function getEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    // YouTube
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      const m = u.pathname.match(/\/(embed|shorts)\/([\w-]+)/);
      if (m) return `https://www.youtube.com/embed/${m[2]}`;
    }
    if (u.hostname === "youtu.be") {
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    }
    // Vimeo
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
    }
  } catch { /* noop */ }
  return null;
}

function VideosPage() {
  const { user } = useAuth();
  const { canPostVideos } = useAccountType();
  const [vids, setVids] = useState<V[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("videos").select("*").order("created_at", { ascending: false });
    setVids((data ?? []) as V[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function del(v: V) {
    if (!confirm("Delete this video?")) return;
    const { error } = await supabase.from("videos").delete().eq("id", v.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  }

  return (
    <AppShell title="Videos" subtitle="How-to from experts & research centers">
      {canPostVideos && (
        <div className="flex justify-end mb-3">
          <NewVideoDialog user={user} onCreated={load} />
        </div>
      )}

      {loading ? (
        <div className="py-10 text-center"><Loader2 className="h-5 w-5 mx-auto animate-spin text-muted-foreground" /></div>
      ) : vids.length === 0 ? (
        <Card className="p-8 text-center border-0 shadow-soft">
          <Video className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No videos yet.</p>
          {!canPostVideos && (
            <p className="text-xs text-muted-foreground mt-1">Only experts & research centers can post videos.</p>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {vids.map((v, i) => {
            const mine = user && v.user_id === user.id;
            const embed = getEmbed(v.url);
            const isEditing = editing === v.id;
            return (
              <Card key={v.id} className="p-3 border-0 shadow-soft animate-fade-up overflow-hidden" style={{ animationDelay: `${i * 30}ms` }}>
                {embed ? (
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-black mb-2">
                    <iframe src={embed} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={v.title} />
                  </div>
                ) : (
                  <a href={v.url} target="_blank" rel="noreferrer" className="block aspect-video w-full rounded-xl bg-muted flex items-center justify-center mb-2 text-xs text-muted-foreground">
                    Open video link ↗
                  </a>
                )}
                {isEditing ? (
                  <EditVideo v={v} onSaved={() => { setEditing(null); load(); }} onCancel={() => setEditing(null)} />
                ) : (
                  <>
                    {v.topic && (
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-leaf/20 text-primary mb-1">
                        {v.topic}
                      </span>
                    )}
                    <h3 className="font-bold text-base leading-snug">{v.title}</h3>
                    {v.description && <p className="text-sm text-foreground/80 mt-1">{v.description}</p>}
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-[11px] text-muted-foreground">{new Date(v.created_at).toLocaleDateString()}</p>
                      {mine && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditing(v.id)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive" onClick={() => del(v)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

function EditVideo({ v, onSaved, onCancel }: { v: V; onSaved: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({ title: v.title, description: v.description ?? "", url: v.url, topic: v.topic ?? "" });
  const [saving, setSaving] = useState(false);
  return (
    <div className="space-y-2">
      <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" />
      <Input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="Topic" />
      <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="YouTube / Vimeo URL" />
      <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" />
      <div className="flex gap-2">
        <Button size="sm" disabled={saving || !form.title.trim() || !form.url.trim()} onClick={async () => {
          setSaving(true);
          const { error } = await supabase.from("videos").update({
            title: form.title.trim(), description: form.description || null,
            url: form.url.trim(), topic: form.topic || null,
          }).eq("id", v.id);
          setSaving(false);
          if (error) return toast.error(error.message);
          toast.success("Updated");
          onSaved();
        }}>{saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Check className="h-3 w-3 mr-1" /> Save</>}</Button>
        <Button size="sm" variant="ghost" onClick={onCancel}><X className="h-3 w-3 mr-1" /> Cancel</Button>
      </div>
    </div>
  );
}

function NewVideoDialog({ user, onCreated }: { user: any; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", url: "", topic: "" });
  const [loading, setLoading] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-full gradient-primary text-primary-foreground border-0 shadow-soft">
          <Plus className="h-4 w-4 mr-1" /> Add video
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Share a how-to video</DialogTitle></DialogHeader>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!user) return toast.error("Sign in required");
            if (!getEmbed(form.url)) return toast.error("Please paste a valid YouTube or Vimeo link");
            setLoading(true);
            const { error } = await supabase.from("videos").insert({
              user_id: user.id,
              title: form.title.trim(),
              description: form.description || null,
              url: form.url.trim(),
              topic: form.topic || null,
            });
            setLoading(false);
            if (error) return toast.error(error.message);
            toast.success("Video posted!");
            setOpen(false);
            setForm({ title: "", description: "", url: "", topic: "" });
            onCreated();
          }}
          className="space-y-3"
        >
          <div className="space-y-1.5"><Label>Title *</Label><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>YouTube or Vimeo URL *</Label><Input required type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://youtube.com/watch?v=…" /></div>
          <div className="space-y-1.5"><Label>Topic</Label><Input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="Irrigation, pest control…" /></div>
          <div className="space-y-1.5"><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <Button disabled={loading} className="w-full h-11 rounded-full gradient-primary text-primary-foreground border-0 shadow-soft">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post video"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
