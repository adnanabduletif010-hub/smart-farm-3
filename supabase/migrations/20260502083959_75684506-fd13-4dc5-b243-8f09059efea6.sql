
-- Restrict profiles to authenticated users only
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles viewable by authenticated users"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Revoke EXECUTE on SECURITY DEFINER helper functions from anon role.
-- These are used inside RLS policies (called as part of has_role/current_account_type checks);
-- they don't need to be directly callable via PostgREST by anonymous users.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.current_account_type() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
-- update_updated_at_column is a trigger function; revoke too
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;
