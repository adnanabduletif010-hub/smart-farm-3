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
  temperature NUMERIC,      -- °C
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