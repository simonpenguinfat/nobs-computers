-- ============================================================
-- Message replies
-- Run in Supabase SQL Editor
-- ============================================================

alter table public.messages
  add column if not exists reply_to_id uuid references public.messages(id) on delete set null;

create or replace function public.validate_message_reply()
returns trigger as $$
begin
  if new.reply_to_id is not null then
    if not exists (
      select 1 from public.messages m
      where m.id = new.reply_to_id
      and m.build_request_id = new.build_request_id
    ) then
      raise exception 'Reply must reference a message in the same conversation';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists validate_message_reply_trigger on public.messages;
create trigger validate_message_reply_trigger
  before insert on public.messages
  for each row execute function public.validate_message_reply();
