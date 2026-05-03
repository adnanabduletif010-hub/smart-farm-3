import { Outlet, createRootRoute, Link } from "@tanstack/react-router";
import "../styles.css";
import "@/i18n";
import { AccountTypeGate } from "@/components/AccountTypeGate";

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
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootComponent() {
  return (
    <>
      <Outlet />
      <AccountTypeGate />
    </>
  );
}
