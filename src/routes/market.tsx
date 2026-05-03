import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, MapPin, Tag, Phone, Loader2, ShoppingBag, Sprout, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/market")({
  head: () => ({
    meta: [
      { title: "Marketplace — FarmBridge" },
      { name: "description", content: "Buy and sell crops, supplies and tools. Connect with local buyers." },
    ],
  }),
  component: MarketPage,
});

type Listing = {
  id: string;
  user_id: string;
  type: "sell" | "supply";
  title: string;
  description: string | null;
  category: string | null;
  price: number;
  unit: string | null;
  quantity: number | null;
  location: string | null;
  contact: string | null;
  image_url: string | null;
  created_at: string;
};

type FormState = {
  title: string; description: string; category: string;
  price: string; unit: string; quantity: string;
  location: string; contact: string; image_url: string;
};

const emptyForm: FormState = { title: "", description: "", category: "", price: "", unit: "kg", quantity: "", location: "", contact: "", image_url: "" };

function MarketPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"sell" | "supply">("sell");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Listing | null>(null);

  async function load() {
    setLoading(true);
    // Always browse via the listings_public view (excludes contact column).
    // Owners' contact is fetched lazily via the get_listing_contact RPC.
    const { data, error } = await supabase
      .from("listings_public" as any)
      .select("*")
      .eq("type", tab)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    let rows = ((data ?? []) as unknown) as Listing[];
    if (user) {
      const myIds = rows.filter((r) => r.user_id === user.id).map((r) => r.id);
      if (myIds.length) {
        const contacts = await Promise.all(
          myIds.map((id) =>
            supabase.rpc("get_listing_contact", { _listing_id: id }).then((r) => ({ id, c: (r.data as string) ?? null }))
          )
        );
        const map = new Map(contacts.map((x) => [x.id, x.c]));
        rows = rows.map((r) => (map.has(r.id) ? { ...r, contact: map.get(r.id) ?? null } : r));
      }
    }
    setListings(rows);
    setLoading(false);
  }
  useEffect(() => { load(); }, [tab, user]);

  async function deleteListing(l: Listing) {
    if (!confirm(`Delete "${l.title}"?`)) return;
    const { error } = await supabase.from("listings").delete().eq("id", l.id);
    if (error) return toast.error(error.message);
    toast.success("Listing deleted");
    load();
  }

  return (
    <AppShell title="Marketplace" subtitle="Buy, sell, connect">
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <div className="flex items-center gap-2 mb-3">
          <TabsList className="grid grid-cols-2 flex-1 h-11 bg-secondary/60 p-1 rounded-full">
            <TabsTrigger value="sell" className="rounded-full data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-soft">
              <ShoppingBag className="h-3.5 w-3.5 mr-1.5" /> Produce
            </TabsTrigger>
            <TabsTrigger value="supply" className="rounded-full data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-soft">
              <Sprout className="h-3.5 w-3.5 mr-1.5" /> Supplies
            </TabsTrigger>
          </TabsList>
          <ListingDialog
            mode="create"
            type={tab}
            open={open}
            setOpen={setOpen}
            user={user}
            onSaved={load}
          />
        </div>

        <TabsContent value={tab} className="mt-0 space-y-3">
          {loading ? (
            <div className="py-10 text-center text-muted-foreground"><Loader2 className="h-5 w-5 mx-auto animate-spin" /></div>
          ) : listings.length === 0 ? (
            <Card className="p-8 text-center border-0 shadow-soft">
              <p className="text-sm text-muted-foreground">No listings yet.</p>
              <p className="text-xs text-muted-foreground mt-1">Tap + to be the first.</p>
            </Card>
          ) : (
            listings.map((l, i) => {
              const mine = user && l.user_id === user.id;
              return (
                <Card
                  key={l.id}
                  className="p-4 border-0 shadow-soft hover:shadow-glow transition-all animate-fade-up"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  {l.image_url && (
                    <img src={l.image_url} alt={l.title} className="w-full h-40 object-cover rounded-xl mb-3" loading="lazy" />
                  )}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-base leading-tight">{l.title}</h3>
                      {l.category && (
                        <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          <Tag className="h-3 w-3" /> {l.category}
                        </span>
                      )}
                      {l.description && <p className="text-sm text-foreground/80 mt-1.5 line-clamp-2">{l.description}</p>}
                      <div className="flex flex-wrap gap-3 mt-2.5 text-xs text-muted-foreground">
                        {l.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{l.location}</span>}
                        {l.contact && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{l.contact}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xl font-extrabold gradient-primary bg-clip-text text-transparent">
                        {Number(l.price).toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-xs font-bold">Birr</span>
                      </p>
                      {l.unit && <p className="text-[10px] text-muted-foreground uppercase font-bold">per {l.unit}</p>}
                      {l.quantity != null && <p className="text-[10px] text-muted-foreground mt-1">{l.quantity} avail.</p>}
                    </div>
                  </div>
                  {mine && (
                    <div className="flex justify-end gap-1 mt-2 pt-2 border-t border-border/60">
                      <Button size="sm" variant="ghost" onClick={() => setEditing(l)} className="h-8">
                        <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteListing(l)} className="h-8 text-destructive">
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>

      {editing && (
        <ListingDialog
          mode="edit"
          type={editing.type}
          existing={editing}
          open={!!editing}
          setOpen={(v) => { if (!v) setEditing(null); }}
          user={user}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </AppShell>
  );
}

function ListingDialog({
  mode, type, open, setOpen, user, onSaved, existing,
}: {
  mode: "create" | "edit";
  type: "sell" | "supply";
  open: boolean;
  setOpen: (v: boolean) => void;
  user: any;
  onSaved: () => void;
  existing?: Listing;
}) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (mode === "edit" && existing) {
      (async () => {
        let contact = existing.contact ?? "";
        if (!contact) {
          const { data } = await supabase.rpc("get_listing_contact", { _listing_id: existing.id });
          contact = (data as string) ?? "";
        }
        setForm({
          title: existing.title,
          description: existing.description ?? "",
          category: existing.category ?? "",
          price: String(existing.price ?? ""),
          unit: existing.unit ?? "kg",
          quantity: existing.quantity != null ? String(existing.quantity) : "",
          location: existing.location ?? "",
          contact,
          image_url: existing.image_url ?? "",
        });
      })();
    } else if (mode === "create") {
      setForm(emptyForm);
    }
  }, [mode, existing, open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return toast.error("Please sign in first");
    setSubmitting(true);
    const payload = {
      type,
      title: form.title,
      description: form.description || null,
      category: form.category || null,
      price: Number(form.price) || 0,
      unit: form.unit || null,
      quantity: form.quantity ? Number(form.quantity) : null,
      location: form.location || null,
      contact: form.contact || null,
      image_url: form.image_url || null,
    };
    const { error } = mode === "edit" && existing
      ? await supabase.from("listings").update(payload).eq("id", existing.id)
      : await supabase.from("listings").insert({ ...payload, user_id: user.id });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success(mode === "edit" ? "Listing updated!" : "Listing posted!");
    setOpen(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {mode === "create" && (
        <DialogTrigger asChild>
          <Button size="icon" className="h-11 w-11 rounded-full gradient-primary text-primary-foreground border-0 shadow-glow shrink-0">
            <Plus className="h-5 w-5" />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit listing" : `New ${type === "sell" ? "produce" : "supply"} listing`}
          </DialogTitle>
        </DialogHeader>
        {!user ? (
          <p className="text-sm text-muted-foreground">
            <Link to="/auth" className="text-primary font-semibold underline">Sign in</Link> to create a listing.
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <Field label="Title" required value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="Fresh tomatoes" />
            <Field label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} placeholder="Vegetable / Fertilizer / Seed…" />
            <div className="grid grid-cols-3 gap-2">
              <Field label="Price (Birr)" required value={form.price} onChange={(v) => setForm({ ...form, price: v })} type="number" placeholder="0" />
              <Field label="Unit" value={form.unit} onChange={(v) => setForm({ ...form, unit: v })} placeholder="kg" />
              <Field label="Qty" value={form.quantity} onChange={(v) => setForm({ ...form, quantity: v })} type="number" placeholder="0" />
            </div>
            <Field label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} placeholder="Town, region" />
            <Field label="Contact" value={form.contact} onChange={(v) => setForm({ ...form, contact: v })} placeholder="Phone / WhatsApp" />
            <div className="space-y-1.5">
              <Label>Product photo</Label>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !user) return;
                  if (file.size > 8 * 1024 * 1024) return toast.error("Image too large (max 8 MB)");
                  const ext = file.name.split(".").pop() || "jpg";
                  const path = `${user.id}/${Date.now()}.${ext}`;
                  const { error: upErr } = await supabase.storage.from("listing-photos").upload(path, file, { upsert: false });
                  if (upErr) return toast.error(upErr.message);
                  const { data: pub } = supabase.storage.from("listing-photos").getPublicUrl(path);
                  setForm((f) => ({ ...f, image_url: pub.publicUrl }));
                  toast.success("Photo uploaded");
                }}
                className="block w-full text-sm"
              />
              {form.image_url && <img src={form.image_url} alt="preview" className="rounded-lg max-h-40 mt-2" />}
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <Button disabled={submitting} className="w-full rounded-full gradient-primary text-primary-foreground border-0 shadow-soft h-11">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (mode === "edit" ? "Save changes" : "Post listing")}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label, value, onChange, placeholder, required, type,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean; type?: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}{required && " *"}</Label>
      <Input type={type ?? "text"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} />
    </div>
  );
}
