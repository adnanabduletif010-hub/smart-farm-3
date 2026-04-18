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