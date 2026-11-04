-- ==============================================================================
-- Aura — Supabase PostgreSQL Schema & Row Level Security (RLS) Migrations
-- Project ID: heizeuznqerxdcimlobl
-- ==============================================================================

-- 1. USER SETTINGS / PROFILE
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text default '',
  greeting_title text default 'Personal Workspace',
  daily_task_goal integer default 3,
  confetti_enabled boolean default true,
  notifications_enabled boolean default true,
  updated_at timestamptz default now()
);

-- 2. TASKS
create table if not exists public.tasks (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text default '',
  date text not null, -- YYYY-MM-DD
  start_time text,
  deadline text,
  priority text not null check (priority in ('low', 'medium', 'high')),
  category text not null,
  estimated_duration integer default 30,
  time_spent_minutes integer default 0,
  completed boolean default false,
  completed_at text,
  created_at text not null
);

create index if not exists idx_tasks_user_date on public.tasks (user_id, date);

-- 3. HABITS
create table if not exists public.habits (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text default '',
  category text not null,
  frequency text not null,
  custom_days jsonb default '[]'::jsonb,
  target_count integer default 1,
  unit text default 'times',
  color text default 'sage',
  icon text default 'Sparkles',
  created_at text not null,
  completions jsonb default '{}'::jsonb
);

create index if not exists idx_habits_user on public.habits (user_id);

-- 4. ADDICTION TRACKERS
create table if not exists public.addiction_trackers (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text default '',
  daily_limit_minutes integer default 0,
  reduction_goal text default 'Zero consumption',
  color text default 'rose',
  icon text default 'Shield',
  created_at text not null
);

create index if not exists idx_addiction_trackers_user on public.addiction_trackers (user_id);

-- 5. ADDICTION LOGS
create table if not exists public.addiction_logs (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  tracker_id text not null references public.addiction_trackers(id) on delete cascade,
  date text not null, -- YYYY-MM-DD
  timestamp text not null,
  duration_minutes integer default 0,
  trigger text default 'habit',
  note text default ''
);

create index if not exists idx_addiction_logs_user on public.addiction_logs (user_id, date);

-- 6. FOCUS SESSIONS
create table if not exists public.focus_sessions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id text,
  task_title text not null,
  started_at text not null,
  ended_at text not null,
  duration_minutes integer not null,
  completed boolean default true
);

create index if not exists idx_focus_sessions_user on public.focus_sessions (user_id);

-- 7. TIME ENTRIES (AUDIT)
create table if not exists public.time_entries (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  activity text not null,
  started_at text not null,
  ended_at text not null,
  duration_minutes integer not null,
  task_id text,
  focus_session_id text
);

create index if not exists idx_time_entries_user on public.time_entries (user_id);

-- 8. TIME CATEGORIES
create table if not exists public.time_categories (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at text default now()
);

-- 9. GOALS
create table if not exists public.goals (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text default 'Personal',
  target_date text,
  progress integer default 0,
  status text default 'in_progress',
  created_at text not null
);

create index if not exists idx_goals_user on public.goals (user_id);

-- 10. DAILY JOURNALS
create table if not exists public.daily_journals (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date text not null, -- YYYY-MM-DD
  content text not null,
  mood text default 'calm',
  gratitude text default '',
  created_at text not null
);

create index if not exists idx_daily_journals_user on public.daily_journals (user_id, date);


-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict Isolation: Users can ONLY access, update, and delete their own records
-- ==============================================================================

alter table public.user_settings enable row level security;
alter table public.tasks enable row level security;
alter table public.habits enable row level security;
alter table public.addiction_trackers enable row level security;
alter table public.addiction_logs enable row level security;
alter table public.focus_sessions enable row level security;
alter table public.time_entries enable row level security;
alter table public.time_categories enable row level security;
alter table public.goals enable row level security;
alter table public.daily_journals enable row level security;

-- Drop existing policies if rerun
drop policy if exists "Users can manage their own settings" on public.user_settings;
drop policy if exists "Users can manage their own tasks" on public.tasks;
drop policy if exists "Users can manage their own habits" on public.habits;
drop policy if exists "Users can manage their own addiction_trackers" on public.addiction_trackers;
drop policy if exists "Users can manage their own addiction_logs" on public.addiction_logs;
drop policy if exists "Users can manage their own focus_sessions" on public.focus_sessions;
drop policy if exists "Users can manage their own time_entries" on public.time_entries;
drop policy if exists "Users can manage their own time_categories" on public.time_categories;
drop policy if exists "Users can manage their own goals" on public.goals;
drop policy if exists "Users can manage their own daily_journals" on public.daily_journals;

-- Create ALL policies
create policy "Users can manage their own settings" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage their own tasks" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage their own habits" on public.habits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage their own addiction_trackers" on public.addiction_trackers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage their own addiction_logs" on public.addiction_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage their own focus_sessions" on public.focus_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage their own time_entries" on public.time_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage their own time_categories" on public.time_categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage their own goals" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage their own daily_journals" on public.daily_journals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
