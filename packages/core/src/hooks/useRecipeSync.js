import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase-client';

const SYNC_DEBOUNCE_MS = 1500;

/**
 * Cloud synchronization for recipes
 * Follows Barrow's pattern: debounced sync, conflict resolution (last-write-wins)
 */
export function useRecipeSync(setRecipes, session, householdRevision = 0) {
  const syncTimeoutRef = useRef(null);
  const lastSyncRef = useRef(0);

  const syncFromCloud = useCallback(async () => {
    if (!supabase || !session) return;

    try {
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          *,
          recipe_ingredients(*),
          recipe_instructions(*),
          recipe_tags(*)
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Transform database format to app format
      const recipes = (data || []).map((dbRecipe) => ({
        id: dbRecipe.id,
        userId: dbRecipe.user_id,
        householdId: dbRecipe.household_id,
        title: dbRecipe.title,
        description: dbRecipe.description,
        imageUrl: dbRecipe.image_url,
        prepTime: dbRecipe.prep_time_minutes,
        cookTime: dbRecipe.cook_time_minutes,
        servings: dbRecipe.servings,
        sourceUrl: dbRecipe.source_url,
        ingredients: dbRecipe.recipe_ingredients.map((ing) => ({
          name: ing.ingredient,
          quantity: ing.quantity,
          unit: ing.unit,
        })),
        instructions: dbRecipe.recipe_instructions
          .sort((a, b) => a.order - b.order)
          .map((instr) => instr.step),
        tags: dbRecipe.recipe_tags.map((tag) => tag.tag_name),
        recipeData: dbRecipe.recipe_data,
        createdAt: dbRecipe.created_at,
        updatedAt: dbRecipe.updated_at,
      }));

      setRecipes(recipes);
      lastSyncRef.current = Date.now();
    } catch (error) {
      console.error('Failed to sync recipes from cloud:', error);
    }
  }, [session, setRecipes, householdRevision]);

  const debouncedSync = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      syncFromCloud();
    }, SYNC_DEBOUNCE_MS);
  }, [syncFromCloud]);

  // Initial sync on mount and when session changes
  useEffect(() => {
    if (session) {
      syncFromCloud();
    }

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [session, syncFromCloud]);

  // Set up real-time subscription for recipe changes
  useEffect(() => {
    if (!supabase || !session) return;

    const subscription = supabase
      .channel('recipes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'recipes',
        },
        () => {
          // Debounce sync to avoid excessive updates
          debouncedSync();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [session, debouncedSync]);

  return {
    syncFromCloud,
    debouncedSync,
    lastSyncTime: lastSyncRef.current,
  };
}
