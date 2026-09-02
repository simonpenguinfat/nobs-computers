-- ============================================================

-- PC Forge — Database Setup

-- Copy this ENTIRE file and paste it into Supabase SQL Editor,

-- then click "Run". You only do this ONCE.

-- ============================================================



-- Helper: check builder role without RLS recursion

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



-- Profiles (extends Supabase auth users)

create table if not exists public.profiles (

  id uuid references auth.users on delete cascade primary key,

  email text not null,

  full_name text not null default '',

  role text not null check (role in ('buyer', 'builder')),

  created_at timestamptz not null default now()

);



alter table public.profiles enable row level security;



create policy "Users can read own profile"

  on public.profiles for select

  using (auth.uid() = id);



create policy "Users can update own profile"

  on public.profiles for update

  using (auth.uid() = id);



create policy "Users can insert own profile"

  on public.profiles for insert

  with check (auth.uid() = id);



create policy "Builder can read all profiles"

  on public.profiles for select

  using (public.is_builder());



-- Build requests (buyer survey submissions)

create table if not exists public.build_requests (

  id uuid primary key default gen_random_uuid(),

  buyer_id uuid references public.profiles(id) on delete cascade not null,

  use_case text not null default '',

  budget numeric not null default 0,

  existing_parts text not null default '',

  preferences text not null default '',

  status text not null default 'pending'

    check (status in ('pending', 'in_progress', 'completed', 'cancelled', 'confirmed', 'not_received')),

  estimated_cost numeric,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()

);



alter table public.build_requests enable row level security;



create policy "Buyers can read own requests"

  on public.build_requests for select

  using (buyer_id = auth.uid());



create policy "Buyers can insert own requests"

  on public.build_requests for insert

  with check (buyer_id = auth.uid());



create policy "Buyers can update own requests"

  on public.build_requests for update

  using (buyer_id = auth.uid());



create policy "Builder can read all requests"

  on public.build_requests for select

  using (public.is_builder());



create policy "Builder can update all requests"

  on public.build_requests for update

  using (public.is_builder());



-- Messages (live chat)

create table if not exists public.messages (

  id uuid primary key default gen_random_uuid(),

  build_request_id uuid references public.build_requests(id) on delete cascade not null,

  sender_id uuid references public.profiles(id) on delete cascade not null,

  content text not null,

  created_at timestamptz not null default now()

);



alter table public.messages enable row level security;



create policy "Participants can read messages"

  on public.messages for select

  using (

    exists (

      select 1 from public.build_requests br

      where br.id = build_request_id

      and (br.buyer_id = auth.uid() or public.is_builder())

    )

  );



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



-- Auto-create profile on signup

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

$$ language plpgsql security definer;



drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created

  after insert on auth.users

  for each row execute function public.handle_new_user();



-- Enable realtime for messages (safe to re-run)
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null;
end $$;

-- Table permissions (required for the app to read/write data)
grant usage on schema public to authenticated;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.build_requests to authenticated;
grant select, insert, update, delete on public.messages to authenticated;

grant all on public.profiles to service_role;
grant all on public.build_requests to service_role;
grant all on public.messages to service_role;
