-- ============================================================
-- FIX: "infinite recursion detected in policy for profiles"
-- Run this ONCE in Supabase → SQL Editor → New query → Run
-- ============================================================

-- Helper function bypasses RLS so policies don't query profiles recursively
create or replace function public.is_builder()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'builder'
  );
$$;

grant execute on function public.is_builder() to authenticated;

-- Profiles
drop policy if exists "Builder can read all profiles" on public.profiles;
create policy "Builder can read all profiles"
  on public.profiles for select
  using (public.is_builder());

-- Build requests
drop policy if exists "Builder can read all requests" on public.build_requests;
create policy "Builder can read all requests"
  on public.build_requests for select
  using (public.is_builder());

drop policy if exists "Builder can update all requests" on public.build_requests;
create policy "Builder can update all requests"
  on public.build_requests for update
  using (public.is_builder());

-- Messages
drop policy if exists "Participants can read messages" on public.messages;
create policy "Participants can read messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.build_requests br
      where br.id = build_request_id
      and (br.buyer_id = auth.uid() or public.is_builder())
    )
  );

drop policy if exists "Participants can send messages" on public.messages;
create policy "Participants can send messages"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.build_requests br
      where br.id = build_request_id
      and (br.buyer_id = auth.uid() or public.is_builder())
    )
  );
