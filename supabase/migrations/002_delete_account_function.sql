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
  -- Foreign keys with ON DELETE CASCADE will automatically clean up related records
  DELETE FROM public.recipes WHERE user_id = user_id;
  DELETE FROM public.user_dietary_profiles WHERE user_id = user_id;
  DELETE FROM public.ocr_imports WHERE user_id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
