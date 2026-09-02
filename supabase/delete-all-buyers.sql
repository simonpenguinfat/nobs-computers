-- ============================================================
-- Delete ALL buyer accounts and their data (keep admin only)
-- Run in Supabase → SQL Editor
--
-- KEEPS: accounts with role = 'builder' (your admin)
-- DELETES: all buyer logins, profiles, build requests, chat messages
-- DOES NOT DELETE: past builds gallery (showcase_builds)
-- ============================================================

-- STEP 0: Make sure YOUR account is the admin (builder).
-- Replace with your admin email, run this once, then run the rest.
--
-- UPDATE public.profiles
-- SET role = 'builder'
-- WHERE email = 'YOUR_ADMIN_EMAIL@gmail.com';

-- Safety check — stop if no admin account exists
do $$
declare
  builder_count int;
begin
  select count(*) into builder_count
  from public.profiles
  where role = 'builder';

  if builder_count = 0 then
    raise exception 'No builder (admin) account found. Run the UPDATE above first to set your email as builder.';
  end if;
end $$;

-- Show what will be kept (review before deleting)
select id, email, full_name, role, created_at
from public.profiles
where role = 'builder';

-- Show what will be deleted
select id, email, full_name, role, created_at
from public.profiles
where role = 'buyer';

-- Delete buyer login accounts from Supabase Auth.
-- This automatically removes (cascade):
--   - buyer profiles
--   - their build requests
--   - chat messages on those orders
delete from auth.users
where id in (
  select id from public.profiles where role = 'buyer'
);

-- Confirm what's left
select id, email, full_name, role
from public.profiles
order by role, email;

select count(*) as remaining_build_requests from public.build_requests;
select count(*) as remaining_messages from public.messages;
