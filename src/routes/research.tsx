import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, BookOpen, ExternalLink, MessageSquare, Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

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
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [openComments, setOpenComments] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("research_posts").select("*").order("created_at", { ascending: false });
    setPosts((data ?? []) as Post[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function loadComments(postId: string) {
    const { data } = await supabase.from("research_comments").select("*").eq("post_id", postId).order("created_at");
    setComments((c) => ({ ...c, [postId]: (data ?? []) as Comment[] }));
  }

  return (
    <AppShell title="Research" subtitle="Latest publications & discussion">
      <div className="flex justify-end mb-3">
        <NewPostDialog open={open} setOpen={setOpen} user={user} onCreated={load} />
      </div>

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
          {posts.map((p, i) => (
            <Card
              key={p.id}
              className="p-4 border-0 shadow-soft animate-fade-up"
              style={{ animationDelay: `${i * 40}ms` }}
            >
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

              {openComments === p.id && (
                <div className="mt-3 pt-3 border-t border-border animate-fade-in">
                  <CommentList comments={comments[p.id] ?? []} />
                  <CommentBox user={user} postId={p.id} onAdded={() => loadComments(p.id)} />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}

function CommentList({ comments }: { comments: Comment[] }) {
  if (comments.length === 0)
    return <p className="text-xs text-muted-foreground text-center py-2">No comments yet.</p>;
  return (
    <div className="space-y-2 mb-2">
      {comments.map((c) => (
        <div key={c.id} className="text-sm bg-accent/40 rounded-xl px-3 py-2">
          {c.body}
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
        const { error } = await supabase.from("research_comments").insert({
          post_id: postId, user_id: user?.id ?? null, body: text.trim(),
        });
        setLoading(false);
        if (error) return toast.error(error.message);
        setText("");
        onAdded();
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
              const { error } = await supabase.from("research_posts").insert({
                user_id: user?.id ?? null,
                title: form.title,
                summary: form.summary || null,
                source: form.source || null,
                url: form.url || null,
                topic: form.topic || null,
              });
              setLoading(false);
              if (error) return toast.error(error.message);
              toast.success("Research shared!");
              setOpen(false);
              setForm({ title: "", summary: "", source: "", url: "", topic: "" });
              onCreated();
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
