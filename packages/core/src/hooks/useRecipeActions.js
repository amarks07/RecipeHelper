import { useCallback } from 'react';
import { supabase } from '../lib/supabase-client';
import { inferRecipeTags } from '../inferRecipeTags';

/**
 * CRUD operations for recipes
 * Follows Barrow's pattern: optimistic updates to local state,
 * background sync to cloud
 */
export function useRecipeActions(recipes, setRecipes) {

  const createRecipe = useCallback(
    async (recipe) => {
      if (!setRecipes) return null;

      const taggedRecipe = {
        ...recipe,
        tags: inferRecipeTags(recipe),
      };
      const recipeWithId = {
        ...taggedRecipe,
        id: `local_${Date.now()}`, // Temporary ID
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Optimistic update
      setRecipes((prev) => [...prev, recipeWithId]);

      // Cloud sync
      if (supabase) {
        let createdRecipeId = null;
        try {
          if (!taggedRecipe.householdId) {
            throw new Error("Choose a household before creating a recipe.");
          }
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();
          if (userError) throw userError;
          if (!user) throw new Error("Sign in before creating a recipe.");

          const { data, error } = await supabase
            .from('recipes')
            .insert({
              user_id: user.id,
              household_id: taggedRecipe.householdId,
              title: taggedRecipe.title,
              description: taggedRecipe.description,
              image_url: taggedRecipe.imageUrl,
              prep_time_minutes: taggedRecipe.prepTime,
              cook_time_minutes: taggedRecipe.cookTime,
              servings: taggedRecipe.servings,
              source_url: taggedRecipe.sourceUrl,
              recipe_data: taggedRecipe.recipeData || {},
            })
            .select()
            .single();

          if (error) throw error;
          createdRecipeId = data.id;

          // Insert ingredients
          if (taggedRecipe.ingredients && taggedRecipe.ingredients.length > 0) {
            const ingredientRows = taggedRecipe.ingredients.map((ing, idx) => ({
              recipe_id: data.id,
              ingredient: ing.name,
              quantity: ing.quantity,
              unit: ing.unit,
              order: idx,
            }));

            const { error: ingredientsError } = await supabase
              .from('recipe_ingredients')
              .insert(ingredientRows);
            if (ingredientsError) throw ingredientsError;
          }

          // Insert instructions
          if (taggedRecipe.instructions && taggedRecipe.instructions.length > 0) {
            const instructionRows = taggedRecipe.instructions.map((instr, idx) => ({
              recipe_id: data.id,
              step: instr,
              order: idx,
            }));

            const { error: instructionsError } = await supabase
              .from('recipe_instructions')
              .insert(instructionRows);
            if (instructionsError) throw instructionsError;
          }

          // Insert tags
          if (taggedRecipe.tags.length > 0) {
            const tagRows = taggedRecipe.tags.map((tag) => ({
              recipe_id: data.id,
              tag_name: tag,
            }));

            const { error: tagsError } = await supabase
              .from('recipe_tags')
              .insert(tagRows);
            if (tagsError) throw tagsError;
          }

          setRecipes((prev) =>
            prev.map((r) =>
              r.id === recipeWithId.id
                ? { ...recipeWithId, id: data.id, userId: user.id }
                : r
            )
          );
          return data;
        } catch (error) {
          console.error('Failed to sync recipe to cloud:', error);
          setRecipes((prev) => prev.filter((r) => r.id !== recipeWithId.id));
          if (createdRecipeId) {
            const { error: cleanupError } = await supabase
              .from('recipes')
              .delete()
              .eq('id', createdRecipeId);
            if (cleanupError) {
              console.error('Failed to clean up incomplete recipe:', cleanupError);
            }
          }
          throw error;
        }
      }

      return recipeWithId;
    },
    [setRecipes]
  );

  const updateRecipe = useCallback(
    async (recipeId, updates) => {
      if (!setRecipes) return;

      const currentRecipe = recipes?.find((recipe) => recipe.id === recipeId);
      const taggedUpdates = {
        ...updates,
        tags: inferRecipeTags({ ...currentRecipe, ...updates }),
      };

      // Optimistic update
      setRecipes((prev) =>
        prev.map((r) =>
          r.id === recipeId
            ? { ...r, ...taggedUpdates, updatedAt: new Date().toISOString() }
            : r
        )
      );

      // Cloud sync
      if (supabase && !recipeId.startsWith('local_')) {
        try {
          const { error } = await supabase
            .from('recipes')
            .update({
              title: taggedUpdates.title,
              description: taggedUpdates.description,
              image_url: taggedUpdates.imageUrl,
              prep_time_minutes: taggedUpdates.prepTime,
              cook_time_minutes: taggedUpdates.cookTime,
              servings: taggedUpdates.servings,
              source_url: taggedUpdates.sourceUrl,
              recipe_data: taggedUpdates.recipeData,
            })
            .eq('id', recipeId);

          if (error) throw error;

          // Update ingredients if provided
          if (taggedUpdates.ingredients) {
            // Delete old ingredients
            await supabase
              .from('recipe_ingredients')
              .delete()
              .eq('recipe_id', recipeId);

            // Insert new ingredients
            const ingredientRows = taggedUpdates.ingredients.map((ing, idx) => ({
              recipe_id: recipeId,
              ingredient: ing.name,
              quantity: ing.quantity,
              unit: ing.unit,
              order: idx,
            }));

            await supabase.from('recipe_ingredients').insert(ingredientRows);
          }

          if (taggedUpdates.tags) {
            const { error: deleteTagsError } = await supabase
              .from('recipe_tags')
              .delete()
              .eq('recipe_id', recipeId);

            if (deleteTagsError) throw deleteTagsError;

            if (taggedUpdates.tags.length > 0) {
              const tagRows = taggedUpdates.tags.map((tag) => ({
                recipe_id: recipeId,
                tag_name: tag,
              }));
              const { error: insertTagsError } = await supabase
                .from('recipe_tags')
                .insert(tagRows);

              if (insertTagsError) throw insertTagsError;
            }
          }
        } catch (error) {
          console.error('Failed to update recipe in cloud:', error);
        }
      }
    },
    [recipes, setRecipes]
  );

  const deleteRecipe = useCallback(
    async (recipeId) => {
      if (!setRecipes) return;

      // Optimistic update
      setRecipes((prev) => prev.filter((r) => r.id !== recipeId));

      // Cloud sync
      if (supabase && !recipeId.startsWith('local_')) {
        try {
          const { error } = await supabase
            .from('recipes')
            .delete()
            .eq('id', recipeId);

          if (error) throw error;
        } catch (error) {
          console.error('Failed to delete recipe from cloud:', error);
          // Restore local copy if sync fails
          // (in production, would need to store deleted item temporarily)
        }
      }
    },
    [setRecipes]
  );

  const getRecipeById = useCallback(
    (recipeId) => {
      return recipes?.find((r) => r.id === recipeId);
    },
    [recipes]
  );

  return {
    createRecipe,
    updateRecipe,
    deleteRecipe,
    getRecipeById,
  };
}
