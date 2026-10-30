INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'recipe-screenshots',
  'recipe-screenshots',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "Users can upload their recipe screenshots"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'recipe-screenshots'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "Household members can view recipe screenshots"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'recipe-screenshots'
    AND EXISTS (
      SELECT 1
      FROM public.recipes recipe
      WHERE recipe.image_url = name
        AND public.is_household_member(recipe.household_id)
    )
  );

CREATE POLICY "Users can remove their recipe screenshots"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'recipe-screenshots'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );
