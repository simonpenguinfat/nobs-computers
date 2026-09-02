-- ============================================================
-- Fix admin Decline Order button
-- Run in Supabase SQL Editor if decline shows an error
-- ============================================================

-- Allow "rejected" status (admin declined the order)
alter table public.build_requests
  drop constraint if exists build_requests_status_check;

alter table public.build_requests
  add constraint build_requests_status_check
  check (status in (
    'pending',
    'in_progress',
    'completed',
    'cancelled',
    'confirmed',
    'not_received',
    'rejected'
  ));

-- One active order per buyer (declined orders don't count)
drop index if exists build_requests_buyer_id_unique;
drop index if exists build_requests_one_active_per_buyer;
create unique index if not exists build_requests_one_active_per_buyer
  on public.build_requests (buyer_id)
  where status not in ('confirmed', 'cancelled', 'rejected');

-- Builder must be able to update orders
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

drop policy if exists "Builder can read all requests" on public.build_requests;
create policy "Builder can read all requests"
  on public.build_requests for select
  using (public.is_builder());

drop policy if exists "Builder can update all requests" on public.build_requests;
create policy "Builder can update all requests"
  on public.build_requests for update
  using (public.is_builder());

grant select, update on public.build_requests to authenticated;
