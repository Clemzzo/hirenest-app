-- Supabase Chat & Messages Schema
-- Run this SQL in your Supabase project (Database > SQL editor)
-- It creates chats and messages tables, RLS policies, indexes, views, and a trigger to bump chat ordering.

begin;

-- Ensure UUID generation function is available
create extension if not exists pgcrypto;

-- Chats table: one-to-one conversations between a customer and a provider
create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null,
  provider_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chats_customer_id_idx on public.chats (customer_id);
create index if not exists chats_provider_id_idx on public.chats (provider_id);
create index if not exists chats_updated_at_idx on public.chats (updated_at desc);

-- Messages table: messages inside a chat
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  sender_id uuid not null,
  recipient_id uuid,
  content text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists messages_chat_id_idx on public.messages (chat_id);
create index if not exists messages_created_at_idx on public.messages (created_at);
create index if not exists messages_unread_idx on public.messages (recipient_id, read_at) where read_at is null;

-- Enable Row Level Security
alter table public.chats enable row level security;
alter table public.messages enable row level security;

-- RLS Policies for chats
-- Allow participants to select their chats
-- Replace invalid IF NOT EXISTS in policies with DROP IF EXISTS + CREATE
drop policy if exists chats_select_participants on public.chats;
create policy chats_select_participants on public.chats
  for select using (
    auth.uid() = customer_id or auth.uid() = provider_id
  );

-- Allow creating a chat where the authenticated user is a participant
drop policy if exists chats_insert_self_participant on public.chats;
create policy chats_insert_self_participant on public.chats
  for insert with check (
    auth.uid() = customer_id or auth.uid() = provider_id
  );

-- Allow participants to update chats (e.g., updated_at)
drop policy if exists chats_update_participants on public.chats;
create policy chats_update_participants on public.chats
  for update using (
    auth.uid() = customer_id or auth.uid() = provider_id
  ) with check (
    auth.uid() = customer_id or auth.uid() = provider_id
  );

-- RLS Policies for messages
-- Allow participants of the chat to read messages
drop policy if exists messages_select_participants on public.messages;
create policy messages_select_participants on public.messages
  for select using (
    exists (
      select 1 from public.chats c
      where c.id = messages.chat_id
        and (auth.uid() = c.customer_id or auth.uid() = c.provider_id)
    )
  );

-- Allow inserting a message when the sender is the authenticated user AND a participant in the chat
drop policy if exists messages_insert_sender_is_auth on public.messages;
create policy messages_insert_sender_is_auth on public.messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.chats c
      where c.id = messages.chat_id
        and (auth.uid() = c.customer_id or auth.uid() = c.provider_id)
    )
  );

-- Allow updating a message to mark it as read, only by the recipient
drop policy if exists messages_update_recipient_read on public.messages;
create policy messages_update_recipient_read on public.messages
  for update using (
    auth.uid() = recipient_id
  ) with check (
    auth.uid() = recipient_id
  );

-- Trigger: bump chats.updated_at when a new message is inserted
create or replace function public.bump_chat_updated_at() returns trigger language plpgsql as $$
begin
  update public.chats set updated_at = now() where id = NEW.chat_id;
  return NEW;
end $$;

-- Replace invalid IF NOT EXISTS in trigger with DROP IF EXISTS + CREATE
drop trigger if exists messages_bump_chat_updated_at on public.messages;
create trigger messages_bump_chat_updated_at
  after insert on public.messages
  for each row execute function public.bump_chat_updated_at();

commit;

-- Optional: enable Realtime for these tables (if not already enabled)
-- If these statements error, it likely means the tables are already in the publication.
-- You can also enable Realtime per table in the Supabase UI (Database > Replication > Realtime > Tables).
-- Note: run separately if needed (outside of transaction), as Postgres lacks IF NOT EXISTS for publication additions.
-- alter publication supabase_realtime add table public.messages;
-- alter publication supabase_realtime add table public.chats;

-- Optional convenience views used by the app if present
-- These views provide (id, other_name, updated_at) for quick chat lists without heavy joins in the client
create or replace view public.chats_min as
select ch.id, ch.updated_at, p.full_name as other_name
from public.chats ch
join public.profiles p on p.id = ch.provider_id;

create or replace view public.chats_min_provider as
select ch.id, ch.updated_at, p.full_name as other_name
from public.chats ch
join public.profiles p on p.id = ch.customer_id;