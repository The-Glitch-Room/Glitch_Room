-- ============================================================================
-- THE GLITCH ROOM — SUPABASE DATABASE MIGRATION SCRIPT
-- Copy & Paste this entire script into your Supabase SQL Editor and click "Run".
-- ============================================================================

-- 1. Create user_referrals table to track referral invitations & bonus rewards
CREATE TABLE IF NOT EXISTS public.user_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invitee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    UNIQUE(referrer_id, invitee_id)
);

-- Index for fast lookup by code, referrer, or invitee
CREATE INDEX IF NOT EXISTS idx_user_referrals_code ON public.user_referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_user_referrals_referrer ON public.user_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_user_referrals_invitee ON public.user_referrals(invitee_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_referrals
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own referrals') THEN
        CREATE POLICY "Users can view their own referrals"
            ON public.user_referrals FOR SELECT
            USING (auth.uid() = referrer_id OR auth.uid() = invitee_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert referral records') THEN
        CREATE POLICY "Users can insert referral records"
            ON public.user_referrals FOR INSERT
            WITH CHECK (auth.uid() = invitee_id OR auth.uid() = referrer_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their referral records') THEN
        CREATE POLICY "Users can update their referral records"
            ON public.user_referrals FOR UPDATE
            USING (auth.uid() = referrer_id OR auth.uid() = invitee_id);
    END IF;
END $$;

-- 2. Add referral_code to profiles table (if not existing)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- 3. Add time_taken_seconds to challenge_submissions table for Speed Demon bonus tracking
ALTER TABLE public.challenge_submissions ADD COLUMN IF NOT EXISTS time_taken_seconds INTEGER DEFAULT 0;

-- 4. Add last_streak_bonus_at to user_points table (if not existing)
ALTER TABLE public.user_points ADD COLUMN IF NOT EXISTS last_streak_bonus_at INTEGER DEFAULT 0;

-- Done! Tables updated successfully.


--- Achievements table
create table public.achievements (
  id uuid not null default extensions.uuid_generate_v4 (),
  title text not null,
  description text null,
  icon text null default 'Award'::text,
  "requiredPoints" integer null default 0,
  constraint achievements_pkey primary key (id)
) TABLESPACE pg_default;


--- Arena-completions table
create table public.arena_completions (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  event_id uuid null,
  completed_at timestamp with time zone null default now(),
  score integer null default 0,
  completed_date date null default CURRENT_DATE,
  pitch_text text null,
  constraint arena_completions_pkey primary key (id),
  constraint arena_completions_user_id_event_id_key unique (user_id, event_id),
  constraint arena_completions_user_id_fkey foreign KEY (user_id) references auth.users (id)
) TABLESPACE pg_default;

--- arena-events table
create table public.arena_events (
  id uuid not null default gen_random_uuid (),
  title text not null,
  description text not null,
  hosted_by text not null default 'Glitch Room Team'::text,
  skills text[] null default '{}'::text[],
  glitch_scenario text null,
  is_live boolean null default true,
  created_at timestamp with time zone null default now(),
  constraint arena_events_pkey primary key (id)
) TABLESPACE pg_default;

--- Achievements table

--- Achievements table


--- Achievements table

--- Achievements table