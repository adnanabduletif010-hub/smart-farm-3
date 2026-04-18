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