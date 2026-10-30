import { useState } from "react";
import { RecipeEditForm } from "../../components/recipes/RecipeEditForm";
import { useAppState } from "../../state/AppStateProvider";
import { useRecipeActions } from "@recipehelper/core";

export function RecipeEditScreen({ navigation, route }) {
  const { recipeId } = route.params || {};
  const { recipes, setRecipes, households, selectedHouseholdId } = useAppState();
  const { createRecipe, updateRecipe, getRecipeById } = useRecipeActions(recipes, setRecipes);
  const [isSaving, setIsSaving] = useState(false);

  const recipe = recipeId ? getRecipeById(recipeId) : null;

  const handleSave = async (formData) => {
    setIsSaving(true);
    try {
      if (recipe) {
        await updateRecipe(recipeId, formData);
      } else {
        await createRecipe(formData);
      }
      navigation.goBack();
    } catch (error) {
      console.error("Failed to save recipe:", error);
      alert(error.message || "Failed to save recipe. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <RecipeEditForm
      initialRecipe={recipe}
      onSave={handleSave}
      onCancel={() => navigation.goBack()}
      isSaving={isSaving}
      households={households}
      selectedHouseholdId={selectedHouseholdId}
    />
  );
}
