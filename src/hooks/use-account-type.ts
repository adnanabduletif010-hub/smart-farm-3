import { useAuth } from "./use-auth";

export type { AccountType } from "@/components/AuthProvider";

export function useAccountType() {
  const { profile, loading, refreshProfile } = useAuth();
  
  const accountType = profile?.account_type ?? null;

  const canPublishResearch = accountType === "research_center";
  const canAnswerExperts = accountType === "expert" || accountType === "research_center";
  const canPostVideos = accountType === "expert" || accountType === "research_center";

  const isFarmer = accountType === "farmer";
  const isExpert = accountType === "expert";
  const isResearch = accountType === "research_center";

  return { 
    accountType, 
    loading, 
    refresh: refreshProfile, 
    canPublishResearch, 
    canAnswerExperts, 
    canPostVideos,
    isFarmer,
    isExpert,
    isResearch
  };
}
