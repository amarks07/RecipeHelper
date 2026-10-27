import { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase-client";
import { RECIPES_CODEC } from "@recipehelper/core";

const AppStateContext = createContext();

/**
 * Root app state provider
 * Manages: recipes, user session, theme preference, auth
 * Follows Barrow's pattern: persisted local state + cloud sync
 */
export function AppStateProvider({ children }) {
  const [theme, setTheme] = useState("system");
  const [recipes, setRecipes] = useState([]);
  const [recipesHydrated, setRecipesHydrated] = useState(false);
  const [session, setSession] = useState(null);
  const [sessionHydrated, setSessionHydrated] = useState(false);
  const [user, setUser] = useState(null);
  const [dietaryProfile, setDietaryProfile] = useState({
    dietaryRestrictions: [],
    allergies: [],
    preferredUnits: "metric",
    cuisinePreferences: [],
  });

  // Hydrate persisted state from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        // Restore recipes
        const recipesJson = await AsyncStorage.getItem("recipehelper:recipes");
        if (recipesJson) {
          const parsed = RECIPES_CODEC.deserialize(recipesJson);
          setRecipes(parsed);
        }
        setRecipesHydrated(true);

        // Restore theme
        const savedTheme = await AsyncStorage.getItem("recipehelper:theme");
        if (savedTheme) setTheme(savedTheme);

        // Restore dietary profile
        const dietaryJson = await AsyncStorage.getItem("recipehelper:dietary");
        if (dietaryJson) {
          setDietaryProfile(JSON.parse(dietaryJson));
        }
      } catch (error) {
        console.error("Failed to hydrate state:", error);
        setRecipesHydrated(true);
        setSessionHydrated(true);
      }
    })();
  }, []);

  // Restore Supabase session and set up auth listener
  useEffect(() => {
    if (!supabase) {
      setSessionHydrated(true);
      return;
    }

    (async () => {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user || null);
        setSessionHydrated(true);
      } catch (error) {
        console.error("Failed to restore session:", error);
        setSessionHydrated(true);
      }
    })();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user || null);

      // Clear recipes on logout
      if (event === "SIGNED_OUT") {
        setRecipes([]);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  // Persist recipes whenever they change
  useEffect(() => {
    if (!recipesHydrated) return;
    AsyncStorage.setItem(
      "recipehelper:recipes",
      RECIPES_CODEC.serialize(recipes)
    ).catch((error) => console.error("Failed to persist recipes:", error));
  }, [recipes, recipesHydrated]);

  // Persist theme preference
  useEffect(() => {
    AsyncStorage.setItem("recipehelper:theme", theme).catch((error) =>
      console.error("Failed to persist theme:", error)
    );
  }, [theme]);

  // Persist dietary profile
  useEffect(() => {
    AsyncStorage.setItem(
      "recipehelper:dietary",
      JSON.stringify(dietaryProfile)
    ).catch((error) => console.error("Failed to persist dietary profile:", error));
  }, [dietaryProfile]);

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  const value = {
    // Recipes
    recipes,
    setRecipes,
    recipesHydrated,

    // Session & Auth
    session,
    sessionHydrated,
    user,
    handleSignOut,

    // Theme
    theme,
    setTheme,

    // Dietary profile
    dietaryProfile,
    setDietaryProfile,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within AppStateProvider");
  }
  return context;
}
