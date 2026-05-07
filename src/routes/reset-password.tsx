import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { confirmPasswordReset, updatePassword, onAuthStateChanged } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast, Toaster } from "sonner";
import { Leaf, Loader2, Lock } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [{ title: "Reset password — FarmBridge" }],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [oobCode, setOobCode] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("oobCode");
    if (code) {
      setOobCode(code);
      setReady(true);
    }

    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setReady(true);
    });
    return () => unsub();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      if (oobCode) {
        await confirmPasswordReset(auth, oobCode, password);
        toast.success("Password reset successful. You can now sign in.");
        nav({ to: "/auth" });
      } else if (auth.currentUser) {
        await updatePassword(auth.currentUser, password);
        toast.success("Password updated.");
        nav({ to: "/" });
      } else {
        toast.error("Session expired or invalid link");
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Could not update password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-background via-secondary/30 to-accent/30">
      <Toaster position="top-center" richColors />
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-glow">
            <Leaf className="h-7 w-7 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold">Set a new password</h1>
        </div>
        <Card className="p-5 border-0 shadow-glow">
          {!ready ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Open this page from the password reset link in your email.
            </p>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="pw"><Lock className="inline h-3.5 w-3.5 mr-1" /> New password</Label>
                <Input id="pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pw2">Confirm password</Label>
                <Input id="pw2" type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </div>
              <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground border-0 rounded-full h-11">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
