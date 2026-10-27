import { Platform, Alert } from "react-native";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "../lib/supabase-client";

export function useGoogleAuth() {
  const signInWithGoogle = async () => {
    try {
      // On web, open OAuth in the same window
      if (Platform.OS === "web") {
        await supabase.auth.signInWithOAuth({ provider: "google" });
        return;
      }

      // On native, open browser tab for OAuth
      const redirectTo = Linking.createURL("auth-callback");
      console.log("Redirect URL:", redirectTo);

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo, skipBrowserRedirect: true },
      });

      console.log("OAuth URL:", data?.url);
      console.log("OAuth Error:", oauthError?.message);

      if (oauthError || !data?.url) {
        Alert.alert("Error", oauthError?.message || "Failed to start Google sign-in");
        return;
      }

      // Open browser to complete OAuth flow
      console.log("Opening browser...");
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      console.log("Browser result:", result);

      if (result.type !== "success" || !result.url) {
        console.log("User cancelled or no URL returned");
        return; // User cancelled
      }

      // Extract authorization code from redirect
      console.log("Redirect URL received:", result.url);
      const { queryParams } = Linking.parse(result.url);
      console.log("Query params:", queryParams);

      if (!queryParams?.code) {
        const description = queryParams?.error_description || queryParams?.error;
        console.log("Error description:", description);
        if (description) {
          Alert.alert("Error", description);
        } else {
          Alert.alert("Error", "Google sign-in didn't work. Please try again.");
        }
        return;
      }

      // Exchange code for session
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(queryParams.code);
      if (exchangeError) {
        Alert.alert("Error", exchangeError.message || "Failed to complete sign-in");
      }
      // On success, auth state listener in AppStateProvider handles session update
    } catch (err) {
      console.error("Google OAuth error:", err);
      Alert.alert("Error", err.message || "An error occurred during sign-in");
    }
  };

  return { signInWithGoogle };
}
