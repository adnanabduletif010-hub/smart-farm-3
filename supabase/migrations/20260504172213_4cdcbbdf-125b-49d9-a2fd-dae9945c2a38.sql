
-- ===== CONVERSATIONS =====
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_id uuid not null,
  seller_id uuid not null,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (listing_id, buyer_id)
);
create index idx_conv_buyer on public.conversations(buyer_id, last_message_at desc);
create index idx_conv_seller on public.conversations(seller_id, last_message_at desc);

alter table public.conversations enable row level security;

create policy "Participants view conversations"
  on public.conversations for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id or public.has_role(auth.uid(),'admin'));

create policy "Buyer creates conversation"
  on public.conversations for insert
  with check (auth.uid() = buyer_id);

create policy "Participants update conversation"
  on public.conversations for update
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

-- ===== MESSAGES =====
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null,
  body text,
  image_url text,
  created_at timestamptz not null default now()
);
create index idx_msg_conv on public.messages(conversation_id, created_at);

alter table public.messages enable row level security;

create or replace function public.is_conv_participant(_conv uuid, _user uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists (
    select 1 from public.conversations
    where id = _conv and (_user = buyer_id or _user = seller_id)
  );
$$;

create policy "Participants read messages"
  on public.messages for select
  using (public.is_conv_participant(conversation_id, auth.uid()) or public.has_role(auth.uid(),'admin'));

create policy "Participants send messages"
  on public.messages for insert
  with check (auth.uid() = sender_id and public.is_conv_participant(conversation_id, auth.uid()));

create policy "Sender deletes own message"
  on public.messages for delete
  using (auth.uid() = sender_id or public.has_role(auth.uid(),'admin'));

-- bump conversation last_message_at
create or replace function public.bump_conv_timestamp()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  update public.conversations set last_message_at = now() where id = new.conversation_id;
  return new;
end;
$$;

create trigger trg_bump_conv after insert on public.messages
for each row execute function public.bump_conv_timestamp();

-- ===== OFFERS =====
create table public.offers (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  sender_id uuid not null,
  price numeric not null check (price >= 0),
  quantity numeric not null check (quantity > 0),
  unit text,
  note text,
  status text not null default 'pending' check (status in ('pending','accepted','rejected','withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_offer_conv on public.offers(conversation_id, created_at desc);

alter table public.offers enable row level security;

create policy "Participants read offers"
  on public.offers for select
  using (public.is_conv_participant(conversation_id, auth.uid()) or public.has_role(auth.uid(),'admin'));

create policy "Participants create offers"
  on public.offers for insert
  with check (auth.uid() = sender_id and public.is_conv_participant(conversation_id, auth.uid()));

create policy "Participants update offers"
  on public.offers for update
  using (public.is_conv_participant(conversation_id, auth.uid()))
  with check (public.is_conv_participant(conversation_id, auth.uid()));

create trigger trg_offers_updated before update on public.offers
for each row execute function public.update_updated_at_column();

-- ===== ORDERS =====
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  buyer_id uuid not null,
  seller_id uuid not null,
  price numeric not null,
  quantity numeric not null,
  unit text,
  status text not null default 'confirmed'
    check (status in ('confirmed','shipped','delivered','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_order_buyer on public.orders(buyer_id, created_at desc);
create index idx_order_seller on public.orders(seller_id, created_at desc);

alter table public.orders enable row level security;

create policy "Participants read orders"
  on public.orders for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id or public.has_role(auth.uid(),'admin'));

create policy "Participants create orders"
  on public.orders for insert
  with check (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "Participants update orders"
  on public.orders for update
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

create trigger trg_orders_updated before update on public.orders
for each row execute function public.update_updated_at_column();

-- ===== STORAGE BUCKET =====
insert into storage.buckets (id, name, public)
values ('chat-attachments', 'chat-attachments', true)
on conflict (id) do nothing;

create policy "Chat attachments are public"
  on storage.objects for select
  using (bucket_id = 'chat-attachments');

create policy "Users upload own chat attachments"
  on storage.objects for insert
  with check (bucket_id = 'chat-attachments' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users delete own chat attachments"
  on storage.objects for delete
  using (bucket_id = 'chat-attachments' and auth.uid()::text = (storage.foldername(name))[1]);

-- ===== REALTIME =====
alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.offers;
alter publication supabase_realtime add table public.orders;

alter table public.conversations replica identity full;
alter table public.messages replica identity full;
alter table public.offers replica identity full;
alter table public.orders replica identity full;
