import "./global.css";
import "react-native-url-polyfill/auto";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { ThemeProvider, useTheme } from "./src/theme/ThemeProvider";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { navigationRef } from "./src/navigation/navigationRef";
import { AppStateProvider, useAppState } from "./src/state/AppStateProvider";

SplashScreen.preventAutoHideAsync().catch(() => {});

function AppStatusBar() {
  const { theme } = useTheme();
  return <StatusBar style={theme === "dark" ? "light" : "dark"} />;
}

function ThemedApp() {
  const { theme, sessionHydrated, recipesHydrated } = useAppState();
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [customFontsLoaded, setCustomFontsLoaded] = useState(false);

  useEffect(() => {
    Font.loadAsync({
      FingerPaint: require("./assets/fonts/FingerPaint-Regular.ttf"),
    })
      .then(() => {
        setCustomFontsLoaded(true);
      })
      .catch(e => {
        console.error("Error loading custom fonts:", e);
        setCustomFontsLoaded(true); // Continue anyway
      });
  }, []);

  useEffect(() => {
    if (fontsLoaded && sessionHydrated && recipesHydrated) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, sessionHydrated, recipesHydrated]);

  if (!fontsLoaded || !sessionHydrated || !recipesHydrated) {
    return null;
  }

  return (
    <ThemeProvider theme={theme}>
      <View style={{ flex: 1 }}>
        <NavigationContainer ref={navigationRef}>
          <RootNavigator />
        </NavigationContainer>
        <AppStatusBar />
      </View>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppStateProvider>
          <ThemedApp />
        </AppStateProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
