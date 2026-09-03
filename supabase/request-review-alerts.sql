-- ============================================================
-- Alerts for new requests + buyer updates
-- Run ONCE in Supabase → SQL Editor → New query → Run
-- ============================================================

alter table public.build_requests
  add column if not exists needs_review boolean not null default false;

alter table public.build_requests
  add column if not exists review_kind text;

alter table public.build_requests
  drop constraint if exists build_requests_review_kind_check;

alter table public.build_requests
  add constraint build_requests_review_kind_check
  check (review_kind is null or review_kind in ('new', 'updated'));

-- New buyer requests always start as unread alerts
create or replace function public.enforce_buyer_build_request_insert()
returns trigger as $$
begin
  if not public.is_builder() then
    new.needs_review := true;
    new.review_kind := 'new';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists enforce_buyer_build_request_insert_trigger on public.build_requests;
create trigger enforce_buyer_build_request_insert_trigger
  before insert on public.build_requests
  for each row execute function public.enforce_buyer_build_request_insert();

-- Buyers can update questionnaire fields; builders dismiss alerts
create or replace function public.enforce_buyer_build_request_update()
returns trigger as $$
declare
  questionnaire_changed boolean;
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
      new.needs_review := old.needs_review;
      new.review_kind := old.review_kind;
    elsif old.status in ('pending', 'in_progress') and new.status = 'cancelled' then
      new.estimated_cost := old.estimated_cost;
      new.buyer_id := old.buyer_id;
      new.created_at := old.created_at;
      new.use_case := old.use_case;
      new.budget := old.budget;
      new.existing_parts := old.existing_parts;
      new.preferences := old.preferences;
      new.needs_review := old.needs_review;
      new.review_kind := old.review_kind;
    else
      new.status := old.status;
      new.estimated_cost := old.estimated_cost;
      new.buyer_id := old.buyer_id;
      new.created_at := old.created_at;

      questionnaire_changed :=
        new.use_case is distinct from old.use_case
        or new.budget is distinct from old.budget
        or new.existing_parts is distinct from old.existing_parts
        or new.preferences is distinct from old.preferences;

      if questionnaire_changed then
        new.needs_review := true;
        if old.needs_review and old.review_kind = 'new' then
          new.review_kind := 'new';
        else
          new.review_kind := 'updated';
        end if;
      else
        new.needs_review := old.needs_review;
        new.review_kind := old.review_kind;
      end if;
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

do $$ begin
  alter publication supabase_realtime add table public.build_requests;
exception when duplicate_object then null;
end $$;
