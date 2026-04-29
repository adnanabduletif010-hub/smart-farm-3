REVOKE EXECUTE ON FUNCTION public.current_account_type() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_account_type() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;