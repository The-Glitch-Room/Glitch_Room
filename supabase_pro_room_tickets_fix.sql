-- ============================================================================
-- GLITCH ROOM — PRO ROOM SUPPORT TICKETS FIX & RLS POLICIES
-- Run this entire script in your Supabase SQL Editor.
-- ============================================================================

-- 1. Ensure host_response column exists on pro_room_help_tickets
ALTER TABLE public.pro_room_help_tickets 
ADD COLUMN IF NOT EXISTS host_response TEXT;

-- 2. Drop existing restrictive policies on pro_room_help_tickets
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can update their own tickets" ON public.pro_room_help_tickets;
    DROP POLICY IF EXISTS "Authenticated users can update pro_room_help_tickets" ON public.pro_room_help_tickets;
    DROP POLICY IF EXISTS "Anyone can view relevant pro_room_help_tickets" ON public.pro_room_help_tickets;
    DROP POLICY IF EXISTS "Authenticated users can view pro_room_help_tickets" ON public.pro_room_help_tickets;
    DROP POLICY IF EXISTS "Authenticated users can insert pro_room_help_tickets" ON public.pro_room_help_tickets;
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.pro_room_help_tickets;
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.pro_room_help_tickets;
    DROP POLICY IF EXISTS "Enable update for users based on email" ON public.pro_room_help_tickets;
END $$;

ALTER TABLE public.pro_room_help_tickets ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Allow all authenticated users to select tickets
CREATE POLICY "Authenticated users can view pro_room_help_tickets"
ON public.pro_room_help_tickets
FOR SELECT
TO authenticated
USING (true);

-- 4. Policy: Allow authenticated users to insert tickets
CREATE POLICY "Authenticated users can insert pro_room_help_tickets"
ON public.pro_room_help_tickets
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 5. Policy: Allow hosts & authenticated users to update tickets (reply & resolve)
CREATE POLICY "Authenticated users can update pro_room_help_tickets"
ON public.pro_room_help_tickets
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 6. SECURITY DEFINER RPC to reply to a ticket (bypasses RLS safely)
CREATE OR REPLACE FUNCTION public.reply_pro_room_help_ticket(
  p_ticket_id UUID,
  p_reply TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ticket public.pro_room_help_tickets%ROWTYPE;
  v_clean_msg TEXT;
  v_combined TEXT;
  v_delimiter TEXT := E'\n\n--- HOST RESPONSE ---\n';
BEGIN
  -- Retrieve ticket
  SELECT * INTO v_ticket FROM public.pro_room_help_tickets WHERE id = p_ticket_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ticket not found');
  END IF;

  -- Separate previous response if any
  IF position(v_delimiter in v_ticket.message) > 0 THEN
    v_clean_msg := split_part(v_ticket.message, v_delimiter, 1);
  ELSE
    v_clean_msg := v_ticket.message;
  END IF;
  v_combined := trim(v_clean_msg) || v_delimiter || trim(p_reply);

  -- Perform update
  BEGIN
    UPDATE public.pro_room_help_tickets
    SET status = 'resolved',
        host_response = trim(p_reply),
        message = v_combined
    WHERE id = p_ticket_id;
  EXCEPTION WHEN undefined_column THEN
    UPDATE public.pro_room_help_tickets
    SET status = 'resolved',
        message = v_combined
    WHERE id = p_ticket_id;
  END;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.reply_pro_room_help_ticket(UUID, TEXT) TO authenticated;
