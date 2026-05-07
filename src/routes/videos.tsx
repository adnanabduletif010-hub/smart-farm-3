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
import { db, storage } from "@/lib/firebase";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  where,
  setDoc,
  getDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
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
  const [likes, setLikes] = useState<Record<string, { count: number; likers: Set<string> }>>({});
  const [openComments, setOpenComments] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "videos"), orderBy("created_at", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as V[];
      setVids(list);
      setLoading(false);
    }, (error) => {
      console.error("Error loading videos:", error);
      toast.error("Failed to load videos: " + error.message);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!vids.length) return;
    
    const unsubscribes = vids.map(v => {
      const q = query(collection(db, "video_likes"), where("video_id", "==", v.id));
      return onSnapshot(q, (snapshot) => {
        const likers = new Set(snapshot.docs.map(d => d.data().user_id));
        setLikes(prev => ({
          ...prev,
          [v.id]: { count: snapshot.size, likers }
        }));
      });
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [vids.map(v => v.id).join(",")]);


  async function del(v: V) {
    if (!confirm(t("videos.confirmDelete"))) return;
    try {
      await deleteDoc(doc(db, "videos", v.id));
      // Delete comments and likes
      const cq = query(collection(db, "video_comments"), where("video_id", "==", v.id));
      const cSnap = await getDocs(cq);
      for (const d of cSnap.docs) await deleteDoc(doc(db, "video_comments", d.id));
      
      const lq = query(collection(db, "video_likes"), where("video_id", "==", v.id));
      const lSnap = await getDocs(lq);
      for (const d of lSnap.docs) await deleteDoc(doc(db, "video_likes", d.id));

      toast.success(t("videos.deleted"));
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function toggleLike(v: V) {
    if (!user) return toast.error("Sign in to like");
    const cur = likes[v.id] ?? { count: 0, likers: new Set<string>() };
    const mine = cur.likers.has(user.uid);
    try {
      if (mine) {
        const q = query(collection(db, "video_likes"), where("video_id", "==", v.id), where("user_id", "==", user.uid));
        const snap = await getDocs(q);
        for (const d of snap.docs) await deleteDoc(doc(db, "video_likes", d.id));
      } else {
        await addDoc(collection(db, "video_likes"), { video_id: v.id, user_id: user.uid });
      }
    } catch (e: any) {
      toast.error(e.message);
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
          <NewVideoDialog user={user} onCreated={() => {}} />
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
            const mine = user && v.user_id === user.uid;
            const embed = getEmbed(v.url);
            const direct = isDirectVideo(v.url);
            const like = likes[v.id] ?? { count: 0, likers: new Set<string>() };
            const mineLike = !!user && like.likers.has(user.uid);
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
                    <Heart className={`h-4 w-4 ${mineLike ? "fill-destructive text-destructive" : ""}`} />
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
    try {
      const q = query(collection(db, "video_comments"), where("video_id", "==", videoId), orderBy("created_at", "asc"));
      const snapshot = await getDocs(q);
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any);
    } catch (error: any) {
      console.error("Error loading video comments:", error);
      toast.error("Failed to load comments: " + error.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, [videoId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return toast.error("Sign in to comment");
    if (!body.trim()) return;
    setPosting(true);
    try {
      await addDoc(collection(db, "video_comments"), {
        video_id: videoId,
        user_id: user.uid,
        body: body.trim(),
        created_at: new Date().toISOString()
      });
      setBody("");
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setPosting(false);
    }
  }

  async function del(id: string) {
    try {
      await deleteDoc(doc(db, "video_comments", id));
      setItems(items.filter((c) => c.id !== id));
    } catch (e: any) {
      toast.error(e.message);
    }
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
            {user?.uid === c.user_id && (
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
      try {
        const ext = file.name.split(".").pop() || "mp4";
        const path = `videos/${user.uid}/${Date.now()}.${ext}`;
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, file);
        finalUrl = await getDownloadURL(snapshot.ref);
      } catch (e: any) {
        setLoading(false);
        return toast.error(e.message);
      }
    } else if (!finalUrl) {
      return toast.error("Provide a YouTube/Vimeo URL or upload a file");
    } else if (!getEmbed(finalUrl) && !isDirectVideo(finalUrl)) {
      return toast.error(t("videos.invalidUrl"));
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "videos"), {
        user_id: user.uid,
        title: form.title.trim(),
        description: form.description || null,
        url: finalUrl,
        topic: form.topic || null,
        created_at: new Date().toISOString()
      });
      toast.success(t("videos.posted"));
      setOpen(false);
      setForm({ title: "", description: "", url: "", topic: "" });
      setFile(null);
      onCreated();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
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
