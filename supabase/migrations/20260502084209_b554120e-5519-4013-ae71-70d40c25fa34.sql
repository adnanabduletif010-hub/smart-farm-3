
-- 1) Prevent self-escalation of account_type
CREATE OR REPLACE FUNCTION public.prevent_account_type_self_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.account_type IS DISTINCT FROM OLD.account_type THEN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Only admins can change account_type';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_block_account_type_self_change ON public.profiles;
CREATE TRIGGER profiles_block_account_type_self_change
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_account_type_self_change();

-- 2) Restrict listings base SELECT to owners only.
-- All browsing must use the listings_public view (which excludes the contact column).
DROP POLICY IF EXISTS "Listings viewable by authenticated users" ON public.listings;
DROP POLICY IF EXISTS "Public can view non-contact listing fields" ON public.listings;

CREATE POLICY "Owners view own listings full row"
ON public.listings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Ensure listings_public view runs as the querying user so RLS on the
-- underlying table doesn't apply to the view's own SELECT, while still
-- limiting columns. We re-create with security_invoker off for this purpose
-- and grant SELECT to authenticated only.
DROP VIEW IF EXISTS public.listings_public;
CREATE VIEW public.listings_public
WITH (security_invoker = off) AS
SELECT id, user_id, type, title, description, category,
       price, unit, quantity, location, image_url, created_at
FROM public.listings;

REVOKE ALL ON public.listings_public FROM PUBLIC, anon;
GRANT SELECT ON public.listings_public TO authenticated;
