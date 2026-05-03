import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast, Toaster } from "sonner";
import { Leaf, Loader2, Mail, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — FarmBridge" },
      { name: "description", content: "Sign in with phone number or email to buy and sell on the FarmBridge marketplace." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const { t } = useTranslation();
  const [googleLoading, setGoogleLoading] = useState(false);

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
      if (result.redirected) return;
      nav({ to: "/" });
    } catch (e: any) {
      toast.error(e?.message ?? "Google sign-in failed");
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-background via-secondary/30 to-accent/30">
      <Toaster position="top-center" richColors />
      <div className="w-full max-w-sm animate-scale-in">
        <div className="flex justify-end mb-2">
          <LanguageSwitcher />
        </div>
        <div className="text-center mb-6">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-glow animate-float">
            <Leaf className="h-7 w-7 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight">{t("app.name")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("auth.signInToUse")}</p>
          <p className="text-[11px] text-muted-foreground mt-1">{t("auth.diagnosisFree")}</p>
        </div>

        <Card className="p-5 border-0 shadow-glow">
          <Button
            type="button"
            variant="outline"
            disabled={googleLoading}
            onClick={googleSignIn}
            className="w-full h-11 rounded-full font-semibold mb-4"
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
                {t("auth.google")}
              </>
            )}
          </Button>

          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
              <span className="bg-card px-2 text-muted-foreground">{t("auth.or")}</span>
            </div>
          </div>

          <Tabs defaultValue="phone">
            <TabsList className="grid grid-cols-2 w-full h-11 bg-secondary/60 p-1 rounded-full mb-4">
              <TabsTrigger value="phone" className="rounded-full data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground">
                <Phone className="h-3.5 w-3.5 mr-1.5" /> {t("auth.phone")}
              </TabsTrigger>
              <TabsTrigger value="email" className="rounded-full data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground">
                <Mail className="h-3.5 w-3.5 mr-1.5" /> {t("auth.email")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="phone" className="mt-0">
              <PhoneForm onDone={() => nav({ to: "/" })} />
            </TabsContent>
            <TabsContent value="email" className="mt-0">
              <EmailForm onDone={() => nav({ to: "/" })} />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}

function PhoneForm({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      // Normalize: ensure E.164 format starting with +
      const normalized = phone.trim().startsWith("+") ? phone.trim() : `+${phone.trim().replace(/\D/g, "")}`;
      const { error } = await supabase.auth.signInWithOtp({ phone: normalized });
      if (error) throw error;
      setPhone(normalized);
      setStep("otp");
      toast.success("Code sent! Check your SMS.");
    } catch (err: any) {
      const msg = err?.message ?? "Could not send code";
      if (/provider/i.test(msg) || /not enabled/i.test(msg) || /unsupported/i.test(msg)) {
        toast.error("Phone sign-in is not enabled yet. Please use email for now.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: "sms" });
      if (error) throw error;
      toast.success("Welcome!");
      onDone();
    } catch (err: any) {
      toast.error(err?.message ?? "Invalid code");
    } finally {
      setLoading(false);
    }
  }

  if (step === "otp") {
    return (
      <form onSubmit={verifyOtp} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="otp">Enter the 6-digit code</Label>
          <Input
            id="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
            className="text-center text-lg tracking-widest h-12"
          />
          <p className="text-[11px] text-muted-foreground">Sent to {phone}</p>
        </div>
        <Button
          type="submit"
          disabled={loading || otp.length < 4}
          className="w-full gradient-primary text-primary-foreground border-0 shadow-soft rounded-full h-11"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & sign in"}
        </Button>
        <button
          type="button"
          className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setStep("phone")}
        >
          Use a different number
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={sendOtp} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone number</Label>
        <Input
          id="phone"
          type="tel"
          required
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+251 9XX XXX XXX"
        />
        <p className="text-[11px] text-muted-foreground">Include country code (e.g. +251 for Ethiopia).</p>
      </div>
      <Button
        type="submit"
        disabled={loading}
        className="w-full gradient-primary text-primary-foreground border-0 shadow-soft rounded-full h-11"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send SMS code"}
      </Button>
    </form>
  );
}

function EmailForm({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState<"farmer" | "expert" | "research_center">("farmer");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        // Persist chosen account type on the auto-created profile.
        if (data.user) {
          await supabase.from("profiles").update({ account_type: accountType }).eq("user_id", data.user.id);
        }
        toast.success("Account created! You're signed in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
      }
      onDone();
    } catch (err: any) {
      toast.error(err?.message ?? "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={submit} className="space-y-3">
        {mode === "signup" && (
          <div className="space-y-1.5">
            <Label htmlFor="name">Display name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>
        )}
        {mode === "signup" && (
          <div className="space-y-1.5">
            <Label htmlFor="acctype">{t("accountType.label")}</Label>
            <select
              id="acctype"
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as any)}
            >
              <option value="farmer">{t("accountType.farmer")}</option>
              <option value="expert">{t("accountType.expert")}</option>
              <option value="research_center">{t("accountType.researchCenter")}</option>
            </select>
            <p className="text-[11px] text-muted-foreground">{t("accountType.helper")}</p>
          </div>
        )}
        {mode === "signup" && false && (
          <div className="hidden" />
        )}
        {true && (
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
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
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
          />
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="w-full gradient-primary text-primary-foreground border-0 shadow-soft rounded-full h-11"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "signin" ? "Sign in" : "Create account"}
        </Button>
      </form>
      <button
        type="button"
        className="w-full text-center text-xs text-muted-foreground mt-4 hover:text-foreground transition"
        onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}
      >
        {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
      </button>
    </>
  );
}
