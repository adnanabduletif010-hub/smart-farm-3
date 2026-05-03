import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useAccountType, type AccountType } from "@/hooks/use-account-type";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sprout, GraduationCap, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export function AccountTypeGate() {
  const { user, loading: authLoading } = useAuth();
  const { accountType, loading, refresh } = useAccountType();
  const [saving, setSaving] = useState<AccountType>(null);
  const { t } = useTranslation();

  if (authLoading || loading) return null;
  if (!user) return null;
  if (accountType) return null;

  async function pick(value: Exclude<AccountType, null>) {
    setSaving(value);
    const { error } = await supabase
      .from("profiles")
      .update({ account_type: value })
      .eq("user_id", user!.id);
    
    if (error) {
      toast.error(error.message);
      setSaving(null);
    } else {
      toast.success(t("accountType.welcome"));
      refresh();
      setSaving(null);
    }
  }

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-md border-0 shadow-glow animate-scale-in sm:rounded-3xl" 
        onPointerDownOutside={(e) => e.preventDefault()} 
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-extrabold tracking-tight">
            {t("accountType.title")}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-2">
            {t("accountType.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          <RoleButton
            icon={Sprout}
            title={t("accountType.farmer")}
            desc={t("accountType.farmerDesc")}
            onClick={() => pick("farmer")}
            disabled={!!saving}
            isLoading={saving === "farmer"}
          />
          <RoleButton
            icon={GraduationCap}
            title={t("accountType.expert")}
            desc={t("accountType.expertDesc")}
            onClick={() => pick("expert")}
            disabled={!!saving}
            isLoading={saving === "expert"}
          />
          <RoleButton
            icon={Building2}
            title={t("accountType.researchCenter")}
            desc={t("accountType.researchCenterDesc")}
            onClick={() => pick("research_center")}
            disabled={!!saving}
            isLoading={saving === "research_center"}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RoleButton({ icon: Icon, title, desc, onClick, disabled, isLoading }: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="group flex items-start gap-4 p-4 rounded-2xl border border-border bg-card hover:bg-accent/50 hover:border-primary/50 transition-all text-left active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-leaf/20 text-primary group-hover:scale-110 transition-transform">
        {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Icon className="h-6 w-6" />}
      </div>
      <div>
        <p className="font-bold text-base">{title}</p>
        <p className="text-xs text-muted-foreground leading-snug mt-0.5 whitespace-normal">{desc}</p>
      </div>
    </button>
  );
}
