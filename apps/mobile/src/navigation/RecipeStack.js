import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RecipeListScreen } from "../screens/recipes/RecipeListScreen";
import { RecipeDetailScreen } from "../screens/recipes/RecipeDetailScreen";
import { RecipeEditScreen } from "../screens/recipes/RecipeEditScreen";
import { RecipeOCRScreen } from "../screens/recipes/RecipeOCRScreen";
import { OCRProcessingScreen } from "../screens/recipes/OCRProcessingScreen";
import { OCRReviewScreen } from "../screens/recipes/OCRReviewScreen";
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
      <Stack.Screen
        name="RecipeOCR"
        component={RecipeOCRScreen}
        options={{
          title: "Capture Recipe",
          animationEnabled: true,
        }}
      />
      <Stack.Screen
        name="OCRProcessing"
        component={OCRProcessingScreen}
        options={{
          title: "Processing",
          animationEnabled: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="OCRReview"
        component={OCRReviewScreen}
        options={{
          title: "Review Recipe",
          animationEnabled: true,
        }}
      />
    </Stack.Navigator>
  );
}
