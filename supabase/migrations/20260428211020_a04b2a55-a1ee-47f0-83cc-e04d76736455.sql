-- 1) App roles + user_roles + has_role helper
create type public.app_role as enum ('admin', 'moderator', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and role = _role
  )
$$;

create policy "Users view own roles"
  on public.user_roles for select
  using (auth.uid() = user_id);

create policy "Admins view all roles"
  on public.user_roles for select
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins manage roles"
  on public.user_roles for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- 2) Allow users to update/delete their own expert questions & replies
create policy "Users update own questions"
  on public.expert_questions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own questions"
  on public.expert_questions for delete
  using (auth.uid() = user_id);

create policy "Users update own replies"
  on public.expert_replies for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own replies"
  on public.expert_replies for delete
  using (auth.uid() = user_id);

-- 3) Crop guides table managed by admins
create table public.crop_guides (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  emoji text,
  name_en text not null,
  name_om text,
  name_am text,
  zone_en text, zone_om text, zone_am text,
  spacing_en text, spacing_om text, spacing_am text,
  soil_en text, soil_om text, soil_am text,
  fertilizer_en text, fertilizer_om text, fertilizer_am text,
  water_en text, water_om text, water_am text,
  pests_en text, pests_om text, pests_am text,
  harvest_en text, harvest_om text, harvest_am text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.crop_guides enable row level security;

create policy "Crop guides viewable by everyone"
  on public.crop_guides for select using (true);

create policy "Admins insert crop guides"
  on public.crop_guides for insert
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins update crop guides"
  on public.crop_guides for update
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins delete crop guides"
  on public.crop_guides for delete
  using (public.has_role(auth.uid(), 'admin'));

create trigger update_crop_guides_updated_at
before update on public.crop_guides
for each row execute function public.update_updated_at_column();