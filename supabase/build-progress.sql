-- ============================================================
-- Buyer build progress stages
-- Run ONCE in Supabase → SQL Editor → New query → Run
-- ============================================================

alter table public.build_requests
  add column if not exists build_stage text;

alter table public.build_requests
  drop constraint if exists build_requests_build_stage_check;

alter table public.build_requests
  add constraint build_requests_build_stage_check
  check (
    build_stage is null
    or build_stage in (
      'request',
      'review',
      'draft',
      'approval',
      'parts_ordered',
      'building',
      'testing',
      'ready'
    )
  );

-- Existing rows: map from status
update public.build_requests
set build_stage = case
  when status = 'pending' then 'review'
  when status in ('completed', 'confirmed', 'not_received') then 'ready'
  when status = 'in_progress' then coalesce(build_stage, 'draft')
  else coalesce(build_stage, 'request')
end
where build_stage is null;

create or replace function public.enforce_buyer_build_request_insert()
returns trigger as $$
begin
  if not public.is_builder() then
    new.needs_review := true;
    new.review_kind := 'new';
    if new.build_stage is null then
      new.build_stage := 'review';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

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
      new.decline_reason := old.decline_reason;
      new.closed_by := old.closed_by;
      new.outcome_acknowledged := old.outcome_acknowledged;
      new.build_stage := old.build_stage;
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
      new.closed_by := 'buyer';
      new.outcome_acknowledged := false;
      new.build_stage := old.build_stage;
    elsif old.status in ('rejected', 'cancelled')
      and coalesce(old.outcome_acknowledged, false) = false
      and new.outcome_acknowledged = true then
      new.status := old.status;
      new.estimated_cost := old.estimated_cost;
      new.buyer_id := old.buyer_id;
      new.created_at := old.created_at;
      new.use_case := old.use_case;
      new.budget := old.budget;
      new.existing_parts := old.existing_parts;
      new.preferences := old.preferences;
      new.needs_review := old.needs_review;
      new.review_kind := old.review_kind;
      new.decline_reason := old.decline_reason;
      new.closed_by := old.closed_by;
      new.outcome_acknowledged := true;
      new.build_stage := old.build_stage;
    else
      new.status := old.status;
      new.estimated_cost := old.estimated_cost;
      new.buyer_id := old.buyer_id;
      new.created_at := old.created_at;
      new.decline_reason := old.decline_reason;
      new.closed_by := old.closed_by;
      new.outcome_acknowledged := old.outcome_acknowledged;
      new.build_stage := old.build_stage;

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
