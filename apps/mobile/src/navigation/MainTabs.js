import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { BookOpen, UserRound } from "lucide-react-native";
import { ProfileStack } from "./ProfileStack";
import { RecipeStack } from "./RecipeStack";
import { useAppState } from "../state/AppStateProvider";
import { useTheme } from "../theme/ThemeProvider";

const Tab = createBottomTabNavigator();

export function MainTabs() {
  const { tokens } = useTheme();
  const { pendingInvitations, refreshHouseholds } = useAppState();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tokens.accent,
        tabBarInactiveTintColor: tokens.textDim,
        tabBarStyle: {
          backgroundColor: tokens.surface,
          borderTopColor: tokens.line,
        },
        tabBarBadgeStyle: {
          backgroundColor: tokens.danger,
          color: "#fff",
        },
      }}
    >
      <Tab.Screen
        name="RecipesTab"
        component={RecipeStack}
        options={{
          title: "Recipes",
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        listeners={{ tabPress: () => refreshHouseholds() }}
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} />,
          tabBarBadge: pendingInvitations.length || undefined,
        }}
      />
    </Tab.Navigator>
  );
}
