
-- 1) Listings: hide contact from anonymous users
DROP POLICY IF EXISTS "Listings viewable by everyone" ON public.listings;

CREATE POLICY "Listings viewable by authenticated users"
ON public.listings FOR SELECT
TO authenticated
USING (true);

-- Public view exposing listings WITHOUT contact info for anonymous browsing
CREATE OR REPLACE VIEW public.listings_public
WITH (security_invoker=on) AS
SELECT id, user_id, type, title, description, category, price, unit, quantity, location, image_url, created_at
FROM public.listings;

GRANT SELECT ON public.listings_public TO anon, authenticated;

CREATE POLICY "Public can view non-contact listing fields"
ON public.listings FOR SELECT
TO anon
USING (false);

-- 2) Soil readings: require authentication for inserts
DROP POLICY IF EXISTS "Anyone can insert readings" ON public.soil_readings;

CREATE POLICY "Authenticated users insert readings"
ON public.soil_readings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3) Storage: owner-scoped UPDATE/DELETE on crop-photos and listing-photos
CREATE POLICY "Users update own crop photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'crop-photos' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own crop photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'crop-photos' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own listing photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'listing-photos' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own listing photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'listing-photos' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 4) Restrict bucket listing/SELECT on storage objects to authenticated users
-- (Files remain accessible by direct public URL since buckets are public)
DROP POLICY IF EXISTS "Public read crop-photos" ON storage.objects;
DROP POLICY IF EXISTS "Public read listing-photos" ON storage.objects;

CREATE POLICY "Authenticated can list crop-photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'crop-photos');

CREATE POLICY "Authenticated can list listing-photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'listing-photos');
