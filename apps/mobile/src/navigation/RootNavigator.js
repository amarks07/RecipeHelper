import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthStack } from "./AuthStack";
import { MainTabs } from "./MainTabs";
import { HouseholdSetupScreen } from "../screens/households/HouseholdSetupScreen";
import { ActivityIndicator, Text, View } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { useAppState } from "../state/AppStateProvider";

const Stack = createNativeStackNavigator();

function HouseholdLoadingScreen() {
  const { tokens } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg, justifyContent: "center", alignItems: "center", gap: 12 }}>
      <ActivityIndicator color={tokens.accent} />
      <Text style={{ color: tokens.textDim }}>Loading your households...</Text>
    </View>
  );
}

export function RootNavigator() {
  const { tokens } = useTheme();
  const { session, households, householdsLoading } = useAppState();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: tokens.bg },
      }}
    >
      {!session ? (
        <Stack.Screen name="AuthStackGroup" component={AuthStack} />
      ) : households.length > 0 ? (
        <Stack.Screen name="MainTabs" component={MainTabs} />
      ) : householdsLoading ? (
        <Stack.Screen name="HouseholdLoading" component={HouseholdLoadingScreen} />
      ) : (
        <Stack.Screen name="HouseholdSetup" component={HouseholdSetupScreen} />
      )}
    </Stack.Navigator>
  );
}
