CREATE OR REPLACE FUNCTION public.send_household_invite(
  target_household_id UUID,
  invitee_email TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  normalized_email TEXT := lower(trim(invitee_email));
  invitation_id UUID;
BEGIN
  IF NOT public.is_household_owner(target_household_id) THEN
    RAISE EXCEPTION 'Only the household owner can invite people';
  END IF;
  IF normalized_email IS NULL OR normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN
    RAISE EXCEPTION 'Enter a valid email address';
  END IF;
  IF normalized_email = lower(COALESCE(auth.jwt() ->> 'email', '')) THEN
    RAISE EXCEPTION 'You cannot invite your own email address';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM public.household_members member
    JOIN auth.users invitee ON invitee.id = member.user_id
    WHERE member.household_id = target_household_id
      AND lower(invitee.email) = normalized_email
  ) THEN
    RAISE EXCEPTION 'That person is already a household member';
  END IF;

  INSERT INTO public.household_invitations (household_id, email, invited_by)
  VALUES (target_household_id, normalized_email, auth.uid())
  ON CONFLICT (household_id, email) WHERE status = 'pending'
  DO UPDATE SET email = EXCLUDED.email
  RETURNING id INTO invitation_id;

  RETURN invitation_id;
END;
$$;
