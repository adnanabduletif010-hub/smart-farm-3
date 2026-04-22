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