-- Households and invitations
CREATE TABLE public.households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 100),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.household_members (
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (household_id, user_id)
);

CREATE TABLE public.household_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  email TEXT NOT NULL CHECK (email = lower(email)),
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined', 'revoked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

CREATE INDEX household_members_user_id_idx
  ON public.household_members(user_id);
CREATE INDEX household_invitations_email_status_idx
  ON public.household_invitations(email, status);
CREATE UNIQUE INDEX household_invitations_pending_unique_idx
  ON public.household_invitations(household_id, email)
  WHERE status = 'pending';

ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_invitations ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.households, public.household_members, public.household_invitations
  TO authenticated;

ALTER TABLE public.recipes ADD COLUMN household_id UUID;

-- Preserve existing recipes by putting each existing owner's recipes in a
-- private household before requiring household membership for recipe access.
INSERT INTO public.households (name, owner_id)
SELECT 'My Household', user_id
FROM public.recipes
GROUP BY user_id;

INSERT INTO public.household_members (household_id, user_id, role)
SELECT id, owner_id, 'owner'
FROM public.households;

UPDATE public.recipes recipe
SET household_id = household.id
FROM public.households household
WHERE household.owner_id = recipe.user_id;

ALTER TABLE public.recipes
  ALTER COLUMN household_id SET NOT NULL,
  ADD CONSTRAINT recipes_household_id_fkey
    FOREIGN KEY (household_id) REFERENCES public.households(id) ON DELETE CASCADE;

CREATE INDEX recipes_household_id_idx ON public.recipes(household_id);

CREATE OR REPLACE FUNCTION public.is_household_member(target_household_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.household_members
    WHERE household_id = target_household_id
      AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_household_owner(target_household_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.households
    WHERE id = target_household_id
      AND owner_id = auth.uid()
  );
$$;

CREATE POLICY "Members can view their households"
  ON public.households FOR SELECT
  USING (
    public.is_household_member(id)
    OR EXISTS (
      SELECT 1
      FROM public.household_invitations invitation
      WHERE invitation.household_id = id
        AND invitation.status = 'pending'
        AND invitation.email = lower(COALESCE(auth.jwt() ->> 'email', ''))
    )
  );

CREATE POLICY "Members can view household members"
  ON public.household_members FOR SELECT
  USING (public.is_household_member(household_id));

CREATE POLICY "Invitees and owners can view household invitations"
  ON public.household_invitations FOR SELECT
  USING (
    public.is_household_owner(household_id)
    OR email = lower(COALESCE(auth.jwt() ->> 'email', ''))
  );

DROP POLICY IF EXISTS "Users can view own recipes" ON public.recipes;
DROP POLICY IF EXISTS "Users can insert own recipes" ON public.recipes;
DROP POLICY IF EXISTS "Users can update own recipes" ON public.recipes;
DROP POLICY IF EXISTS "Users can delete own recipes" ON public.recipes;

CREATE POLICY "Household members can view recipes"
  ON public.recipes FOR SELECT
  USING (public.is_household_member(household_id));

CREATE POLICY "Household members can create their own recipes"
  ON public.recipes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.is_household_member(household_id)
  );

CREATE POLICY "Recipe creators can update their household recipes"
  ON public.recipes FOR UPDATE
  USING (auth.uid() = user_id AND public.is_household_member(household_id))
  WITH CHECK (auth.uid() = user_id AND public.is_household_member(household_id));

CREATE POLICY "Recipe creators can delete their household recipes"
  ON public.recipes FOR DELETE
  USING (auth.uid() = user_id AND public.is_household_member(household_id));

DROP POLICY IF EXISTS "Users can view ingredients of own recipes" ON public.recipe_ingredients;
DROP POLICY IF EXISTS "Users can manage ingredients in own recipes" ON public.recipe_ingredients;
DROP POLICY IF EXISTS "Users can update ingredients in own recipes" ON public.recipe_ingredients;
DROP POLICY IF EXISTS "Users can delete ingredients from own recipes" ON public.recipe_ingredients;

CREATE POLICY "Household members can view recipe ingredients"
  ON public.recipe_ingredients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes recipe
      WHERE recipe.id = recipe_id
        AND public.is_household_member(recipe.household_id)
    )
  );
CREATE POLICY "Recipe creators can manage ingredients"
  ON public.recipe_ingredients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recipes recipe
      WHERE recipe.id = recipe_id AND recipe.user_id = auth.uid()
    )
  );
CREATE POLICY "Recipe creators can update ingredients"
  ON public.recipe_ingredients FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes recipe
      WHERE recipe.id = recipe_id AND recipe.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recipes recipe
      WHERE recipe.id = recipe_id AND recipe.user_id = auth.uid()
    )
  );
CREATE POLICY "Recipe creators can delete ingredients"
  ON public.recipe_ingredients FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes recipe
      WHERE recipe.id = recipe_id AND recipe.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view instructions of own recipes" ON public.recipe_instructions;
DROP POLICY IF EXISTS "Users can manage instructions in own recipes" ON public.recipe_instructions;
DROP POLICY IF EXISTS "Users can update instructions in own recipes" ON public.recipe_instructions;
DROP POLICY IF EXISTS "Users can delete instructions from own recipes" ON public.recipe_instructions;

CREATE POLICY "Household members can view recipe instructions"
  ON public.recipe_instructions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes recipe
      WHERE recipe.id = recipe_id
        AND public.is_household_member(recipe.household_id)
    )
  );
CREATE POLICY "Recipe creators can manage instructions"
  ON public.recipe_instructions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recipes recipe
      WHERE recipe.id = recipe_id AND recipe.user_id = auth.uid()
    )
  );
CREATE POLICY "Recipe creators can update instructions"
  ON public.recipe_instructions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes recipe
      WHERE recipe.id = recipe_id AND recipe.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recipes recipe
      WHERE recipe.id = recipe_id AND recipe.user_id = auth.uid()
    )
  );
CREATE POLICY "Recipe creators can delete instructions"
  ON public.recipe_instructions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes recipe
      WHERE recipe.id = recipe_id AND recipe.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view tags of own recipes" ON public.recipe_tags;
DROP POLICY IF EXISTS "Users can manage tags in own recipes" ON public.recipe_tags;
DROP POLICY IF EXISTS "Users can update tags in own recipes" ON public.recipe_tags;
DROP POLICY IF EXISTS "Users can delete tags from own recipes" ON public.recipe_tags;

CREATE POLICY "Household members can view recipe tags"
  ON public.recipe_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes recipe
      WHERE recipe.id = recipe_id
        AND public.is_household_member(recipe.household_id)
    )
  );
CREATE POLICY "Recipe creators can manage tags"
  ON public.recipe_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recipes recipe
      WHERE recipe.id = recipe_id AND recipe.user_id = auth.uid()
    )
  );
CREATE POLICY "Recipe creators can update tags"
  ON public.recipe_tags FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes recipe
      WHERE recipe.id = recipe_id AND recipe.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recipes recipe
      WHERE recipe.id = recipe_id AND recipe.user_id = auth.uid()
    )
  );
CREATE POLICY "Recipe creators can delete tags"
  ON public.recipe_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes recipe
      WHERE recipe.id = recipe_id AND recipe.user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.create_household(
  household_name TEXT,
  invited_emails TEXT[] DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  new_household_id UUID;
  invite_email TEXT;
  normalized_email TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF household_name IS NULL OR length(trim(household_name)) NOT BETWEEN 1 AND 100 THEN
    RAISE EXCEPTION 'Household name must be between 1 and 100 characters';
  END IF;

  INSERT INTO public.households (name, owner_id)
  VALUES (trim(household_name), auth.uid())
  RETURNING id INTO new_household_id;

  INSERT INTO public.household_members (household_id, user_id, role)
  VALUES (new_household_id, auth.uid(), 'owner');

  FOREACH invite_email IN ARRAY COALESCE(invited_emails, '{}') LOOP
    normalized_email := lower(trim(invite_email));
    IF normalized_email IS NULL OR normalized_email = '' THEN
      CONTINUE;
    END IF;
    IF normalized_email IS NULL OR normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN
      RAISE EXCEPTION 'Invalid email address: %', normalized_email;
    END IF;
    IF normalized_email = lower(COALESCE(auth.jwt() ->> 'email', '')) THEN
      RAISE EXCEPTION 'You cannot invite your own email address';
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.household_invitations
      WHERE household_id = new_household_id
        AND email = normalized_email
        AND status = 'pending'
    ) THEN
      RAISE EXCEPTION 'An invitation for % is already pending', normalized_email;
    END IF;
    INSERT INTO public.household_invitations (household_id, email, invited_by)
    VALUES (new_household_id, normalized_email, auth.uid());
  END LOOP;

  RETURN new_household_id;
END;
$$;

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
  IF normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN
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
  RETURNING id INTO invitation_id;
  RETURN invitation_id;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'An invitation for that email is already pending';
END;
$$;

CREATE OR REPLACE FUNCTION public.respond_to_household_invite(
  invitation_id UUID,
  accept_invitation BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  invitation public.household_invitations%ROWTYPE;
BEGIN
  SELECT * INTO invitation
  FROM public.household_invitations
  WHERE id = invitation_id
    AND email = lower(COALESCE(auth.jwt() ->> 'email', ''))
    AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found or no longer pending';
  END IF;

  IF accept_invitation THEN
    INSERT INTO public.household_members (household_id, user_id, role)
    VALUES (invitation.household_id, auth.uid(), 'member')
    ON CONFLICT (household_id, user_id) DO NOTHING;
    UPDATE public.household_invitations
    SET status = 'accepted', responded_at = NOW()
    WHERE id = invitation.id;
  ELSE
    UPDATE public.household_invitations
    SET status = 'declined', responded_at = NOW()
    WHERE id = invitation.id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.rename_household(
  target_household_id UUID,
  new_name TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_household_owner(target_household_id) THEN
    RAISE EXCEPTION 'Only the household owner can rename this household';
  END IF;
  IF new_name IS NULL OR length(trim(new_name)) NOT BETWEEN 1 AND 100 THEN
    RAISE EXCEPTION 'Household name must be between 1 and 100 characters';
  END IF;
  UPDATE public.households SET name = trim(new_name) WHERE id = target_household_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_household_invite(invitation_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.household_invitations
  SET status = 'revoked', responded_at = NOW()
  WHERE id = invitation_id
    AND status = 'pending'
    AND public.is_household_owner(household_id);
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pending invitation not found';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_household_member(
  target_household_id UUID,
  target_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_household_owner(target_household_id) THEN
    RAISE EXCEPTION 'Only the household owner can remove members';
  END IF;
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'The owner cannot remove themselves';
  END IF;
  DELETE FROM public.household_members
  WHERE household_id = target_household_id
    AND user_id = target_user_id
    AND role <> 'owner';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Household member not found';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_household_members(target_household_id UUID)
RETURNS TABLE (user_id UUID, email TEXT, role TEXT, joined_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF NOT public.is_household_owner(target_household_id) THEN
    RAISE EXCEPTION 'Only the household owner can view member details';
  END IF;
  RETURN QUERY
  SELECT member.user_id, account.email::TEXT, member.role, member.joined_at
  FROM public.household_members member
  JOIN auth.users account ON account.id = member.user_id
  WHERE member.household_id = target_household_id
  ORDER BY member.role DESC, member.joined_at;
END;
$$;

REVOKE ALL ON FUNCTION public.is_household_member(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_household_owner(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_household(TEXT, TEXT[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.send_household_invite(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.respond_to_household_invite(UUID, BOOLEAN) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rename_household(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.revoke_household_invite(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.remove_household_member(UUID, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_household_members(UUID) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.is_household_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_household_owner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_household(TEXT, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_household_invite(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_to_household_invite(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rename_household(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_household_invite(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_household_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_household_members(UUID) TO authenticated;
