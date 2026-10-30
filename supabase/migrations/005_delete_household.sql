CREATE OR REPLACE FUNCTION public.delete_household(target_household_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_household_owner(target_household_id) THEN
    RAISE EXCEPTION 'Only the household owner can delete a household';
  END IF;

  DELETE FROM public.households
  WHERE id = target_household_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Household not found';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_household(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_household(UUID) TO authenticated;
