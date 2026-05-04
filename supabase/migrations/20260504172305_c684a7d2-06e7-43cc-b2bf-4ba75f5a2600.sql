
-- Restrict chat-attachments bucket SELECT to signed-in users only
drop policy if exists "Chat attachments are public" on storage.objects;
create policy "Chat attachments visible to authenticated"
  on storage.objects for select to authenticated
  using (bucket_id = 'chat-attachments');

-- Revoke execute on internal helpers (used only by triggers/RLS)
revoke execute on function public.is_conv_participant(uuid, uuid) from anon, authenticated, public;
revoke execute on function public.bump_conv_timestamp() from anon, authenticated, public;
