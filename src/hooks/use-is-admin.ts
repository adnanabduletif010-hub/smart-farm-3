import { useAuth } from "./use-auth";

export function useIsAdmin() {
  const { profile, loading } = useAuth();
  const isAdmin = profile?.role === "admin";
  return { isAdmin, loading };
}
