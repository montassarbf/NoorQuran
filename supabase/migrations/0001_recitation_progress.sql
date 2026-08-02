-- Recitation Progress (Tareel-style recite & correct)
-- Run this in the Supabase Dashboard: SQL Editor > New query > paste > Run.
-- It creates the recitation_progress table for storing AI-checked recitation attempts.

create table if not exists public.recitation_progress (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  surah_id int not null,
  verse_start int not null,
  verse_end int not null,
  accuracy numeric(5,2) not null default 0,
  target_words int not null default 0,
  missing_words int not null default 0,
  extra_words text,
  transcript text,
  created_at timestamptz not null default now(),
  check (accuracy >= 0 and accuracy <= 100)
);

alter table public.recitation_progress enable row level security;

create policy "Users can read their own recitation progress"
  on public.recitation_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert their own recitation progress"
  on public.recitation_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own recitation progress"
  on public.recitation_progress for update
  using (auth.uid() = user_id);

create policy "Users can delete their own recitation progress"
  on public.recitation_progress for delete
  using (auth.uid() = user_id);

create index if not exists recitation_progress_user_time_idx
  on public.recitation_progress (user_id, created_at desc);

create index if not exists recitation_progress_user_surah_idx
  on public.recitation_progress (user_id, surah_id);
