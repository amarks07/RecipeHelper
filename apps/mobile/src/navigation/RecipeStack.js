import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RecipeListScreen } from "../screens/recipes/RecipeListScreen";
import { RecipeDetailScreen } from "../screens/recipes/RecipeDetailScreen";
import { RecipeEditScreen } from "../screens/recipes/RecipeEditScreen";
import { useTheme } from "../theme/ThemeProvider";

const Stack = createNativeStackNavigator();

export function RecipeStack() {
  const { tokens } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: tokens.bg },
      }}
    >
      <Stack.Screen
        name="RecipeList"
        component={RecipeListScreen}
        options={{ title: "Recipes" }}
      />
      <Stack.Screen
        name="RecipeDetail"
        component={RecipeDetailScreen}
        options={{ title: "Recipe" }}
      />
      <Stack.Screen
        name="RecipeEdit"
        component={RecipeEditScreen}
        options={{ title: "Edit Recipe" }}
      />
    </Stack.Navigator>
  );
}
