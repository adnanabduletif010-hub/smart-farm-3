import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast, Toaster } from "sonner";
import { Leaf, Loader2, Mail, Lock, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — FarmBridge" },
      { name: "description", content: "Sign in with email or Google to use the FarmBridge marketplace." },
    ],
  }),
  component: AuthPage,
});

type View = "signin" | "signup" | "forgot";

function AuthPage() {
  const nav = useNavigate();
  const { t } = useTranslation();
  const [view, setView] = useState<View>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // If already signed in, bounce home.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) nav({ to: "/" });
    });
  }, [nav]);

  async function googleSignIn() {
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(result.error.message ?? "Google sign-in failed");
        setGoogleLoading(false);
        return;
      }
      if (result.redirected) return; // browser will redirect
      nav({ to: "/" });
    } catch (e: any) {
      toast.error(e?.message ?? "Google sign-in failed");
      setGoogleLoading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (view === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { display_name: name.trim() || email.split("@")[0] },
          },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Account created — welcome!");
          nav({ to: "/" });
        } else {
          toast.success("Check your inbox to confirm your email.");
          setView("signin");
        }
      } else if (view === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        toast.success("Welcome back!");
        nav({ to: "/" });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Password reset email sent.");
        setView("signin");
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  const titleMap: Record<View, string> = {
    signin: "Sign in",
    signup: "Create your account",
    forgot: "Reset your password",
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-background via-secondary/30 to-accent/30">
      <Toaster position="top-center" richColors />
      <div className="w-full max-w-sm animate-scale-in">
        <div className="flex justify-end mb-2">
          <LanguageSwitcher />
        </div>
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-glow">
            <Leaf className="h-7 w-7 text-primary-foreground" strokeWidth={2.5} />
          </Link>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight">{t("app.name")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{titleMap[view]}</p>
        </div>

        <Card className="p-5 border-0 shadow-glow">
          <form onSubmit={submit} className="space-y-3">
            {view === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Display name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">
                <Mail className="inline h-3.5 w-3.5 mr-1" /> Email
              </Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@farm.com"
              />
            </div>

            {view !== "forgot" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">
                    <Lock className="inline h-3.5 w-3.5 mr-1" /> Password
                  </Label>
                  {view === "signin" && (
                    <button
                      type="button"
                      onClick={() => setView("forgot")}
                      className="text-[11px] text-primary hover:underline"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete={view === "signin" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full gradient-primary text-primary-foreground border-0 shadow-soft rounded-full h-11"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : view === "signin" ? (
                "Sign in"
              ) : view === "signup" ? (
                "Create account"
              ) : (
                "Send reset link"
              )}
            </Button>
          </form>

          {view !== "forgot" && (
            <>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                disabled={googleLoading}
                onClick={googleSignIn}
                className="w-full h-11 rounded-full font-semibold"
              >
                {googleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z" />
                    </svg>
                    Continue with Google
                  </>
                )}
              </Button>
            </>
          )}

          <div className="mt-4 text-center">
            {view === "signin" && (
              <button
                type="button"
                onClick={() => setView("signup")}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                New here? <span className="text-primary font-semibold">Create an account</span>
              </button>
            )}
            {view === "signup" && (
              <button
                type="button"
                onClick={() => setView("signin")}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Already have an account? <span className="text-primary font-semibold">Sign in</span>
              </button>
            )}
            {view === "forgot" && (
              <button
                type="button"
                onClick={() => setView("signin")}
                className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-3 w-3" /> Back to sign in
              </button>
            )}
          </div>
        </Card>

        <p className="text-center text-[11px] text-muted-foreground mt-4">
          Choose your account type (Farmer, Expert, Research Center) on your Profile after signing in.
        </p>
      </div>
    </div>
  );
}
