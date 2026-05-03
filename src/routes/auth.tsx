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
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { 
              display_name: name || email.split("@")[0],
              account_type: accountType
            },
          },
        });
        if (error) throw error;
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
            <Label htmlFor="accountType">{t("accountType.label")}</Label>
            <select
              id="accountType"
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-shadow"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as any)}
            >
              <option value="farmer">{t("accountType.farmer")}</option>
              <option value="expert">{t("accountType.expert")}</option>
              <option value="research_center">{t("accountType.researchCenter")}</option>
            </select>
          </div>
        )}
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
