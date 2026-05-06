
-- Drop legacy trigger/function that blocked account_type changes (if still present)
DROP TRIGGER IF EXISTS profiles_block_account_type_self_change ON public.profiles;
DROP FUNCTION IF EXISTS public.prevent_account_type_self_change();

-- Likes
CREATE TABLE IF NOT EXISTS public.video_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (video_id, user_id)
);
ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes viewable by everyone" ON public.video_likes
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users like" ON public.video_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users remove own like" ON public.video_likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Comments
CREATE TABLE IF NOT EXISTS public.video_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.video_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments viewable by everyone" ON public.video_comments
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users comment" ON public.video_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own comment" ON public.video_comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Storage bucket for direct uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read videos bucket" ON storage.objects
  FOR SELECT USING (bucket_id = 'videos');
CREATE POLICY "Users upload own videos to bucket" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own videos in bucket" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own videos from bucket" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);
