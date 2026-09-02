-- ============================================================
-- Fix admin Decline + buyer Cancel order
-- Run in Supabase SQL Editor
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

-- Allow buyers to cancel pending/in-progress orders (fixes admin still seeing cancelled orders)
create or replace function public.enforce_buyer_build_request_update()
returns trigger as $$
begin
  if not public.is_builder() then
    if old.status = 'completed' and new.status in ('confirmed', 'not_received') then
      new.estimated_cost := old.estimated_cost;
      new.buyer_id := old.buyer_id;
      new.created_at := old.created_at;
      new.use_case := old.use_case;
      new.budget := old.budget;
      new.existing_parts := old.existing_parts;
      new.preferences := old.preferences;
    elsif old.status in ('pending', 'in_progress') and new.status = 'cancelled' then
      new.estimated_cost := old.estimated_cost;
      new.buyer_id := old.buyer_id;
      new.created_at := old.created_at;
      new.use_case := old.use_case;
      new.budget := old.budget;
      new.existing_parts := old.existing_parts;
      new.preferences := old.preferences;
    else
      new.status := old.status;
      new.estimated_cost := old.estimated_cost;
      new.buyer_id := old.buyer_id;
      new.created_at := old.created_at;
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists enforce_buyer_build_request_update_trigger on public.build_requests;
create trigger enforce_buyer_build_request_update_trigger
  before update on public.build_requests
  for each row execute function public.enforce_buyer_build_request_update();

-- Live updates on admin when buyer cancels
do $$ begin
  alter publication supabase_realtime add table public.build_requests;
exception when duplicate_object then null;
end $$;
