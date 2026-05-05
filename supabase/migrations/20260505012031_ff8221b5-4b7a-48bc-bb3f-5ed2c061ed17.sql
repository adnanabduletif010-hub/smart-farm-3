CREATE OR REPLACE FUNCTION public.current_account_type()
RETURNS account_type
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT account_type
  FROM public.profiles
  WHERE user_id = auth.uid()
  LIMIT 1
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.current_account_type() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_account_type() TO authenticated;

DROP POLICY IF EXISTS "Experts post videos" ON public.videos;
CREATE POLICY "Experts post videos"
ON public.videos
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.current_account_type() = ANY (ARRAY['expert'::account_type, 'research_center'::account_type])
);

DROP POLICY IF EXISTS "Experts add replies" ON public.expert_replies;
CREATE POLICY "Experts add replies"
ON public.expert_replies
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.current_account_type() = ANY (ARRAY['expert'::account_type, 'research_center'::account_type])
);

DROP POLICY IF EXISTS "Research centers insert research" ON public.research_posts;
CREATE POLICY "Research centers insert research"
ON public.research_posts
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.current_account_type() = 'research_center'::account_type
);