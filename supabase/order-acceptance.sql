-- ============================================================
-- Order acceptance + hide cancelled/rejected orders
-- Run in Supabase SQL Editor after delivery-confirmation.sql
-- ============================================================

-- 1. Add rejected status (admin declined the order)
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

-- 2. One active order per buyer (archived orders don't count)
drop index if exists build_requests_buyer_id_unique;
drop index if exists build_requests_one_active_per_buyer;
create unique index if not exists build_requests_one_active_per_buyer
  on public.build_requests (buyer_id)
  where status not in ('confirmed', 'cancelled', 'rejected');

-- 3. Buyer can: confirm delivery, report not received, or cancel their order
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
