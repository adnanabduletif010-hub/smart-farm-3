
-- Switch view to security_invoker (best practice)
DROP VIEW IF EXISTS public.listings_public;
CREATE VIEW public.listings_public
WITH (security_invoker = on) AS
SELECT id, user_id, type, title, description, category,
       price, unit, quantity, location, image_url, created_at
FROM public.listings;
REVOKE ALL ON public.listings_public FROM PUBLIC, anon;
GRANT SELECT ON public.listings_public TO authenticated;

-- Allow authenticated to SELECT listings rows (so the view works)…
DROP POLICY IF EXISTS "Owners view own listings full row" ON public.listings;
CREATE POLICY "Authenticated can view listings rows"
ON public.listings
FOR SELECT
TO authenticated
USING (true);

-- …but revoke column-level read on `contact` from regular users.
-- Grant explicit SELECT on every other column to authenticated.
REVOKE SELECT ON public.listings FROM authenticated, anon, PUBLIC;
GRANT SELECT (id, user_id, type, title, description, category,
              price, unit, quantity, location, image_url, created_at)
  ON public.listings TO authenticated;

-- Owners need to read their own contact too. Postgres column privileges
-- can't be conditional, so we expose contact through a SECURITY DEFINER
-- RPC that returns the contact only for the row owner.
CREATE OR REPLACE FUNCTION public.get_listing_contact(_listing_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT contact
  FROM public.listings
  WHERE id = _listing_id
    AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
$$;

REVOKE EXECUTE ON FUNCTION public.get_listing_contact(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_listing_contact(uuid) TO authenticated;
