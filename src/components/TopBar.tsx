import { Link } from "@tanstack/react-router";
import { Leaf, LogIn, LogOut, User as UserIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function TopBar({ title, subtitle }: { title?: string; subtitle?: string }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  return (
    <header className="sticky top-0 z-30 glass border-b border-border/60">
      <div className="mx-auto max-w-2xl flex items-center justify-between px-4 py-3 gap-2">
        <Link to="/" className="flex items-center gap-2 group min-w-0">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl gradient-primary shadow-glow group-active:scale-95 transition">
            <Leaf className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </span>
          <div className="leading-tight min-w-0">
            <p className="text-[15px] font-bold tracking-tight truncate">{title ?? t("app.name")}</p>
            <p className="text-[11px] text-muted-foreground truncate">{subtitle ?? t("app.tagline")}</p>
          </div>
        </Link>
        <div className="flex items-center gap-1 shrink-0">
          <LanguageSwitcher compact />
          {user ? (
            <>
              <Link to="/profile" aria-label="Profile">
                <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full">
                  <UserIcon className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 rounded-full"
                onClick={() => supabase.auth.signOut()}
                aria-label={t("common.signOut")}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="rounded-full gradient-primary text-primary-foreground border-0 shadow-soft">
                <LogIn className="h-4 w-4 mr-1.5" /> {t("common.signIn")}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
