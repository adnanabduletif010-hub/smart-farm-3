import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { toast } from "sonner";
import { Loader2, User as UserIcon, History, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — FarmBridge" }] }),
  component: ProfilePage,
});

type Profile = { display_name: string | null; role: string; location: string | null; bio: string | null; account_type: string | null };
type Diag = { id: string; crop: string | null; disease: string; created_at: string };

function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<Profile>({ display_name: "", role: "farmer", location: "", bio: "", account_type: null });
  const [diags, setDiags] = useState<Diag[]>([]);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const docRef = doc(db, "profiles", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setProfile(docSnap.data() as Profile);
        
        const dq = query(
          collection(db, "diagnoses"),
          where("user_id", "==", user.uid),
          orderBy("created_at", "desc"),
          limit(20)
        );
        const snapshot = await getDocs(dq);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Diag[];
        setDiags(data);
      } catch (e: any) {
        console.error("Error loading profile data:", e.message);
      } finally {
        setLoaded(true);
      }
    })();
  }, [user?.uid]);

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
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "profiles", user.uid), {
        display_name: profile.display_name, 
        role: profile.role, 
        location: profile.location, 
        bio: profile.bio,
        account_type: profile.account_type as "farmer" | "expert" | "research_center" | null,
      });
      toast.success("Profile saved");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
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
                <Label>{t("accountType.label")}</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={profile.account_type ?? ""}
                  onChange={(e) => setProfile({ ...profile, account_type: e.target.value || null })}
                >
                  <option value="" disabled>{t("accountType.select")}</option>
                  <option value="farmer">{t("accountType.farmer")}</option>
                  <option value="expert">{t("accountType.expert")}</option>
                  <option value="research_center">{t("accountType.researchCenter")}</option>
                </select>
                <p className="text-[11px] text-muted-foreground">{t("accountType.helper")}</p>
              </div>
              <div className="space-y-1.5">
                <Label>Role label</Label>
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
              <div className="space-y-1.5">
                <Label>Location</Label>
                <div className="flex gap-2">
                  <Input value={profile.location ?? ""} onChange={(e) => setProfile({ ...profile, location: e.target.value })} placeholder="Town, region" />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => {
                      if (!navigator.geolocation) return toast.error("Geolocation not supported");
                      toast.loading("Detecting location…", { id: "geo" });
                      navigator.geolocation.getCurrentPosition(
                        async (pos) => {
                          const { latitude, longitude } = pos.coords;
                          try {
                            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`);
                            const j = await res.json();
                            const a = j.address ?? {};
                            const place = [a.city || a.town || a.village || a.county, a.state, a.country].filter(Boolean).join(", ") || `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
                            setProfile((p) => ({ ...p, location: place }));
                            toast.success("Location detected", { id: "geo" });
                          } catch {
                            setProfile((p) => ({ ...p, location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` }));
                            toast.success("Coordinates set", { id: "geo" });
                          }
                        },
                        (err) => toast.error(err.message || "Location denied", { id: "geo" }),
                        { enableHighAccuracy: true, timeout: 10000 }
                      );
                    }}
                  >
                    <MapPin className="h-4 w-4 mr-1" /> Detect
                  </Button>
                </div>
              </div>
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
