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