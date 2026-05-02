
REVOKE EXECUTE ON FUNCTION public.get_listing_contact(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_account_type_self_change() FROM PUBLIC, anon, authenticated;
