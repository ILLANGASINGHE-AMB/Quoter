-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Top-level messages table
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  content varchar(1500) not null,
  created_at timestamptz not null default now()
);

-- Replies table references messages
create table if not exists replies (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references messages(id) on delete cascade,
  content varchar(1500) not null,
  created_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_messages_created_at on messages (created_at desc);
create index if not exists idx_replies_message_id on replies (message_id);

-- Enable Row Level Security (RLS)
alter table messages enable row level security;
alter table replies enable row level security;

-- Drop existing policies if any (prevents errors when running script multiple times)
drop policy if exists "public read messages" on messages;
drop policy if exists "public read replies" on replies;
drop policy if exists "public insert messages" on messages;
drop policy if exists "public insert replies" on replies;

-- RLS: Anyone can read messages and replies
create policy "public read messages" on messages
  for select using (true);

create policy "public read replies" on replies
  for select using (true);

-- RLS: Anyone can insert messages and replies (limit content length 1-1500 code points to cover combining Sinhala characters)
create policy "public insert messages" on messages
  for insert with check (char_length(content) <= 1500 and char_length(content) > 0);

create policy "public insert replies" on replies
  for insert with check (char_length(content) <= 1500 and char_length(content) > 0);

-- Enable Realtime for the tables to allow clients to listen to insertions
-- First check if publication exists, then add tables
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table replies;
