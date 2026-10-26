import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase-client';

/**
 * Search recipes locally or via cloud
 */
export function useRecipeSearch(recipes) {
  const [searchResults, setSearchResults] = useState(recipes || []);
  const [isSearching, setIsSearching] = useState(false);

  const searchLocal = useCallback(
    (query) => {
      if (!query || query.trim() === '') {
        setSearchResults(recipes || []);
        return;
      }

      const lowerQuery = query.toLowerCase();
      const results = (recipes || []).filter((recipe) => {
        const titleMatch = recipe.title.toLowerCase().includes(lowerQuery);
        const descriptionMatch = recipe.description?.toLowerCase().includes(lowerQuery);
        const ingredientMatch = recipe.ingredients?.some((ing) =>
          ing.name.toLowerCase().includes(lowerQuery)
        );

        return titleMatch || descriptionMatch || ingredientMatch;
      });

      setSearchResults(results);
    },
    [recipes]
  );

  const searchCloud = useCallback(
    async (query, tags = [], limit = 20) => {
      if (!supabase) {
        searchLocal(query);
        return;
      }

      setIsSearching(true);

      try {
        const { data, error } = await supabase.functions.invoke('recipe-search', {
          body: {
            query,
            tags,
            limit,
          },
        });

        if (error) throw error;

        setSearchResults(data.recipes || []);
      } catch (error) {
        console.error('Cloud search failed, falling back to local:', error);
        searchLocal(query);
      } finally {
        setIsSearching(false);
      }
    },
    [searchLocal]
  );

  const filterByTags = useCallback(
    (selectedTags) => {
      if (!selectedTags || selectedTags.length === 0) {
        setSearchResults(recipes || []);
        return;
      }

      const results = (recipes || []).filter((recipe) =>
        selectedTags.every((tag) => recipe.tags?.includes(tag))
      );

      setSearchResults(results);
    },
    [recipes]
  );

  return {
    searchResults,
    isSearching,
    searchLocal,
    searchCloud,
    filterByTags,
  };
}
