import { Alert } from "react-native";
import { RecipeDetailView } from "../../components/recipes/RecipeDetailView";
import { useAppState } from "../../state/AppStateProvider";
import { useRecipeActions } from "@recipehelper/core";

export function RecipeDetailScreen({ navigation, route }) {
  const { recipeId } = route.params || {};
  const { recipes, setRecipes, user } = useAppState();
  const { getRecipeById, deleteRecipe } = useRecipeActions(recipes, setRecipes);

  const recipe = getRecipeById(recipeId);

  const handleEdit = () => {
    navigation.navigate("RecipeEdit", { recipeId });
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Recipe",
      "Are you sure you want to delete this recipe?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: () => {
            deleteRecipe(recipeId);
            navigation.goBack();
          },
          style: "destructive",
        },
      ]
    );
  };

  return (
    <RecipeDetailView
      recipe={recipe}
      onClose={() => navigation.goBack()}
      onEdit={handleEdit}
      onDelete={handleDelete}
      canManage={recipe?.userId === user?.id}
    />
  );
}
