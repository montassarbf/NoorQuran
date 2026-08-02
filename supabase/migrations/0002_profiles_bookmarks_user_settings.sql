-- User profiles (name + avatar). Refs auth.users, upserted by updateProfile().
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  avatar_url text,
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- Bookmarks: unique per (user, surah, verse), upserted by syncBookmarks().
create table if not exists public.bookmarks (
  user_id uuid not null references auth.users (id) on delete cascade,
  surah_id int not null,
  verse_number int not null,
  note text,
  timestamp bigint not null default 0,
  primary key (user_id, surah_id, verse_number)
);
alter table public.bookmarks enable row level security;

create policy "Users can read their own bookmarks"
  on public.bookmarks for select using (auth.uid() = user_id);
create policy "Users can insert their own bookmarks"
  on public.bookmarks for insert with check (auth.uid() = user_id);
create policy "Users can update their own bookmarks"
  on public.bookmarks for update using (auth.uid() = user_id);
create policy "Users can delete their own bookmarks"
  on public.bookmarks for delete using (auth.uid() = user_id);

-- user_settings: write-only today (syncSettings defined but unused). Optional.
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.user_settings enable row level security;

create policy "Users can manage their own settings"
  on public.user_settings for all using (auth.uid() = user_id);
