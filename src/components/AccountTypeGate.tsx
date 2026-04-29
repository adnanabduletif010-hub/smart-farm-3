import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useAccountType, type AccountType } from "@/hooks/use-account-type";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sprout, GraduationCap, FlaskConical } from "lucide-react";
import { toast } from "sonner";

const OPTIONS: { value: Exclude<AccountType, null>; title: string; desc: string; Icon: typeof Sprout }[] = [
  { value: "farmer", title: "Farmer", desc: "Grow crops, ask experts, browse the market", Icon: Sprout },
  { value: "expert", title: "Expert / Agronomist", desc: "Answer farmer questions, post how-to videos", Icon: GraduationCap },
  { value: "research_center", title: "Research Center", desc: "Publish research, post videos, answer questions", Icon: FlaskConical },
];

export function AccountTypeGate() {
  const { user, loading: authLoading } = useAuth();
  const { accountType, loading, refresh } = useAccountType();
  const [saving, setSaving] = useState<AccountType>(null);

  if (authLoading || loading) return null;
  if (!user) return null;
  if (accountType) return null;

  async function pick(value: Exclude<AccountType, null>) {
    setSaving(value);
    const { error } = await supabase
      .from("profiles")
      .update({ account_type: value })
      .eq("user_id", user!.id);
    setSaving(null);
    if (error) return toast.error(error.message);
    toast.success("Welcome!");
    refresh();
  }

  return (
    <Dialog open>
      <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Tell us who you are</DialogTitle>
          <DialogDescription>This sets what you can do in the app. You can ask an admin to change it later.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {OPTIONS.map(({ value, title, desc, Icon }) => (
            <Button
              key={value}
              variant="outline"
              disabled={!!saving}
              onClick={() => pick(value)}
              className="w-full h-auto justify-start gap-3 py-3 px-3 text-left"
            >
              <span className="h-9 w-9 rounded-xl gradient-primary text-primary-foreground flex items-center justify-center shrink-0">
                {saving === value ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold">{title}</span>
                <span className="block text-[11px] text-muted-foreground font-normal whitespace-normal">{desc}</span>
              </span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
