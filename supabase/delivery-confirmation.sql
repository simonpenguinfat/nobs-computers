-- ============================================================
-- Delivery confirmation flow
-- Run in Supabase SQL Editor after fix-all-security.sql
-- ============================================================

-- 1. Add new statuses: confirmed (archived), not_received (back to admin)
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
    'not_received'
  ));

-- 2. Allow one active build per buyer (confirmed builds don't count)
drop index if exists build_requests_buyer_id_unique;
create unique index if not exists build_requests_one_active_per_buyer
  on public.build_requests (buyer_id)
  where status not in ('confirmed');

-- 3. Let buyers confirm delivery or report not received
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
