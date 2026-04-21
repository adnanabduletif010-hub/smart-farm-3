import { Link, useLocation } from "@tanstack/react-router";
import { Home, Leaf, ShoppingBag, BookOpen, MessageCircle, Droplets, Sprout } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", labelKey: "nav.home", icon: Home },
  { to: "/diagnose", labelKey: "nav.diagnose", icon: Leaf },
  { to: "/iot", labelKey: "nav.iot", icon: Droplets },
  { to: "/guides", labelKey: "nav.guides", icon: Sprout },
  { to: "/market", labelKey: "nav.market", icon: ShoppingBag },
  { to: "/research", labelKey: "nav.research", icon: BookOpen },
  { to: "/experts", labelKey: "nav.experts", icon: MessageCircle },
] as const;

export function BottomNav() {
  const loc = useLocation();
  const { t } = useTranslation();
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 glass border-t border-border/60 pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      <ul className="mx-auto max-w-2xl grid grid-cols-7">
        {items.map(({ to, labelKey, icon: Icon }) => {
          const active = to === "/" ? loc.pathname === "/" : loc.pathname.startsWith(to);
          return (
            <li key={to}>
              <Link
                to={to}
                className={cn(
                  "group flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-all",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-2xl transition-all duration-300",
                    active
                      ? "gradient-primary text-primary-foreground shadow-glow scale-110"
                      : "group-hover:bg-accent/60 group-active:scale-95",
                  )}
                >
                  <Icon className="h-[16px] w-[16px]" strokeWidth={active ? 2.5 : 2} />
                </span>
                <span className={cn("transition-opacity truncate max-w-full px-0.5", active && "font-semibold")}>
                  {t(labelKey)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
