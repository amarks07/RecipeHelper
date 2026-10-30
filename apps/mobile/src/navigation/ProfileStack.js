import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HouseholdManagementScreen } from "../screens/profile/HouseholdManagementScreen";
import { HouseholdNotificationsScreen } from "../screens/profile/HouseholdNotificationsScreen";
import { ProfileSettingsScreen } from "../screens/profile/ProfileSettingsScreen";
import { useTheme } from "../theme/ThemeProvider";

const Stack = createNativeStackNavigator();

export function ProfileStack() {
  const { tokens } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: tokens.bg },
      }}
    >
      <Stack.Screen name="ProfileHome" component={ProfileSettingsScreen} />
      <Stack.Screen name="HouseholdNotifications" component={HouseholdNotificationsScreen} />
      <Stack.Screen name="HouseholdManagement" component={HouseholdManagementScreen} />
    </Stack.Navigator>
  );
}
