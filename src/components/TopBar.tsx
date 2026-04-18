import { Link } from "@tanstack/react-router";
import { Leaf, LogIn, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function TopBar({ title, subtitle }: { title?: string; subtitle?: string }) {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-30 glass border-b border-border/60">
      <div className="mx-auto max-w-2xl flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary shadow-glow group-active:scale-95 transition">
            <Leaf className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </span>
          <div className="leading-tight">
            <p className="text-[15px] font-bold tracking-tight">{title ?? "FarmBridge"}</p>
            <p className="text-[11px] text-muted-foreground">{subtitle ?? "Grow smarter, together"}</p>
          </div>
        </Link>
        {user ? (
          <div className="flex items-center gap-1.5">
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
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Link to="/auth">
            <Button size="sm" className="rounded-full gradient-primary text-primary-foreground border-0 shadow-soft">
              <LogIn className="h-4 w-4 mr-1.5" /> Sign in
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
}
