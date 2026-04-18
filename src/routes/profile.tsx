import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, User as UserIcon, History } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — FarmBridge" }] }),
  component: ProfilePage,
});

type Profile = { display_name: string | null; role: string; location: string | null; bio: string | null };
type Diag = { id: string; crop: string | null; disease: string; created_at: string };

function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile>({ display_name: "", role: "farmer", location: "", bio: "" });
  const [diags, setDiags] = useState<Diag[]>([]);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("display_name, role, location, bio").eq("user_id", user.id).maybeSingle();
      if (data) setProfile(data as Profile);
      const { data: d } = await supabase.from("diagnoses").select("id, crop, disease, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
      setDiags((d ?? []) as Diag[]);
      setLoaded(true);
    })();
  }, [user]);

  if (authLoading) return <AppShell><div className="py-10 text-center"><Loader2 className="h-5 w-5 mx-auto animate-spin text-muted-foreground" /></div></AppShell>;

  if (!user) {
    return (
      <AppShell title="Profile">
        <Card className="p-8 text-center border-0 shadow-soft animate-fade-up">
          <UserIcon className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-4">Sign in to manage your profile.</p>
          <Link to="/auth">
            <Button className="rounded-full gradient-primary text-primary-foreground border-0 shadow-soft">Sign in</Button>
          </Link>
        </Card>
      </AppShell>
    );
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      display_name: profile.display_name, role: profile.role, location: profile.location, bio: profile.bio,
    }).eq("user_id", user!.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile saved");
  }

  return (
    <AppShell title="Profile" subtitle={user.email ?? ""}>
      {!loaded ? (
        <div className="py-10 text-center"><Loader2 className="h-5 w-5 mx-auto animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <Card className="p-4 border-0 shadow-soft animate-fade-up">
            <form onSubmit={save} className="space-y-3">
              <div className="space-y-1.5"><Label>Display name</Label><Input value={profile.display_name ?? ""} onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} /></div>
              <div className="space-y-1.5">
                <Label>I am a…</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={profile.role}
                  onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                >
                  <option value="farmer">Farmer</option>
                  <option value="expert">Expert / Agronomist</option>
                  <option value="buyer">Buyer</option>
                </select>
              </div>
              <div className="space-y-1.5"><Label>Location</Label><Input value={profile.location ?? ""} onChange={(e) => setProfile({ ...profile, location: e.target.value })} placeholder="Town, region" /></div>
              <div className="space-y-1.5"><Label>Bio</Label><Textarea rows={3} value={profile.bio ?? ""} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} /></div>
              <Button disabled={saving} className="w-full h-11 rounded-full gradient-primary text-primary-foreground border-0 shadow-soft">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save profile"}
              </Button>
            </form>
          </Card>

          <h2 className="mt-6 mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground px-1 flex items-center gap-1.5">
            <History className="h-3.5 w-3.5" /> Recent diagnoses
          </h2>
          {diags.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No diagnoses yet.</p>
          ) : (
            <div className="space-y-2">
              {diags.map((d) => (
                <Card key={d.id} className="p-3 border-0 shadow-soft">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold">{d.disease}</p>
                      {d.crop && <p className="text-xs text-muted-foreground">{d.crop}</p>}
                    </div>
                    <p className="text-[11px] text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
