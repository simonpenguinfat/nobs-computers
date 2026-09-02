-- ============================================================
-- NoBS Computers — Security & production fixes
-- Run this ONCE in Supabase SQL Editor after schema.sql
-- ============================================================

-- 1. Always create new users as buyers (ignore metadata role)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'buyer'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- 2. Prevent users from changing their own role
create or replace function public.protect_profile_role()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() = new.id and new.role != 'buyer' then
      new.role := 'buyer';
    end if;
  elsif tg_op = 'UPDATE' then
    if auth.uid() = new.id and old.role is distinct from new.role then
      new.role := old.role;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists protect_profile_role_trigger on public.profiles;
create trigger protect_profile_role_trigger
  before insert or update on public.profiles
  for each row execute function public.protect_profile_role();

-- 3. Prevent buyers from changing status or estimated_cost (except delivery confirmation)
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

-- 4. One build request per buyer (remove duplicates first)
delete from public.build_requests a
using public.build_requests b
where a.buyer_id = b.buyer_id and a.created_at < b.created_at;

create unique index if not exists build_requests_one_active_per_buyer
  on public.build_requests (buyer_id)
  where status not in ('confirmed', 'cancelled', 'rejected');

-- 5. Buyers can read builder names for chat
drop policy if exists "Buyers can read builder profiles" on public.profiles;
create policy "Buyers can read builder profiles"
  on public.profiles for select
  using (role = 'builder');

-- 6. Limit chat message length
alter table public.messages
  drop constraint if exists messages_content_length;
alter table public.messages
  add constraint messages_content_length check (char_length(content) <= 2000);
