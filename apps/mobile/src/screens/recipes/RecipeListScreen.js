import { View } from "react-native";
import { RecipesListView } from "../../components/recipes/RecipesListView";
import { useAppState } from "../../state/AppStateProvider";
import { useRecipeActions } from "@recipehelper/core";

export function RecipeListScreen({ navigation }) {
  const { recipes, setRecipes } = useAppState();
  const { deleteRecipe } = useRecipeActions(recipes, setRecipes);

  const handleAddRecipe = () => {
    navigation.navigate("RecipeEdit", { recipeId: null });
  };

  const handleSelectRecipe = (recipeId) => {
    navigation.navigate("RecipeDetail", { recipeId });
  };

  const handleDeleteRecipe = (recipeId) => {
    deleteRecipe(recipeId);
  };

  const handleStartOCR = () => {
    navigation.navigate("RecipeOCR");
  };

  return (
    <RecipesListView
      recipes={recipes}
      onAddRecipe={handleAddRecipe}
      onSelectRecipe={handleSelectRecipe}
      onDeleteRecipe={handleDeleteRecipe}
      onStartOCR={handleStartOCR}
    />
  );
}
