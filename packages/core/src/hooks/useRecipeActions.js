import { useCallback } from 'react';
import { supabase } from '../lib/supabase-client';

/**
 * CRUD operations for recipes
 * Follows Barrow's pattern: optimistic updates to local state,
 * background sync to cloud
 */
export function useRecipeActions(recipes, setRecipes) {

  const createRecipe = useCallback(
    async (recipe) => {
      if (!setRecipes) return null;

      const recipeWithId = {
        ...recipe,
        id: `local_${Date.now()}`, // Temporary ID
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Optimistic update
      setRecipes((prev) => [...prev, recipeWithId]);

      // Cloud sync
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('recipes')
            .insert({
              title: recipe.title,
              description: recipe.description,
              image_url: recipe.imageUrl,
              prep_time_minutes: recipe.prepTime,
              cook_time_minutes: recipe.cookTime,
              servings: recipe.servings,
              source_url: recipe.sourceUrl,
              recipe_data: recipe.recipeData || {},
            })
            .select()
            .single();

          if (error) throw error;

          // Replace temp ID with real ID
          setRecipes((prev) =>
            prev.map((r) =>
              r.id === recipeWithId.id
                ? { ...recipeWithId, id: data.id }
                : r
            )
          );

          // Insert ingredients
          if (recipe.ingredients && recipe.ingredients.length > 0) {
            const ingredientRows = recipe.ingredients.map((ing, idx) => ({
              recipe_id: data.id,
              ingredient: ing.name,
              quantity: ing.quantity,
              unit: ing.unit,
              order: idx,
            }));

            await supabase.from('recipe_ingredients').insert(ingredientRows);
          }

          // Insert instructions
          if (recipe.instructions && recipe.instructions.length > 0) {
            const instructionRows = recipe.instructions.map((instr, idx) => ({
              recipe_id: data.id,
              step: instr,
              order: idx,
            }));

            await supabase.from('recipe_instructions').insert(instructionRows);
          }

          // Insert tags
          if (recipe.tags && recipe.tags.length > 0) {
            const tagRows = recipe.tags.map((tag) => ({
              recipe_id: data.id,
              tag_name: tag,
            }));

            await supabase.from('recipe_tags').insert(tagRows);
          }

          return data;
        } catch (error) {
          console.error('Failed to sync recipe to cloud:', error);
          // Keep local copy even if sync fails
        }
      }

      return recipeWithId;
    },
    [setRecipes]
  );

  const updateRecipe = useCallback(
    async (recipeId, updates) => {
      if (!setRecipes) return;

      // Optimistic update
      setRecipes((prev) =>
        prev.map((r) =>
          r.id === recipeId
            ? { ...r, ...updates, updatedAt: new Date().toISOString() }
            : r
        )
      );

      // Cloud sync
      if (supabase && !recipeId.startsWith('local_')) {
        try {
          const { error } = await supabase
            .from('recipes')
            .update({
              title: updates.title,
              description: updates.description,
              image_url: updates.imageUrl,
              prep_time_minutes: updates.prepTime,
              cook_time_minutes: updates.cookTime,
              servings: updates.servings,
              source_url: updates.sourceUrl,
              recipe_data: updates.recipeData,
            })
            .eq('id', recipeId);

          if (error) throw error;

          // Update ingredients if provided
          if (updates.ingredients) {
            // Delete old ingredients
            await supabase
              .from('recipe_ingredients')
              .delete()
              .eq('recipe_id', recipeId);

            // Insert new ingredients
            const ingredientRows = updates.ingredients.map((ing, idx) => ({
              recipe_id: recipeId,
              ingredient: ing.name,
              quantity: ing.quantity,
              unit: ing.unit,
              order: idx,
            }));

            await supabase.from('recipe_ingredients').insert(ingredientRows);
          }

          // Similar for instructions and tags...
        } catch (error) {
          console.error('Failed to update recipe in cloud:', error);
        }
      }
    },
    [setRecipes]
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
