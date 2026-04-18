import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { Toaster } from "@/components/ui/sonner";

export function AppShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopBar title={title} subtitle={subtitle} />
      <main className="flex-1 pb-24">
        <div className="mx-auto max-w-2xl px-4 py-4 animate-fade-in">{children}</div>
      </main>
      <BottomNav />
      <Toaster position="top-center" richColors />
    </div>
  );
}
