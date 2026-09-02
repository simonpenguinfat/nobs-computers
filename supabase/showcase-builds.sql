-- ============================================================
-- Past builds showcase (admin-managed gallery)
-- Run in Supabase SQL Editor
-- ============================================================

create table if not exists public.showcase_builds (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  image_url text not null default '',
  specs text[] not null default '{}',
  price text not null default '',
  built_date date,
  details text not null default '',
  use_case text not null default '',
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.showcase_builds enable row level security;

drop policy if exists "Anyone can view showcase builds" on public.showcase_builds;
create policy "Anyone can view showcase builds"
  on public.showcase_builds for select
  using (true);

drop policy if exists "Builders can insert showcase builds" on public.showcase_builds;
create policy "Builders can insert showcase builds"
  on public.showcase_builds for insert
  with check (public.is_builder());

drop policy if exists "Builders can update showcase builds" on public.showcase_builds;
create policy "Builders can update showcase builds"
  on public.showcase_builds for update
  using (public.is_builder());

drop policy if exists "Builders can delete showcase builds" on public.showcase_builds;
create policy "Builders can delete showcase builds"
  on public.showcase_builds for delete
  using (public.is_builder());

grant select on public.showcase_builds to anon, authenticated;
grant insert, update, delete on public.showcase_builds to authenticated;

-- Image storage bucket
insert into storage.buckets (id, name, public)
values ('build-images', 'build-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can view build images" on storage.objects;
create policy "Public can view build images"
  on storage.objects for select
  using (bucket_id = 'build-images');

drop policy if exists "Builders can upload build images" on storage.objects;
create policy "Builders can upload build images"
  on storage.objects for insert
  with check (bucket_id = 'build-images' and public.is_builder());

drop policy if exists "Builders can update build images" on storage.objects;
create policy "Builders can update build images"
  on storage.objects for update
  using (bucket_id = 'build-images' and public.is_builder());

drop policy if exists "Builders can delete build images" on storage.objects;
create policy "Builders can delete build images"
  on storage.objects for delete
  using (bucket_id = 'build-images' and public.is_builder());
