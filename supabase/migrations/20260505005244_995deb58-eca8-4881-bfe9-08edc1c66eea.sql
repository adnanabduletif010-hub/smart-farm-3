
REVOKE SELECT (contact) ON public.listings FROM anon, authenticated;

DROP POLICY IF EXISTS "Anonymous readings publicly readable" ON public.soil_readings;

UPDATE storage.buckets SET public = false WHERE id = 'chat-attachments';

DROP POLICY IF EXISTS "Chat attachments visible to authenticated" ON storage.objects;
DROP POLICY IF EXISTS "Users upload own chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own chat attachments" ON storage.objects;

CREATE POLICY "Chat attachments readable by participants"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND public.is_conv_participant(
    ((storage.foldername(name))[1])::uuid,
    auth.uid()
  )
);

CREATE POLICY "Participants upload chat attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND (storage.foldername(name))[2] = auth.uid()::text
  AND public.is_conv_participant(
    ((storage.foldername(name))[1])::uuid,
    auth.uid()
  )
);

CREATE POLICY "Sender deletes own chat attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bump_conv_timestamp() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_account_type_self_change() FROM PUBLIC, anon, authenticated;
