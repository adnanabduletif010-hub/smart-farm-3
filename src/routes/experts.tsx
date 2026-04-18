import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, MessageCircle, Loader2, Send, ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/experts")({
  head: () => ({
    meta: [
      { title: "Ask Experts — FarmBridge" },
      { name: "description", content: "Ask agronomy experts your farming questions. Get crowd-sourced answers." },
    ],
  }),
  component: ExpertsPage,
});

type Q = { id: string; user_id: string; topic: string | null; question: string; status: string; created_at: string };
type R = { id: string; question_id: string; user_id: string; body: string; created_at: string };

function ExpertsPage() {
  const { user } = useAuth();
  const [qs, setQs] = useState<Q[]>([]);
  const [active, setActive] = useState<Q | null>(null);
  const [replies, setReplies] = useState<R[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("expert_questions").select("*").order("created_at", { ascending: false });
    setQs((data ?? []) as Q[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function openThread(q: Q) {
    setActive(q);
    const { data } = await supabase.from("expert_replies").select("*").eq("question_id", q.id).order("created_at");
    setReplies((data ?? []) as R[]);
  }

  if (active) {
    return (
      <AppShell title="Q&A" subtitle={active.topic ?? "Discussion"}>
        <Button variant="ghost" onClick={() => setActive(null)} className="-ml-2 mb-2 rounded-full">
          <ChevronLeft className="h-4 w-4 mr-1" /> All questions
        </Button>
        <Card className="p-4 border-0 shadow-soft animate-fade-up">
          {active.topic && (
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-leaf/20 text-primary mb-2">
              {active.topic}
            </span>
          )}
          <p className="text-base font-bold leading-snug">{active.question}</p>
        </Card>

        <div className="mt-4 space-y-2">
          {replies.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No replies yet — be the first.</p>
          ) : (
            replies.map((r) => (
              <Card key={r.id} className="p-3 border-0 shadow-soft animate-fade-up">
                <p className="text-sm leading-relaxed">{r.body}</p>
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  {new Date(r.created_at).toLocaleString()}
                </p>
              </Card>
            ))
          )}
        </div>

        <ReplyBox user={user} questionId={active.id} onAdded={() => openThread(active)} />
      </AppShell>
    );
  }

  return (
    <AppShell title="Experts" subtitle="Ask & discuss with agronomists">
      <div className="flex justify-end mb-3">
        <NewQuestionDialog user={user} onCreated={load} />
      </div>

      {loading ? (
        <div className="py-10 text-center"><Loader2 className="h-5 w-5 mx-auto animate-spin text-muted-foreground" /></div>
      ) : qs.length === 0 ? (
        <Card className="p-8 text-center border-0 shadow-soft">
          <MessageCircle className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No questions yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Tap the button above to ask anything.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {qs.map((q, i) => (
            <button
              key={q.id}
              onClick={() => openThread(q)}
              className="block w-full text-left animate-fade-up"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <Card className="p-4 border-0 shadow-soft hover:shadow-glow transition-all active:scale-[0.99]">
                {q.topic && (
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-leaf/20 text-primary mb-1.5">
                    {q.topic}
                  </span>
                )}
                <p className="text-sm font-semibold leading-snug line-clamp-2">{q.question}</p>
                <p className="text-[11px] text-muted-foreground mt-1.5">{new Date(q.created_at).toLocaleDateString()}</p>
              </Card>
            </button>
          ))}
        </div>
      )}
    </AppShell>
  );
}

function ReplyBox({ user, questionId, onAdded }: { user: any; questionId: string; onAdded: () => void }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  if (!user)
    return <p className="text-xs text-muted-foreground text-center mt-4"><Link to="/auth" className="text-primary font-semibold underline">Sign in</Link> to reply.</p>;
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        setLoading(true);
        const { error } = await supabase.from("expert_replies").insert({ question_id: questionId, user_id: user.id, body: text.trim() });
        setLoading(false);
        if (error) return toast.error(error.message);
        setText("");
        onAdded();
      }}
      className="fixed bottom-20 inset-x-0 px-4 z-30"
    >
      <div className="mx-auto max-w-2xl flex gap-2 glass rounded-full p-1.5 shadow-glow border border-border/60">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a reply…" className="h-10 rounded-full border-0 bg-transparent focus-visible:ring-0" />
        <Button size="icon" disabled={loading || !text.trim()} className="h-10 w-10 rounded-full gradient-primary text-primary-foreground border-0 shrink-0">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </form>
  );
}

function NewQuestionDialog({ user, onCreated }: { user: any; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-full gradient-primary text-primary-foreground border-0 shadow-soft">
          <Plus className="h-4 w-4 mr-1" /> Ask
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Ask an expert</DialogTitle></DialogHeader>
        {!user ? (
          <p className="text-sm text-muted-foreground"><Link to="/auth" className="text-primary font-semibold underline">Sign in</Link> to ask a question.</p>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              const { error } = await supabase.from("expert_questions").insert({
                user_id: user.id, topic: topic || null, question,
              });
              setLoading(false);
              if (error) return toast.error(error.message);
              toast.success("Question posted!");
              setTopic(""); setQuestion(""); setOpen(false); onCreated();
            }}
            className="space-y-3"
          >
            <div className="space-y-1.5"><Label>Topic</Label><Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Pest, soil, irrigation…" /></div>
            <div className="space-y-1.5"><Label>Question *</Label><Textarea required rows={4} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="What would you like to know?" /></div>
            <Button disabled={loading} className="w-full h-11 rounded-full gradient-primary text-primary-foreground border-0 shadow-soft">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post question"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
