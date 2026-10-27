-- Function to delete a user account and all associated data
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void AS $$
DECLARE
  user_id UUID;
BEGIN
  user_id := auth.uid();

  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete user's data (cascades will handle related records)
  DELETE FROM public.ocr_imports WHERE user_id = user_id;
  DELETE FROM public.recipe_tags WHERE recipe_id IN (
    SELECT id FROM public.recipes WHERE user_id = user_id
  );
  DELETE FROM public.recipe_instructions WHERE recipe_id IN (
    SELECT id FROM public.recipes WHERE user_id = user_id
  );
  DELETE FROM public.recipe_ingredients WHERE recipe_id IN (
    SELECT id FROM public.recipes WHERE user_id = user_id
  );
  DELETE FROM public.recipes WHERE user_id = user_id;
  DELETE FROM public.user_dietary_profiles WHERE user_id = user_id;

  -- Delete auth user
  DELETE FROM auth.users WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
