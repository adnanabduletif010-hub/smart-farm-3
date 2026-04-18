import { Link, useLocation } from "@tanstack/react-router";
import { Home, Leaf, ShoppingBag, BookOpen, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/diagnose", label: "AI Doctor", icon: Leaf },
  { to: "/market", label: "Market", icon: ShoppingBag },
  { to: "/research", label: "Research", icon: BookOpen },
  { to: "/experts", label: "Experts", icon: MessageCircle },
] as const;

export function BottomNav() {
  const loc = useLocation();
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 glass border-t border-border/60 pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      <ul className="mx-auto max-w-2xl grid grid-cols-5">
        {items.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? loc.pathname === "/" : loc.pathname.startsWith(to);
          return (
            <li key={to}>
              <Link
                to={to}
                className={cn(
                  "group flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium transition-all",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-2xl transition-all duration-300",
                    active
                      ? "gradient-primary text-primary-foreground shadow-glow scale-110"
                      : "group-hover:bg-accent/60 group-active:scale-95",
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.5 : 2} />
                </span>
                <span className={cn("transition-opacity", active && "font-semibold")}>
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
