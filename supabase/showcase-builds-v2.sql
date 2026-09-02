-- ============================================================
-- Showcase builds: price rename, built date, full details
-- Run in Supabase SQL Editor (after showcase-builds.sql)
-- ============================================================

-- Rename budget → price (skip if already renamed)
do $$ begin
  alter table public.showcase_builds rename column budget to price;
exception
  when undefined_column then null;
end $$;

alter table public.showcase_builds
  add column if not exists built_date date;

alter table public.showcase_builds
  add column if not exists details text not null default '';

-- Ensure price column exists for fresh partial setups
alter table public.showcase_builds
  add column if not exists price text not null default '';
