import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, BookOpen, ExternalLink, MessageSquare, Loader2, Send, Pencil, Trash2, Check, X } from "lucide-react";
import { db } from "@/lib/firebase";
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
  updateDoc
} from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { useAccountType } from "@/hooks/use-account-type";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "Research Feed — FarmBridge" },
      { name: "description", content: "Latest agricultural research and publications. Discuss with the community." },
    ],
  }),
  component: ResearchPage,
});

type Post = {
  id: string;
  user_id: string | null;
  title: string;
  summary: string | null;
  source: string | null;
  url: string | null;
  topic: string | null;
  published_at: string | null;
  created_at: string;
};
type Comment = { id: string; post_id: string; user_id: string; body: string; created_at: string };

function ResearchPage() {
  const { user } = useAuth();
  const { canPublishResearch } = useAccountType();
  const { t } = useTranslation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<string | null>(null);

  async function deletePost(p: Post) {
    if (!confirm("Delete this research post?")) return;
    try {
      await deleteDoc(doc(db, "research_posts", p.id));
      // Delete comments too
      const cq = query(collection(db, "research_comments"), where("post_id", "==", p.id));
      const snapshot = await getDocs(cq);
      for (const d of snapshot.docs) {
        await deleteDoc(doc(db, "research_comments", d.id));
      }
      toast.success("Deleted");
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function deleteComment(c: Comment) {
    if (!confirm("Delete this comment?")) return;
    try {
      await deleteDoc(doc(db, "research_comments", c.id));
      loadComments(c.post_id);
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  useEffect(() => {
    const q = query(collection(db, "research_posts"), orderBy("created_at", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Post[];
      setPosts(data);
      setLoading(false);
    }, (error) => {
      console.error("Error loading research posts:", error);
      toast.error("Failed to load research: " + error.message);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  async function loadComments(postId: string) {
    try {
      const q = query(collection(db, "research_comments"), where("post_id", "==", postId), orderBy("created_at"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Comment[];
      setComments((c) => ({ ...c, [postId]: data }));
    } catch (error: any) {
      console.error("Error loading comments:", error);
      toast.error("Failed to load comments: " + error.message);
    }
  }

  return (
    <AppShell title="Research" subtitle="Latest publications & discussion">
      {canPublishResearch && (
        <div className="flex justify-end mb-3">
          <NewPostDialog open={open} setOpen={setOpen} user={user} onCreated={() => {}} />
        </div>
      )}
      {!canPublishResearch && (
        <p className="text-[11px] text-muted-foreground text-center mb-3">
          {t("accountType.onlyResearchCanPublish")}
        </p>
      )}

      {loading ? (
        <div className="py-10 text-center"><Loader2 className="h-5 w-5 mx-auto animate-spin text-muted-foreground" /></div>
      ) : posts.length === 0 ? (
        <Card className="p-8 text-center border-0 shadow-soft">
          <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No research published yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Be the first to share a study.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map((p, i) => {
            const mine = user && p.user_id === user.uid;
            const isEditing = editingPost === p.id;
            return (
            <Card
              key={p.id}
              className="p-4 border-0 shadow-soft animate-fade-up"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {isEditing ? (
                <EditPost p={p} onSaved={() => { setEditingPost(null); }} onCancel={() => setEditingPost(null)} />
              ) : (
                <>
                  {p.topic && (
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-leaf/20 text-primary mb-2">
                      {p.topic}
                    </span>
                  )}
                  <h3 className="font-bold text-base leading-snug">{p.title}</h3>
                  {p.summary && <p className="text-sm text-foreground/80 mt-1.5">{p.summary}</p>}
                  <div className="flex items-center justify-between mt-3 text-xs">
                    <span className="text-muted-foreground">{p.source ?? "Community"}</span>
                    <div className="flex gap-1.5">
                      {p.url && (
                        <a href={p.url} target="_blank" rel="noreferrer">
                          <Button size="sm" variant="ghost" className="h-8 rounded-full text-xs">
                            <ExternalLink className="h-3 w-3 mr-1" /> Read
                          </Button>
                        </a>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 rounded-full text-xs"
                        onClick={() => {
                          const next = openComments === p.id ? null : p.id;
                          setOpenComments(next);
                          if (next) loadComments(p.id);
                        }}
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        {comments[p.id]?.length ?? 0} comments
                      </Button>
                    </div>
                  </div>
                  {mine && (
                    <div className="flex justify-end gap-1 mt-2 pt-2 border-t border-border/60">
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditingPost(p.id)}>
                        <Pencil className="h-3 w-3 mr-1" /> Edit
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive" onClick={() => deletePost(p)}>
                        <Trash2 className="h-3 w-3 mr-1" /> Delete
                      </Button>
                    </div>
                  )}
                </>
              )}

              {openComments === p.id && (
                <div className="mt-3 pt-3 border-t border-border animate-fade-in">
                  <CommentList comments={comments[p.id] ?? []} currentUserId={user?.uid ?? null} onDelete={deleteComment} />
                  <CommentBox user={user} postId={p.id} onAdded={() => loadComments(p.id)} />
                </div>
              )}
            </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

function CommentList({ comments, currentUserId, onDelete }: { comments: Comment[]; currentUserId: string | null; onDelete: (c: Comment) => void }) {
  if (comments.length === 0)
    return <p className="text-xs text-muted-foreground text-center py-2">No comments yet.</p>;
  return (
    <div className="space-y-2 mb-2">
      {comments.map((c) => (
        <div key={c.id} className="text-sm bg-accent/40 rounded-xl px-3 py-2 flex items-start justify-between gap-2">
          <span className="flex-1">{c.body}</span>
          {currentUserId && c.user_id === currentUserId && (
            <button onClick={() => onDelete(c)} className="text-destructive shrink-0" aria-label="Delete">
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function CommentBox({ user, postId, onAdded }: { user: any; postId: string; onAdded: () => void }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        setLoading(true);
        try {
          await addDoc(collection(db, "research_comments"), {
            post_id: postId,
            user_id: user?.uid ?? null,
            body: text.trim(),
            created_at: new Date().toISOString()
          });
          setText("");
          onAdded();
        } catch (e: any) {
          toast.error(e.message);
        } finally {
          setLoading(false);
        }
      }}
      className="flex gap-1.5"
    >
      <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a comment…" className="h-9 rounded-full" />
      <Button size="icon" disabled={loading || !text.trim()} className="h-9 w-9 rounded-full gradient-primary text-primary-foreground border-0 shrink-0">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      </Button>
    </form>
  );
}

function NewPostDialog({ open, setOpen, user, onCreated }: { open: boolean; setOpen: (v: boolean) => void; user: any; onCreated: () => void }) {
  const [form, setForm] = useState({ title: "", summary: "", source: "", url: "", topic: "" });
  const [loading, setLoading] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-full gradient-primary text-primary-foreground border-0 shadow-soft">
          <Plus className="h-4 w-4 mr-1" /> Share
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Share a study</DialogTitle></DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              try {
                await addDoc(collection(db, "research_posts"), {
                  user_id: user?.uid ?? null,
                  title: form.title,
                  summary: form.summary || null,
                  source: form.source || null,
                  url: form.url || null,
                  topic: form.topic || null,
                  created_at: new Date().toISOString()
                });
                toast.success("Research shared!");
                setOpen(false);
                setForm({ title: "", summary: "", source: "", url: "", topic: "" });
                onCreated();
              } catch (e: any) {
                toast.error(e.message);
              } finally {
                setLoading(false);
              }
            }}
            className="space-y-3"
          >
            <div className="space-y-1.5"><Label>Title *</Label><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Topic</Label><Input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="Soil, pest, irrigation…" /></div>
            <div className="space-y-1.5"><Label>Summary</Label><Textarea rows={3} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Source</Label><Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="Journal / institution" /></div>
            <div className="space-y-1.5"><Label>URL</Label><Input type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://…" /></div>
            <Button disabled={loading} className="w-full h-11 rounded-full gradient-primary text-primary-foreground border-0 shadow-soft">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publish"}
            </Button>
          </form>
      </DialogContent>
    </Dialog>
  );
}

function EditPost({ p, onSaved, onCancel }: { p: Post; onSaved: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({ title: p.title, summary: p.summary ?? "", source: p.source ?? "", url: p.url ?? "", topic: p.topic ?? "" });
  const [saving, setSaving] = useState(false);
  return (
    <div className="space-y-2">
      <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" />
      <Input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="Topic" />
      <Textarea rows={3} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="Summary" />
      <Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="Source" />
      <Input type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="URL" />
      <div className="flex gap-2">
        <Button size="sm" disabled={saving || !form.title.trim()} onClick={async () => {
          setSaving(true);
          try {
            await updateDoc(doc(db, "research_posts", p.id), {
              title: form.title.trim(),
              summary: form.summary || null,
              source: form.source || null,
              url: form.url || null,
              topic: form.topic || null,
            });
            toast.success("Updated");
            onSaved();
          } catch (e: any) {
            toast.error(e.message);
          } finally {
            setSaving(false);
          }
        }}>{saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Check className="h-3 w-3 mr-1" /> Save</>}</Button>
        <Button size="sm" variant="ghost" onClick={onCancel}><X className="h-3 w-3 mr-1" /> Cancel</Button>
      </div>
    </div>
  );
}
