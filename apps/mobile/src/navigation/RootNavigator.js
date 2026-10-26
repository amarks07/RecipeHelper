import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RecipeStack } from "./RecipeStack";
import { AuthStack } from "./AuthStack";
import { useTheme } from "../theme/ThemeProvider";
import { useAppState } from "../state/AppStateProvider";

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const { tokens } = useTheme();
  const { session } = useAppState();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: tokens.bg },
      }}
    >
      {session ? (
        <Stack.Screen name="RecipeStackGroup" component={RecipeStack} />
      ) : (
        <Stack.Screen name="AuthStackGroup" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
}
