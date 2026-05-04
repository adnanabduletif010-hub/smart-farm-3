-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'farmer', -- 'farmer' | 'expert' | 'buyer'
  location TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Marketplace listings (both 'sell' = farmer selling produce, 'supply' = inputs for farmers)
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'sell', -- 'sell' | 'supply'
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'kg',
  quantity NUMERIC(12,2),
  location TEXT,
  image_url TEXT,
  contact TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Listings viewable by everyone" ON public.listings FOR SELECT USING (true);
CREATE POLICY "Users insert own listings" ON public.listings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own listings" ON public.listings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own listings" ON public.listings FOR DELETE USING (auth.uid() = user_id);

-- Research feed (publications)
CREATE TABLE public.research_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  summary TEXT,
  source TEXT,
  url TEXT,
  topic TEXT,
  image_url TEXT,
  published_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.research_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Research viewable by everyone" ON public.research_posts FOR SELECT USING (true);
CREATE POLICY "Authenticated insert research" ON public.research_posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE TABLE public.research_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.research_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.research_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments viewable by everyone" ON public.research_comments FOR SELECT USING (true);
CREATE POLICY "Users add own comments" ON public.research_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own comments" ON public.research_comments FOR DELETE USING (auth.uid() = user_id);

-- Expert messages (simple farmer<->expert chat thread by question)
CREATE TABLE public.expert_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT,
  question TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.expert_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Questions viewable by everyone" ON public.expert_questions FOR SELECT USING (true);
CREATE POLICY "Users ask own questions" ON public.expert_questions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.expert_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.expert_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.expert_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Replies viewable by everyone" ON public.expert_replies FOR SELECT USING (true);
CREATE POLICY "Users add own replies" ON public.expert_replies FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Diagnosis history
CREATE TABLE public.diagnoses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  crop TEXT,
  image_url TEXT,
  disease TEXT,
  confidence TEXT,
  scientific_solution TEXT,
  home_remedy TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.diagnoses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own diagnoses" ON public.diagnoses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own diagnoses" ON public.diagnoses FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage bucket for crop photos & listings
INSERT INTO storage.buckets (id, name, public) VALUES ('crop-photos', 'crop-photos', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('listing-photos', 'listing-photos', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Crop photos publicly readable" ON storage.objects FOR SELECT USING (bucket_id = 'crop-photos');
CREATE POLICY "Users upload own crop photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'crop-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Listing photos publicly readable" ON storage.objects FOR SELECT USING (bucket_id = 'listing-photos');
CREATE POLICY "Users upload own listing photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'listing-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
-- Allow anonymous posting on research, comments, questions, replies, diagnoses
-- Marketplace listings remain auth-gated (money exchange)

ALTER TABLE public.research_posts ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.research_comments ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.expert_questions ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.expert_replies ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.diagnoses ALTER COLUMN user_id DROP NOT NULL;

-- research_posts: replace insert policy to allow anyone
DROP POLICY IF EXISTS "Authenticated insert research" ON public.research_posts;
CREATE POLICY "Anyone can insert research"
ON public.research_posts FOR INSERT
WITH CHECK (
  (auth.uid() IS NULL AND user_id IS NULL)
  OR (auth.uid() = user_id)
);

-- research_comments
DROP POLICY IF EXISTS "Users add own comments" ON public.research_comments;
CREATE POLICY "Anyone can add comments"
ON public.research_comments FOR INSERT
WITH CHECK (
  (auth.uid() IS NULL AND user_id IS NULL)
  OR (auth.uid() = user_id)
);

-- expert_questions
DROP POLICY IF EXISTS "Users ask own questions" ON public.expert_questions;
CREATE POLICY "Anyone can ask questions"
ON public.expert_questions FOR INSERT
WITH CHECK (
  (auth.uid() IS NULL AND user_id IS NULL)
  OR (auth.uid() = user_id)
);

-- expert_replies
DROP POLICY IF EXISTS "Users add own replies" ON public.expert_replies;
CREATE POLICY "Anyone can add replies"
ON public.expert_replies FOR INSERT
WITH CHECK (
  (auth.uid() IS NULL AND user_id IS NULL)
  OR (auth.uid() = user_id)
);

-- diagnoses: allow anonymous saves too (optional history)
DROP POLICY IF EXISTS "Users insert own diagnoses" ON public.diagnoses;
CREATE POLICY "Anyone can insert diagnoses"
ON public.diagnoses FOR INSERT
WITH CHECK (
  (auth.uid() IS NULL AND user_id IS NULL)
  OR (auth.uid() = user_id)
);
-- IoT soil sensor readings table
CREATE TABLE public.soil_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  device_name TEXT,
  field_name TEXT,
  moisture NUMERIC,         -- %
  nitrogen NUMERIC,         -- mg/kg
  phosphorus NUMERIC,       -- mg/kg
  potassium NUMERIC,        -- mg/kg
  ph NUMERIC,               -- 0-14
  temperature NUMERIC,      -- Â°C
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'manual',  -- manual | simulated | device
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.soil_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Readings viewable by everyone"
ON public.soil_readings FOR SELECT USING (true);

CREATE POLICY "Anyone can insert readings"
ON public.soil_readings FOR INSERT
WITH CHECK (
  (auth.uid() IS NULL AND user_id IS NULL)
  OR (auth.uid() = user_id)
);

CREATE POLICY "Users delete own readings"
ON public.soil_readings FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX idx_soil_readings_created_at ON public.soil_readings (created_at DESC);
CREATE INDEX idx_soil_readings_user ON public.soil_readings (user_id, created_at DESC);

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
DROP POLICY IF EXISTS "Readings viewable by everyone" ON public.soil_readings;

CREATE POLICY "Users view own readings"
  ON public.soil_readings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anonymous readings publicly readable"
  ON public.soil_readings FOR SELECT
  USING (user_id IS NULL);
-- Per-user device tokens for IoT sensors to authenticate against the public ingest endpoint
CREATE TABLE public.iot_device_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  device_name text NOT NULL,
  field_name text,
  token text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);

CREATE INDEX iot_device_tokens_user_id_idx ON public.iot_device_tokens(user_id);
CREATE INDEX iot_device_tokens_token_idx ON public.iot_device_tokens(token);

ALTER TABLE public.iot_device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own device tokens"
  ON public.iot_device_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create own device tokens"
  ON public.iot_device_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own device tokens"
  ON public.iot_device_tokens FOR DELETE
  USING (auth.uid() = user_id);
-- 1) App roles + user_roles + has_role helper
create type public.app_role as enum ('admin', 'moderator', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and role = _role
  )
$$;

create policy "Users view own roles"
  on public.user_roles for select
  using (auth.uid() = user_id);

create policy "Admins view all roles"
  on public.user_roles for select
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins manage roles"
  on public.user_roles for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- 2) Allow users to update/delete their own expert questions & replies
create policy "Users update own questions"
  on public.expert_questions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own questions"
  on public.expert_questions for delete
  using (auth.uid() = user_id);

create policy "Users update own replies"
  on public.expert_replies for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own replies"
  on public.expert_replies for delete
  using (auth.uid() = user_id);

-- 3) Crop guides table managed by admins
create table public.crop_guides (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  emoji text,
  name_en text not null,
  name_om text,
  name_am text,
  zone_en text, zone_om text, zone_am text,
  spacing_en text, spacing_om text, spacing_am text,
  soil_en text, soil_om text, soil_am text,
  fertilizer_en text, fertilizer_om text, fertilizer_am text,
  water_en text, water_om text, water_am text,
  pests_en text, pests_om text, pests_am text,
  harvest_en text, harvest_om text, harvest_am text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.crop_guides enable row level security;

create policy "Crop guides viewable by everyone"
  on public.crop_guides for select using (true);

create policy "Admins insert crop guides"
  on public.crop_guides for insert
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins update crop guides"
  on public.crop_guides for update
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins delete crop guides"
  on public.crop_guides for delete
  using (public.has_role(auth.uid(), 'admin'));

create trigger update_crop_guides_updated_at
before update on public.crop_guides
for each row execute function public.update_updated_at_column();
revoke execute on function public.has_role(uuid, public.app_role) from public, anon, authenticated;
-- Account type enum and column on profiles
DO $$ BEGIN
  CREATE TYPE public.account_type AS ENUM ('farmer','expert','research_center');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type public.account_type;

-- Helper: get current user's account_type
CREATE OR REPLACE FUNCTION public.current_account_type()
RETURNS public.account_type
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT account_type FROM public.profiles WHERE user_id = auth.uid()
$$;

-- Tighten research_posts: only research_center (or admin) can insert
DROP POLICY IF EXISTS "Anyone can insert research" ON public.research_posts;
CREATE POLICY "Research centers insert research"
  ON public.research_posts FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (public.current_account_type() = 'research_center' OR public.has_role(auth.uid(),'admin'))
  );
CREATE POLICY "Authors update own research"
  ON public.research_posts FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authors delete own research"
  ON public.research_posts FOR DELETE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- Tighten expert_replies: only experts/research_centers (or admin) can answer
DROP POLICY IF EXISTS "Anyone can add replies" ON public.expert_replies;
CREATE POLICY "Experts add replies"
  ON public.expert_replies FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (public.current_account_type() IN ('expert','research_center') OR public.has_role(auth.uid(),'admin'))
  );

-- Videos table (instructional videos by experts/research centers)
CREATE TABLE IF NOT EXISTS public.videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  url text NOT NULL,
  topic text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Videos viewable by everyone"
  ON public.videos FOR SELECT USING (true);
CREATE POLICY "Experts post videos"
  ON public.videos FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (public.current_account_type() IN ('expert','research_center') OR public.has_role(auth.uid(),'admin'))
  );
CREATE POLICY "Owners update videos"
  ON public.videos FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners delete videos"
  ON public.videos FOR DELETE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
REVOKE EXECUTE ON FUNCTION public.current_account_type() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_account_type() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

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

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.current_account_type() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC;

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

-- Switch view to security_invoker (best practice)
DROP VIEW IF EXISTS public.listings_public;
CREATE VIEW public.listings_public
WITH (security_invoker = on) AS
SELECT id, user_id, type, title, description, category,
       price, unit, quantity, location, image_url, created_at
FROM public.listings;
REVOKE ALL ON public.listings_public FROM PUBLIC, anon;
GRANT SELECT ON public.listings_public TO authenticated;

-- Allow authenticated to SELECT listings rows (so the view works)â€¦
DROP POLICY IF EXISTS "Owners view own listings full row" ON public.listings;
CREATE POLICY "Authenticated can view listings rows"
ON public.listings
FOR SELECT
TO authenticated
USING (true);

-- â€¦but revoke column-level read on `contact` from regular users.
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

REVOKE EXECUTE ON FUNCTION public.get_listing_contact(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_account_type_self_change() FROM PUBLIC, anon, authenticated;

-- Remove the restriction that prevents users from changing their own account_type
DROP TRIGGER IF EXISTS profiles_block_account_type_self_change ON public.profiles;
DROP FUNCTION IF EXISTS public.prevent_account_type_self_change();

-- Update handle_new_user to pick up account_type from raw_user_meta_data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, account_type)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)),
    COALESCE((NEW.raw_user_meta_data->>'account_type')::public.account_type, 'farmer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
-- Update handle_new_user to NOT default account_type to 'farmer'
-- This ensures that users signing up via phone or Google get a NULL account_type,
-- which in turn triggers the AccountTypeGate dialog requiring them to select one.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, account_type)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)),
    (NEW.raw_user_meta_data->>'account_type')::public.account_type
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
