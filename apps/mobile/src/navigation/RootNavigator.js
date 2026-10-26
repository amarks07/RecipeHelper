import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RecipeStack } from "./RecipeStack";
import { useTheme } from "../theme/ThemeProvider";

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const { tokens } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: tokens.bg },
      }}
    >
      <Stack.Screen name="RecipeStackGroup" component={RecipeStack} />
    </Stack.Navigator>
  );
}
