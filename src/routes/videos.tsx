import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Video, Loader2, Trash2, Heart, MessageCircle, Share2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useAccountType } from "@/hooks/use-account-type";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

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
type Comment = { id: string; user_id: string; body: string; created_at: string };

function getEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      const m = u.pathname.match(/\/(embed|shorts)\/([\w-]+)/);
      if (m) return `https://www.youtube.com/embed/${m[2]}`;
    }
    if (u.hostname === "youtu.be") return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
    }
  } catch { /* noop */ }
  return null;
}

function isDirectVideo(url: string): boolean {
  return /\.(mp4|webm|mov|m4v|ogg)(\?|$)/i.test(url);
}

function VideosPage() {
  const { user } = useAuth();
  const { canPostVideos } = useAccountType();
  const { t } = useTranslation();
  const [vids, setVids] = useState<V[]>([]);
  const [loading, setLoading] = useState(true);
  const [likes, setLikes] = useState<Record<string, { count: number; mine: boolean }>>({});
  const [openComments, setOpenComments] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("videos").select("*").order("created_at", { ascending: false });
    const list = (data ?? []) as V[];
    setVids(list);
    if (list.length) {
      const ids = list.map((v) => v.id);
      const { data: likeRows } = await supabase.from("video_likes" as any).select("video_id, user_id").in("video_id", ids);
      const map: Record<string, { count: number; mine: boolean }> = {};
      ids.forEach((id) => (map[id] = { count: 0, mine: false }));
      (likeRows ?? []).forEach((r: any) => {
        map[r.video_id].count++;
        if (user && r.user_id === user.id) map[r.video_id].mine = true;
      });
      setLikes(map);
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, [user?.id]);

  // Realtime: keep like counts and my-like state fresh across tabs/devices
  useEffect(() => {
    const channel = supabase
      .channel("video_likes_feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "video_likes" },
        (payload: any) => {
          const row = (payload.new ?? payload.old) as { video_id: string; user_id: string };
          if (!row?.video_id) return;
          setLikes((prev) => {
            const cur = prev[row.video_id] ?? { count: 0, mine: false };
            if (payload.eventType === "INSERT") {
              return {
                ...prev,
                [row.video_id]: {
                  count: cur.count + 1,
                  mine: user && row.user_id === user.id ? true : cur.mine,
                },
              };
            }
            if (payload.eventType === "DELETE") {
              return {
                ...prev,
                [row.video_id]: {
                  count: Math.max(0, cur.count - 1),
                  mine: user && row.user_id === user.id ? false : cur.mine,
                },
              };
            }
            return prev;
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  async function del(v: V) {
    if (!confirm(t("videos.confirmDelete"))) return;
    const { error } = await supabase.from("videos").delete().eq("id", v.id);
    if (error) return toast.error(error.message);
    toast.success(t("videos.deleted"));
    load();
  }

  async function toggleLike(v: V) {
    if (!user) return toast.error("Sign in to like");
    const cur = likes[v.id];
    if (cur?.mine) {
      const { error } = await supabase.from("video_likes" as any).delete().eq("video_id", v.id).eq("user_id", user.id);
      if (error) return toast.error(error.message);
      setLikes({ ...likes, [v.id]: { count: cur.count - 1, mine: false } });
    } else {
      const { error } = await supabase.from("video_likes" as any).insert({ video_id: v.id, user_id: user.id });
      if (error) return toast.error(error.message);
      setLikes({ ...likes, [v.id]: { count: (cur?.count ?? 0) + 1, mine: true } });
    }
  }

  async function share(v: V) {
    const url = window.location.origin + "/videos";
    const text = `${v.title} — ${url}`;
    if (navigator.share) {
      try { await navigator.share({ title: v.title, text: v.description ?? "", url }); return; } catch { /* cancel */ }
    }
    try { await navigator.clipboard.writeText(text); toast.success("Link copied"); } catch { toast.error("Could not share"); }
  }

  return (
    <AppShell title={t("videos.title")} subtitle={t("videos.subtitle")}>
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
          <p className="text-sm text-muted-foreground">{t("videos.none")}</p>
          {!canPostVideos && (
            <p className="text-xs text-muted-foreground mt-1">{t("videos.onlyExpertsCanPost")}</p>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {vids.map((v, i) => {
            const mine = user && v.user_id === user.id;
            const embed = getEmbed(v.url);
            const direct = isDirectVideo(v.url);
            const like = likes[v.id] ?? { count: 0, mine: false };
            return (
              <Card key={v.id} className="p-3 border-0 shadow-soft animate-fade-up overflow-hidden" style={{ animationDelay: `${i * 30}ms` }}>
                {direct ? (
                  <video src={v.url} controls className="w-full aspect-video rounded-xl bg-black mb-2" />
                ) : embed ? (
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-black mb-2">
                    <iframe src={embed} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={v.title} />
                  </div>
                ) : (
                  <a href={v.url} target="_blank" rel="noreferrer" className="block aspect-video w-full rounded-xl bg-muted flex items-center justify-center mb-2 text-xs text-muted-foreground">
                    {t("videos.openLink")}
                  </a>
                )}
                {v.topic && (
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-leaf/20 text-primary mb-1">{v.topic}</span>
                )}
                <h3 className="font-bold text-base leading-snug">{v.title}</h3>
                {v.description && <p className="text-sm text-foreground/80 mt-1">{v.description}</p>}

                <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/50">
                  <Button size="sm" variant="ghost" className="h-8 px-2 gap-1" onClick={() => toggleLike(v)}>
                    <Heart className={`h-4 w-4 ${like.mine ? "fill-destructive text-destructive" : ""}`} />
                    <span className="text-xs">{like.count}</span>
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 px-2 gap-1" onClick={() => setOpenComments(openComments === v.id ? null : v.id)}>
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-xs">{t("videos.comment") || "Comment"}</span>
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 px-2 gap-1" onClick={() => share(v)}>
                    <Share2 className="h-4 w-4" />
                    <span className="text-xs">{t("videos.share") || "Share"}</span>
                  </Button>
                  <div className="ml-auto flex items-center gap-2">
                    <p className="text-[11px] text-muted-foreground">{new Date(v.created_at).toLocaleDateString()}</p>
                    {mine && (
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive" onClick={() => del(v)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                {openComments === v.id && <Comments videoId={v.id} user={user} />}
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

function Comments({ videoId, user }: { videoId: string; user: any }) {
  const [items, setItems] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("video_comments" as any).select("*").eq("video_id", videoId).order("created_at", { ascending: true });
    setItems((data ?? []) as unknown as Comment[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, [videoId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return toast.error("Sign in to comment");
    if (!body.trim()) return;
    setPosting(true);
    const { error } = await supabase.from("video_comments" as any).insert({ video_id: videoId, user_id: user.id, body: body.trim() });
    setPosting(false);
    if (error) return toast.error(error.message);
    setBody("");
    load();
  }

  async function del(id: string) {
    const { error } = await supabase.from("video_comments" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    setItems(items.filter((c) => c.id !== id));
  }

  return (
    <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mx-auto" />
      ) : items.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-2">No comments yet</p>
      ) : (
        items.map((c) => (
          <div key={c.id} className="flex items-start gap-2 text-sm bg-muted/40 rounded-lg p-2">
            <div className="flex-1">
              <p className="leading-snug">{c.body}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(c.created_at).toLocaleString()}</p>
            </div>
            {user?.id === c.user_id && (
              <Button size="sm" variant="ghost" className="h-6 px-1 text-destructive" onClick={() => del(c.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))
      )}
      <form onSubmit={submit} className="flex gap-2">
        <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Add a comment…" className="h-9" />
        <Button type="submit" size="sm" disabled={posting || !body.trim()} className="h-9">
          {posting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
        </Button>
      </form>
    </div>
  );
}

function NewVideoDialog({ user, onCreated }: { user: any; onCreated: () => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", url: "", topic: "" });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return toast.error(t("market.signInToSell"));
    if (!form.title.trim()) return toast.error("Title required");

    let finalUrl = form.url.trim();

    if (file) {
      setLoading(true);
      const ext = file.name.split(".").pop() || "mp4";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("videos").upload(path, file, { contentType: file.type });
      if (upErr) { setLoading(false); return toast.error(upErr.message); }
      const { data: pub } = supabase.storage.from("videos").getPublicUrl(path);
      finalUrl = pub.publicUrl;
    } else if (!finalUrl) {
      return toast.error("Provide a YouTube/Vimeo URL or upload a file");
    } else if (!getEmbed(finalUrl) && !isDirectVideo(finalUrl)) {
      return toast.error(t("videos.invalidUrl"));
    }

    setLoading(true);
    const { error } = await supabase.from("videos").insert({
      user_id: user.id,
      title: form.title.trim(),
      description: form.description || null,
      url: finalUrl,
      topic: form.topic || null,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(t("videos.posted"));
    setOpen(false);
    setForm({ title: "", description: "", url: "", topic: "" });
    setFile(null);
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-full gradient-primary text-primary-foreground border-0 shadow-soft">
          <Plus className="h-4 w-4 mr-1" /> {t("videos.add")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{t("videos.shareHowTo")}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5"><Label>{t("videos.title_field")} *</Label><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="space-y-1.5">
            <Label>{t("videos.url_field")} (YouTube / Vimeo)</Label>
            <Input type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://youtube.com/watch?v=…" disabled={!!file} />
          </div>
          <div className="space-y-1.5">
            <Label>Or upload from your device</Label>
            <Input type="file" accept="video/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} disabled={!!form.url.trim()} />
            {file && <p className="text-xs text-muted-foreground">{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</p>}
          </div>
          <div className="space-y-1.5"><Label>{t("videos.topic")}</Label><Input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>{t("videos.description")}</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <Button disabled={loading} className="w-full h-11 rounded-full gradient-primary text-primary-foreground border-0 shadow-soft">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("videos.post")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
