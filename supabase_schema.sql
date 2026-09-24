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

--- Pro Room Discussions: Ensure title column exists
ALTER TABLE public.pro_room_discussions ADD COLUMN IF NOT EXISTS title text;

--- Pro Room Resources table
CREATE TABLE IF NOT EXISTS public.pro_room_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.pro_rooms(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT,
    file_name TEXT,
    file_type TEXT,
    file_size TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.pro_room_resources ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view pro_room_resources') THEN
        CREATE POLICY "Anyone can view pro_room_resources"
            ON public.pro_room_resources FOR SELECT
            USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can insert pro_room_resources') THEN
        CREATE POLICY "Authenticated users can insert pro_room_resources"
            ON public.pro_room_resources FOR INSERT
            WITH CHECK (auth.uid() IS NOT NULL);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can update pro_room_resources') THEN
        CREATE POLICY "Authenticated users can update pro_room_resources"
            ON public.pro_room_resources FOR UPDATE
            USING (auth.uid() IS NOT NULL);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can delete pro_room_resources') THEN
        CREATE POLICY "Authenticated users can delete pro_room_resources"
            ON public.pro_room_resources FOR DELETE
            USING (auth.uid() IS NOT NULL);
    END IF;
END $$;

--- Pro Rooms Prize Distribution & Rewards System
ALTER TABLE public.pro_rooms ADD COLUMN IF NOT EXISTS prize_distribution JSONB DEFAULT '{"rank_1": 0, "rank_2": 0, "rank_3": 0, "participation": 0}'::jsonb;
ALTER TABLE public.pro_rooms ADD COLUMN IF NOT EXISTS rewards_distributed BOOLEAN DEFAULT false;
ALTER TABLE public.pro_rooms ADD COLUMN IF NOT EXISTS rewards_distributed_at TIMESTAMPTZ;

--- Pro Room Rewards Table (Records which candidate received which reward and why)
CREATE TABLE IF NOT EXISTS public.pro_room_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.pro_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reward_type TEXT NOT NULL CHECK (reward_type IN ('rank_1', 'rank_2', 'rank_3', 'participation')),
    rank INTEGER,
    gbits_awarded INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT pro_room_rewards_room_user_reward_key UNIQUE(room_id, user_id, reward_type)
);

ALTER TABLE public.pro_room_rewards ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view pro_room_rewards') THEN
        CREATE POLICY "Anyone can view pro_room_rewards"
            ON public.pro_room_rewards FOR SELECT
            USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can manage pro_room_rewards') THEN
        CREATE POLICY "Authenticated users can manage pro_room_rewards"
            ON public.pro_room_rewards FOR ALL
            USING (auth.uid() IS NOT NULL)
            WITH CHECK (auth.uid() IS NOT NULL);
    END IF;
END $$;

--- Pro Room Certificates Table (Verifiable digital certificates)
CREATE TABLE IF NOT EXISTS public.pro_room_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_number TEXT UNIQUE NOT NULL,
    room_id UUID NOT NULL REFERENCES public.pro_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('winner_1', 'winner_2', 'winner_3', 'participation')),
    recipient_name TEXT NOT NULL,
    event_name TEXT NOT NULL,
    organization_name TEXT NOT NULL,
    score NUMERIC NOT NULL DEFAULT 0,
    percentage NUMERIC NOT NULL DEFAULT 0,
    rank INTEGER,
    issued_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT pro_room_certificates_room_user_type_key UNIQUE(room_id, user_id, type)
);

ALTER TABLE public.pro_room_certificates ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view pro_room_certificates') THEN
        CREATE POLICY "Anyone can view pro_room_certificates"
            ON public.pro_room_certificates FOR SELECT
            USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can manage pro_room_certificates') THEN
        CREATE POLICY "Authenticated users can manage pro_room_certificates"
            ON public.pro_room_certificates FOR ALL
            USING (auth.uid() IS NOT NULL)
            WITH CHECK (auth.uid() IS NOT NULL);
    END IF;
END $$;

-- Ensure percentage column exists on pro_room_certificates
ALTER TABLE public.pro_room_certificates ADD COLUMN IF NOT EXISTS percentage NUMERIC DEFAULT 0;

-- Function & Trigger to credit gBits atomically when rewards are distributed
CREATE OR REPLACE FUNCTION public.fn_sync_pro_room_reward()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NEW.gbits_awarded > 0 THEN
        -- Insert ledger row into glitch_activity
        INSERT INTO public.glitch_activity (user_id, title, points, type, created_at)
        VALUES (
            NEW.user_id,
            '🏆 Pro Room Prize — Rank ' || COALESCE(NEW.rank::text, 'Winner') || ' (' || SUBSTRING(NEW.room_id::text, 1, 8) || ')',
            NEW.gbits_awarded,
            'reward',
            NOW()
        );

        -- Update user_points
        INSERT INTO public.user_points (user_id, points)
        VALUES (NEW.user_id, NEW.gbits_awarded)
        ON CONFLICT (user_id)
        DO UPDATE SET points = public.user_points.points + EXCLUDED.points;

        -- Update profiles
        UPDATE public.profiles
        SET points = COALESCE(points, 0) + NEW.gbits_awarded
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_pro_room_reward ON public.pro_room_rewards;
CREATE TRIGGER trg_sync_pro_room_reward
    AFTER INSERT ON public.pro_room_rewards
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_sync_pro_room_reward();