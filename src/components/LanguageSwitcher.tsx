import { useTranslation } from "react-i18next";
import { LANGS } from "@/i18n";
import { Languages } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { i18n, t } = useTranslation();
  const current = LANGS.find((l) => l.code === i18n.language) ?? LANGS[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size={compact ? "icon" : "sm"}
          variant="ghost"
          className={compact ? "h-9 w-9 rounded-full" : "h-9 rounded-full gap-1.5"}
          aria-label={t("common.language")}
        >
          <Languages className="h-4 w-4" />
          {!compact && <span className="text-xs font-semibold">{current.code.toUpperCase()}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px]">
        {LANGS.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => i18n.changeLanguage(l.code)}
            className={l.code === current.code ? "bg-accent font-semibold" : ""}
          >
            <span className="mr-2">{l.flag}</span>
            {l.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
