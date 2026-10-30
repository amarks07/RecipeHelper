import { View } from "react-native";
import { RecipesListView } from "../../components/recipes/RecipesListView";
import { useAppState } from "../../state/AppStateProvider";
import { useRecipeActions, useRecipeSync } from "@recipehelper/core";

export function RecipeListScreen({ navigation }) {
  const {
    recipes,
    setRecipes,
    session,
    households,
    selectedHouseholdId,
    setSelectedHouseholdId,
    user,
    householdRevision,
  } = useAppState();
  useRecipeSync(setRecipes, session, householdRevision);
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
      households={households}
      selectedHouseholdId={selectedHouseholdId}
      onSelectHousehold={setSelectedHouseholdId}
      currentUserId={user?.id}
    />
  );
}
