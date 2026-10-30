const RECIPE_SCREENSHOTS_BUCKET = "recipe-screenshots";
const SIGNED_URL_EXPIRY_SECONDS = 86400;

export async function attachRecipeImageUrls(supabase, recipes) {
  const paths = [
    ...new Set(
      recipes
        .map((recipe) => recipe.imageUrl)
        .filter((imageUrl) => imageUrl && !/^[a-z][a-z\d+.-]*:/i.test(imageUrl))
    ),
  ];

  if (!paths.length) return recipes;

  const { data, error } = await supabase.storage
    .from(RECIPE_SCREENSHOTS_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_EXPIRY_SECONDS);

  if (error) throw error;

  const failedImage = (data || []).find((image) => image.error || !image.signedUrl);
  if (failedImage) {
    throw new Error(`Failed to load saved screenshot: ${failedImage.error || failedImage.path}`);
  }

  const signedUrls = new Map(
    (data || []).map((image) => [image.path, image.signedUrl])
  );

  return recipes.map((recipe) => ({
    ...recipe,
    imageUrl: signedUrls.get(recipe.imageUrl) || recipe.imageUrl,
  }));
}

export async function getRecipeImageUrl(supabase, imageUrl) {
  if (!imageUrl || /^[a-z][a-z\d+.-]*:/i.test(imageUrl)) return imageUrl;

  const { data, error } = await supabase.storage
    .from(RECIPE_SCREENSHOTS_BUCKET)
    .createSignedUrl(imageUrl, SIGNED_URL_EXPIRY_SECONDS);

  if (error) throw error;
  if (!data?.signedUrl) {
    throw new Error("Failed to load saved screenshot.");
  }
  return data.signedUrl;
}
