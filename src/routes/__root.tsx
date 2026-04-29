import { Outlet, createRootRoute, HeadContent, Scripts, Link } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import "@/i18n";
import { AccountTypeGate } from "@/components/AccountTypeGate";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center animate-fade-up">
        <h1 className="text-7xl font-bold gradient-primary bg-clip-text text-transparent">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This field has not been planted yet.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full gradient-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold shadow-glow"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#2d6a3e" },
      { title: "FarmBridge — AI Plant Doctor, Market & Experts for Farmers" },
      {
        name: "description",
        content:
          "FarmBridge connects farmers to AI crop diagnosis, weather, market buyers, agronomy experts and the latest research.",
      },
      { property: "og:title", content: "FarmBridge — AI Plant Doctor, Market & Experts for Farmers" },
      { property: "og:description", content: "FarmWise Connect empowers farmers with AI-driven insights, market access, and expert connections." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "FarmBridge — AI Plant Doctor, Market & Experts for Farmers" },
      { name: "description", content: "FarmWise Connect empowers farmers with AI-driven insights, market access, and expert connections." },
      { name: "twitter:description", content: "FarmWise Connect empowers farmers with AI-driven insights, market access, and expert connections." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/ddfaf3ba-a8af-42aa-bbd9-cf46e460c1c0/id-preview-24b22e49--1cf15f7c-59be-46d7-93de-9b641adfc229.lovable.app-1776771624310.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/ddfaf3ba-a8af-42aa-bbd9-cf46e460c1c0/id-preview-24b22e49--1cf15f7c-59be-46d7-93de-9b641adfc229.lovable.app-1776771624310.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "icon", href: "/icon-192.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/icon-192.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <>
      <Outlet />
      <AccountTypeGate />
      <Toaster />
    </>
  );
}
