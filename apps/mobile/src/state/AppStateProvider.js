import { createContext, useContext, useState, useEffect, useCallback } from "react";
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
  const [recipesOwnerId, setRecipesOwnerId] = useState(undefined);
  const [session, setSession] = useState(null);
  const [sessionHydrated, setSessionHydrated] = useState(false);
  const [user, setUser] = useState(null);
  const [households, setHouseholds] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [householdsLoading, setHouseholdsLoading] = useState(false);
  const [householdError, setHouseholdError] = useState("");
  const [selectedHouseholdId, setSelectedHouseholdId] = useState("");
  const [householdRevision, setHouseholdRevision] = useState(0);
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
      }
    })();
  }, []);

  const refreshHouseholds = useCallback(async () => {
    if (!supabase || !user?.id || !user.email) {
      setHouseholds([]);
      setPendingInvitations([]);
      setHouseholdsLoading(false);
      return;
    }

    setHouseholdsLoading(true);
    setHouseholdError("");
    try {
      const [{ data: householdData, error: householdLoadError }, { data: invitationData, error: invitationLoadError }] =
        await Promise.all([
          supabase
            .from("households")
            .select("id, name, owner_id, created_at")
            .order("created_at"),
          supabase
            .from("household_invitations")
            .select("id, household_id, invited_by, created_at, households(name)")
            .eq("email", user.email.toLowerCase())
            .eq("status", "pending")
            .order("created_at", { ascending: false }),
        ]);

      if (householdLoadError) throw householdLoadError;
      if (invitationLoadError) throw invitationLoadError;

      const nextHouseholds = householdData || [];
      setHouseholds(nextHouseholds);
      setPendingInvitations(invitationData || []);
      setHouseholdRevision((revision) => revision + 1);
      setSelectedHouseholdId((current) =>
        nextHouseholds.some((household) => household.id === current)
          ? current
          : nextHouseholds[0]?.id || ""
      );
    } catch (error) {
      console.error("Failed to load household data:", error);
      setHouseholdError(error.message || "Failed to load household data.");
    } finally {
      setHouseholdsLoading(false);
    }
  }, [user?.id, user?.email]);

  useEffect(() => {
    if (user?.id) {
      refreshHouseholds();
    } else {
      setHouseholds([]);
      setPendingInvitations([]);
      setSelectedHouseholdId("");
      setHouseholdsLoading(false);
      setHouseholdError("");
    }
  }, [user?.id, refreshHouseholds]);

  const createHousehold = useCallback(
    async (name, invitedEmails = []) => {
      if (!supabase) throw new Error("Households require an online account.");
      const { data, error } = await supabase.rpc("create_household", {
        household_name: name,
        invited_emails: invitedEmails,
      });
      if (error) throw error;
      await refreshHouseholds();
      return data;
    },
    [refreshHouseholds]
  );

  const respondToInvitation = useCallback(
    async (invitationId, accept) => {
      if (!supabase) throw new Error("Households require an online account.");
      const { error } = await supabase.rpc("respond_to_household_invite", {
        invitation_id: invitationId,
        accept_invitation: accept,
      });
      if (error) throw error;
      await refreshHouseholds();
    },
    [refreshHouseholds]
  );

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

  useEffect(() => {
    if (!sessionHydrated) return;
    let active = true;
    const ownerId = user?.id || null;

    setRecipesHydrated(false);
    setRecipesOwnerId(undefined);
    setRecipes([]);

    (async () => {
      try {
        const storageKey = ownerId
          ? `recipehelper:recipes:${ownerId}`
          : "recipehelper:recipes:local";
        const recipesJson = await AsyncStorage.getItem(storageKey);
        const restoredRecipes = recipesJson
          ? RECIPES_CODEC.deserialize(recipesJson)
          : [];
        if (active) {
          setRecipes(restoredRecipes);
          setRecipesOwnerId(ownerId);
          setRecipesHydrated(true);
        }
      } catch (error) {
        console.error("Failed to hydrate recipes:", error);
        if (active) {
          setRecipes([]);
          setRecipesOwnerId(ownerId);
          setRecipesHydrated(true);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [sessionHydrated, user?.id]);

  // Persist recipes whenever they change
  useEffect(() => {
    if (!recipesHydrated || recipesOwnerId !== (user?.id || null)) return;
    const storageKey = user?.id
      ? `recipehelper:recipes:${user.id}`
      : "recipehelper:recipes:local";
    AsyncStorage.setItem(
      storageKey,
      RECIPES_CODEC.serialize(recipes)
    ).catch((error) => console.error("Failed to persist recipes:", error));
  }, [recipes, recipesHydrated, recipesOwnerId, user?.id]);

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
    households,
    pendingInvitations,
    householdsLoading,
    householdError,
    householdRevision,
    selectedHouseholdId,
    setSelectedHouseholdId,
    refreshHouseholds,
    createHousehold,
    respondToInvitation,

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
