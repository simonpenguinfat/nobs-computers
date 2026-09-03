-- ============================================================
-- Suggested PC drafts + parts lists (admin quotes for buyers)
-- Run this ONCE in Supabase → SQL Editor → New query → Run
-- ============================================================

create table if not exists public.build_quotes (
  id uuid primary key default gen_random_uuid(),
  build_request_id uuid references public.build_requests(id) on delete cascade not null,
  title text not null default 'Draft',
  notes text not null default '',
  parts jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists build_quotes_request_idx
  on public.build_quotes (build_request_id, created_at);

alter table public.build_quotes enable row level security;

drop policy if exists "Buyers can read own quotes" on public.build_quotes;
create policy "Buyers can read own quotes"
  on public.build_quotes for select
  using (
    exists (
      select 1 from public.build_requests br
      where br.id = build_request_id
        and br.buyer_id = auth.uid()
    )
  );

drop policy if exists "Builder can read all quotes" on public.build_quotes;
create policy "Builder can read all quotes"
  on public.build_quotes for select
  using (public.is_builder());

drop policy if exists "Builder can insert quotes" on public.build_quotes;
create policy "Builder can insert quotes"
  on public.build_quotes for insert
  with check (public.is_builder());

drop policy if exists "Builder can update quotes" on public.build_quotes;
create policy "Builder can update quotes"
  on public.build_quotes for update
  using (public.is_builder());

drop policy if exists "Builder can delete quotes" on public.build_quotes;
create policy "Builder can delete quotes"
  on public.build_quotes for delete
  using (public.is_builder());

grant select, insert, update, delete on public.build_quotes to authenticated;
grant all on public.build_quotes to service_role;

do $$ begin
  alter publication supabase_realtime add table public.build_quotes;
exception when duplicate_object then null;
end $$;
