-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. Setup Extensions & Enums
create extension if not exists "uuid-ossp";

do $$ begin
    create type room_status as enum ('LOBBY', 'PLAYING', 'VOTING', 'ENDED');
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type player_role as enum ('CIVILIAN', 'IMPOSTOR');
exception
    when duplicate_object then null;
end $$;

-- 2. Profiles Table & Auto-Creation Trigger
create table if not exists profiles (
  id uuid references auth.users not null primary key,
  username text unique,
  avatar_url text,
  is_admin boolean default false,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (new.id, split_part(new.email, '@', 1), '');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Backfill profiles for existing users (Fixes your current login issue)
insert into public.profiles (id, username, avatar_url)
select id, split_part(email, '@', 1), ''
from auth.users
where id not in (select id from public.profiles);

-- 3. Rooms Table
create table if not exists rooms (
  id uuid default uuid_generate_v4() primary key,
  code text unique not null,
  host_id uuid references profiles(id) not null,
  status room_status default 'LOBBY'::room_status,
  impostor_count int default 1,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. Players Table
-- Note: Keeping single table as per current code expectation
create table if not exists players (
  id uuid default uuid_generate_v4() primary key,
  room_id uuid references rooms(id) on delete cascade not null,
  user_id uuid references profiles(id) not null,
  role player_role,
  secret_word text,
  is_alive boolean default true,
  votes_received int default 0,
  joined_at timestamp with time zone default timezone('utc'::text, now()),
  unique(room_id, user_id)
);

-- 5. Enable RLS
alter table profiles enable row level security;
alter table rooms enable row level security;
alter table players enable row level security;

-- 6. RLS Policies
-- PROFILES
drop policy if exists "Public profiles" on profiles;
create policy "Public profiles" on profiles for select using (true);

drop policy if exists "Self update profiles" on profiles;
create policy "Self update profiles" on profiles for update using (auth.uid() = id);

-- ROOMS
drop policy if exists "Public rooms" on rooms;
create policy "Public rooms" on rooms for select using (true);

drop policy if exists "Auth create rooms" on rooms;
create policy "Auth create rooms" on rooms for insert with check (auth.role() = 'authenticated');

drop policy if exists "Host update rooms" on rooms;
create policy "Host update rooms" on rooms for update using (auth.uid() = host_id);

-- PLAYERS
drop policy if exists "Public players" on players;
create policy "Public players" on players for select using (true);

drop policy if exists "Self join players" on players;
create policy "Self join players" on players for insert with check (auth.uid() = user_id);

drop policy if exists "Self update players" on players;
create policy "Self update players" on players for update using (auth.uid() = user_id);
