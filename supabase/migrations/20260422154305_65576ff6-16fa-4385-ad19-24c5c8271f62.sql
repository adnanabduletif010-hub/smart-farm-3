DROP POLICY IF EXISTS "Readings viewable by everyone" ON public.soil_readings;

CREATE POLICY "Users view own readings"
  ON public.soil_readings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anonymous readings publicly readable"
  ON public.soil_readings FOR SELECT
  USING (user_id IS NULL);