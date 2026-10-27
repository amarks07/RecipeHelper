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

      // Extract tokens from hash fragment (implicit flow)
      console.log("Redirect URL received:", result.url);
      const hash = result.url.split('#')[1]; // Extract hash fragment manually
      console.log("Hash value:", hash);

      if (!hash) {
        console.log("ERROR: No hash found!");
        Alert.alert("Error", "Google sign-in didn't work. Please try again.");
        return;
      }

      // Parse hash fragment to extract tokens
      console.log("Creating URLSearchParams with:", hash);
      const params = new URLSearchParams(hash);
      console.log("URLSearchParams created");

      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const expiresAt = params.get("expires_at");

      console.log("Tokens extracted:", {
        accessTokenLength: accessToken?.length,
        refreshTokenLength: refreshToken?.length,
        expiresAt,
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken
      });

      if (!accessToken) {
        const errorDesc = params.get("error_description") || params.get("error");
        console.log("No access token. Error:", errorDesc);
        if (errorDesc) {
          Alert.alert("Error", errorDesc);
        } else {
          Alert.alert("Error", "Google sign-in didn't work. Please try again.");
        }
        return;
      }

      // Set session with tokens directly
      console.log("Calling setSession...");
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      console.log("setSession response:", { error: sessionError?.message });

      if (sessionError) {
        console.error("Session error:", sessionError);
        Alert.alert("Error", sessionError.message || "Failed to complete sign-in");
      } else {
        console.log("Session set successfully!");
      }
      // On success, auth state listener in AppStateProvider handles session update
    } catch (err) {
      console.error("Google OAuth error:", err);
      Alert.alert("Error", err.message || "An error occurred during sign-in");
    }
  };

  return { signInWithGoogle };
}
