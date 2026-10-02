-- ============================================================================
-- GLITCH ROOM — CREATOR ROOM STAKE SYSTEM
-- Run this entire script in your Supabase SQL Editor.
-- It is safe to re-run: every statement uses IF NOT EXISTS / OR REPLACE.
-- ============================================================================

-- 1. Ensure creator_room_members has all columns the stake system needs.
ALTER TABLE public.creator_room_members
  ADD COLUMN IF NOT EXISTS staked_amount       INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS forfeited_carryover INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payout_status       TEXT        NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payout_amount       INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS settled_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS left_at             TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS role                TEXT        NOT NULL DEFAULT 'member',
  ADD COLUMN IF NOT EXISTS joined_at           TIMESTAMPTZ NOT NULL DEFAULT now();

-- 2. Ensure creator_rooms has the settled columns used by the edge function.
ALTER TABLE public.creator_rooms
  ADD COLUMN IF NOT EXISTS settled    BOOLEAN   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS settled_at TIMESTAMPTZ;

-- 3. Ensure creator_room_settlements table exists (used by the edge function).
CREATE TABLE IF NOT EXISTS public.creator_room_settlements (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id             UUID        NOT NULL REFERENCES public.creator_rooms(id) ON DELETE CASCADE,
  user_id             UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  staked_amount       INTEGER     NOT NULL DEFAULT 0,
  completion_pct      INTEGER     NOT NULL DEFAULT 0,
  standups_submitted  INTEGER     NOT NULL DEFAULT 0,
  total_sprint_days   INTEGER     NOT NULL DEFAULT 0,
  outcome             TEXT        NOT NULL DEFAULT 'pending',
  completion_bonus    INTEGER     NOT NULL DEFAULT 0,
  pool_share          INTEGER     NOT NULL DEFAULT 0,
  stake_refund        INTEGER     NOT NULL DEFAULT 0,
  total_payout        INTEGER     NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT creator_room_settlements_room_user_key UNIQUE (room_id, user_id)
);

ALTER TABLE public.creator_room_settlements ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'creator_room_settlements'
      AND policyname = 'Anyone can view creator_room_settlements'
  ) THEN
    CREATE POLICY "Anyone can view creator_room_settlements"
      ON public.creator_room_settlements FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'creator_room_settlements'
      AND policyname = 'Auth users can manage creator_room_settlements'
  ) THEN
    CREATE POLICY "Auth users can manage creator_room_settlements"
      ON public.creator_room_settlements FOR ALL
      USING (auth.uid() IS NOT NULL)
      WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- ============================================================================
-- 4. Unique constraint on creator_room_members(room_id, user_id)
--    Required for the ON CONFLICT clause in join_creator_room_with_stake.
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'creator_room_members_room_user_key'
  ) THEN
    ALTER TABLE public.creator_room_members
      ADD CONSTRAINT creator_room_members_room_user_key
      UNIQUE (room_id, user_id);
  END IF;
END $$;

-- ============================================================================
-- 5. join_creator_room_with_stake
--
-- Atomically:
--   a) Prevents duplicate joins (ALREADY_MEMBER error).
--   b) Prevents joining a settled room (ROOM_ALREADY_SETTLED error).
--   c) Checks gBits balance (INSUFFICIENT_GBITS error).
--   d) Deducts the stake from profiles.points AND user_points.points.
--   e) Inserts the creator_room_members row with staked_amount set.
--
-- IMPORTANT: We do NOT insert into glitch_activity here.
-- The glitch_activity table has a DB trigger that auto-increments
-- user_points/profiles on every insert — doing so here would cause
-- a double deduction. The frontend dispatches a gbits_transaction
-- CustomEvent for the toast notification instead.
DROP FUNCTION IF EXISTS public.join_creator_room_with_stake(UUID, INTEGER);

CREATE OR REPLACE FUNCTION public.join_creator_room_with_stake(
  p_room_id UUID,
  p_stake   INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id      UUID;
  v_prof_balance INTEGER;
  v_up_balance   INTEGER;
  v_cur_balance  INTEGER;
  v_settled      BOOLEAN;
  v_existing     RECORD;
BEGIN
  -- Resolve caller identity.
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED: must be logged in to join a room';
  END IF;

  -- Check whether the room has already been settled (sprint ended).
  SELECT settled INTO v_settled
    FROM public.creator_rooms
   WHERE id = p_room_id;

  IF v_settled IS TRUE THEN
    RAISE EXCEPTION 'ROOM_ALREADY_SETTLED: this room''s sprint has ended';
  END IF;

  -- Check for an existing ACTIVE membership (left_at IS NULL = still in room).
  SELECT * INTO v_existing
    FROM public.creator_room_members
   WHERE room_id = p_room_id
     AND user_id = v_user_id
     AND left_at IS NULL
   LIMIT 1;

  IF v_existing.user_id IS NOT NULL THEN
    RAISE EXCEPTION 'ALREADY_MEMBER: you are already an active member of this room';
  END IF;

  -- Only touch gBits when there is a real stake amount.
  IF p_stake > 0 THEN

    -- Read balance from both tables; use whichever is higher
    -- (the two can drift slightly between writes).
    SELECT COALESCE(points, 0) INTO v_prof_balance
      FROM public.profiles
     WHERE id = v_user_id;

    SELECT COALESCE(points, 0) INTO v_up_balance
      FROM public.user_points
     WHERE user_id = v_user_id;

    v_cur_balance := GREATEST(COALESCE(v_prof_balance, 0), COALESCE(v_up_balance, 0));

    IF v_cur_balance < p_stake THEN
      RAISE EXCEPTION 'INSUFFICIENT_GBITS: need % gBits but only have %', p_stake, v_cur_balance;
    END IF;

    -- Deduct from profiles.points directly.
    UPDATE public.profiles
       SET points = COALESCE(points, 0) - p_stake
     WHERE id = v_user_id;

    -- Deduct from user_points.points directly.
    -- Using INSERT ... ON CONFLICT so the row is created if it doesn't exist yet.
    INSERT INTO public.user_points (user_id, points)
    VALUES (v_user_id, -p_stake)
    ON CONFLICT (user_id)
    DO UPDATE SET points = public.user_points.points - p_stake;

  END IF;

  -- Insert the membership row (or re-activate a previously left row).
  -- ON CONFLICT on (room_id, user_id) handles the rejoin case cleanly.
  INSERT INTO public.creator_room_members
    (room_id, user_id, role, staked_amount, forfeited_carryover, payout_status,
     payout_amount, settled_at, left_at, joined_at)
  VALUES
    (p_room_id, v_user_id, 'member', p_stake, 0, 'pending', 0, NULL, NULL, NOW())
  ON CONFLICT (room_id, user_id)
  DO UPDATE SET
    left_at             = NULL,
    staked_amount       = p_stake,
    forfeited_carryover = 0,
    payout_status       = 'pending',
    payout_amount       = 0,
    settled_at          = NULL,
    joined_at           = NOW();

END;
$$;

GRANT EXECUTE ON FUNCTION public.join_creator_room_with_stake(UUID, INTEGER)
  TO authenticated;


-- ============================================================================
-- 6. refund_and_delete_creator_room
--
-- Used when the host deletes a room mid-sprint.
-- Refunds every pending member's staked_amount directly to their balance,
-- then deletes the room (cascade deletes members, checkins, etc.).
--
-- IMPORTANT: Same as above — we do NOT use glitch_activity for the refund
-- because the trigger would double-credit. We write directly to
-- profiles + user_points, which is the same path the join RPC uses for
-- the original deduction.
-- ============================================================================
DROP FUNCTION IF EXISTS public.refund_and_delete_creator_room(UUID);

CREATE OR REPLACE FUNCTION public.refund_and_delete_creator_room(p_room_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_caller UUID;
  v_host   UUID;
  m        RECORD;
BEGIN
  v_caller := auth.uid();

  -- Only the room's creator may delete it.
  SELECT created_by INTO v_host
    FROM public.creator_rooms
   WHERE id = p_room_id;

  IF v_host IS DISTINCT FROM v_caller THEN
    RAISE EXCEPTION 'UNAUTHORIZED: only the room host can delete this room';
  END IF;

  -- Refund every member who hasn't already been settled/forfeited.
  FOR m IN
    SELECT user_id, staked_amount
      FROM public.creator_room_members
     WHERE room_id = p_room_id
       AND payout_status = 'pending'
       AND COALESCE(staked_amount, 0) > 0
  LOOP
    -- Restore profiles balance directly (no glitch_activity — see note above).
    UPDATE public.profiles
       SET points = COALESCE(points, 0) + m.staked_amount
     WHERE id = m.user_id;

    -- Restore user_points balance directly.
    INSERT INTO public.user_points (user_id, points)
    VALUES (m.user_id, m.staked_amount)
    ON CONFLICT (user_id)
    DO UPDATE SET points = public.user_points.points + m.staked_amount;
  END LOOP;

  -- Delete the room — cascades to members, checkins, notifications, etc.
  DELETE FROM public.creator_rooms WHERE id = p_room_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.refund_and_delete_creator_room(UUID)
  TO authenticated;


-- ============================================================================
-- 7. RLS policies for creator_room_members (ensure they exist)
-- ============================================================================
ALTER TABLE public.creator_room_members ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'creator_room_members'
      AND policyname = 'Anyone can view creator_room_members'
  ) THEN
    CREATE POLICY "Anyone can view creator_room_members"
      ON public.creator_room_members FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'creator_room_members'
      AND policyname = 'Auth users can manage their own creator_room_members'
  ) THEN
    CREATE POLICY "Auth users can manage their own creator_room_members"
      ON public.creator_room_members FOR ALL
      USING (
        auth.uid() = user_id
        OR auth.uid() IN (
          SELECT created_by FROM public.creator_rooms WHERE id = room_id
        )
      )
      WITH CHECK (
        auth.uid() = user_id
        OR auth.uid() IN (
          SELECT created_by FROM public.creator_rooms WHERE id = room_id
        )
      );
  END IF;
END $$;
