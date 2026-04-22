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
import { Plus, MapPin, Tag, Phone, Loader2, ShoppingBag, Sprout } from "lucide-react";
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

function MarketPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"sell" | "supply">("sell");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("type", tab)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setListings((data ?? []) as Listing[]);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, [tab]);

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
          <NewListingDialog
            type={tab}
            open={open}
            setOpen={setOpen}
            user={user}
            onCreated={load}
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
            listings.map((l, i) => (
              <Card
                key={l.id}
                className="p-4 border-0 shadow-soft hover:shadow-glow transition-all animate-fade-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
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
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function NewListingDialog({
  type, open, setOpen, user, onCreated,
}: {
  type: "sell" | "supply";
  open: boolean;
  setOpen: (v: boolean) => void;
  user: any;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    title: "", description: "", category: "", price: "", unit: "kg", quantity: "", location: "", contact: "",
  });
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in first");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("listings").insert({
      user_id: user.id,
      type,
      title: form.title,
      description: form.description || null,
      category: form.category || null,
      price: Number(form.price) || 0,
      unit: form.unit || null,
      quantity: form.quantity ? Number(form.quantity) : null,
      location: form.location || null,
      contact: form.contact || null,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Listing posted!");
    setOpen(false);
    setForm({ title: "", description: "", category: "", price: "", unit: "kg", quantity: "", location: "", contact: "" });
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" className="h-11 w-11 rounded-full gradient-primary text-primary-foreground border-0 shadow-glow shrink-0">
          <Plus className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New {type === "sell" ? "produce" : "supply"} listing</DialogTitle>
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
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <Button disabled={submitting} className="w-full rounded-full gradient-primary text-primary-foreground border-0 shadow-soft h-11">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post listing"}
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
