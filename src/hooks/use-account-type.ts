import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export type AccountType = "farmer" | "expert" | "research_center" | null;

export function useAccountType() {
  const { user, loading: authLoading } = useAuth();
  const [accountType, setAccountType] = useState<AccountType>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setAccountType(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("account_type")
      .eq("user_id", user.id)
      .maybeSingle();
    setAccountType((data?.account_type as AccountType) ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    refresh();
  }, [authLoading, refresh]);

  const canPublishResearch = accountType === "research_center";
  const canAnswerExperts = accountType === "expert" || accountType === "research_center";
  const canPostVideos = accountType === "expert" || accountType === "research_center";

  return { accountType, loading, refresh, canPublishResearch, canAnswerExperts, canPostVideos };
}
