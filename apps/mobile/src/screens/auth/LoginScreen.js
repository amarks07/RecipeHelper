import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "@recipehelper/core";
import { useTheme } from "../../theme/ThemeProvider";
import { useGoogleAuth } from "../../hooks/useGoogleAuth";

export function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();
  const { signInWithGoogle } = useGoogleAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing fields", "Please enter email and password");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Navigation handled by auth state listener in App.js
    } catch (error) {
      Alert.alert("Sign in failed", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: tokens.bg,
        justifyContent: "center",
        paddingHorizontal: 20,
        paddingTop: insets.top + 20,
        paddingBottom: insets.bottom + 20,
      }}
    >
      {/* Header */}
      <View style={{ marginBottom: 40 }}>
        <Text
          style={{
            fontSize: 48,
            fontWeight: "400",
            fontFamily: "Finger Paint",
            color: tokens.accent,
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          nibble
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: tokens.textDim,
            textAlign: "center",
          }}
        >
          Welcome back to nibble
        </Text>
      </View>

      {/* Google Sign In */}
      <TouchableOpacity
        onPress={signInWithGoogle}
        disabled={isLoading}
        style={{
          backgroundColor: tokens.surface,
          borderColor: tokens.line,
          borderWidth: 1,
          borderRadius: 8,
          paddingVertical: 14,
          alignItems: "center",
          opacity: isLoading ? 0.7 : 1,
          marginBottom: 20,
        }}
      >
        <Text
          style={{
            color: tokens.text,
            fontWeight: "600",
            fontSize: 16,
          }}
        >
          {isLoading ? "…" : "Continue with Google"}
        </Text>
      </TouchableOpacity>

      {/* Divider */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: tokens.line }} />
        <Text style={{ marginHorizontal: 12, color: tokens.textDim, fontSize: 12 }}>or</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: tokens.line }} />
      </View>

      {/* Form */}
      <View style={{ marginBottom: 20 }}>
        {/* Email */}
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: tokens.textDim,
            marginBottom: 6,
          }}
        >
          Email
        </Text>
        <TextInput
          placeholder="you@example.com"
          placeholderTextColor={tokens.textDim}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isLoading}
          style={{
            backgroundColor: tokens.surface,
            borderColor: tokens.line,
            borderWidth: 1,
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 12,
            color: tokens.text,
            fontSize: 14,
            marginBottom: 16,
          }}
        />

        {/* Password */}
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: tokens.textDim,
            marginBottom: 6,
          }}
        >
          Password
        </Text>
        <TextInput
          placeholder="Your password"
          placeholderTextColor={tokens.textDim}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!isLoading}
          style={{
            backgroundColor: tokens.surface,
            borderColor: tokens.line,
            borderWidth: 1,
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 12,
            color: tokens.text,
            fontSize: 14,
            marginBottom: 20,
          }}
        />
      </View>

      {/* Sign In Button */}
      <TouchableOpacity
        onPress={handleLogin}
        disabled={isLoading}
        style={{
          backgroundColor: tokens.accent,
          borderRadius: 8,
          paddingVertical: 14,
          alignItems: "center",
          opacity: isLoading ? 0.7 : 1,
          marginBottom: 16,
        }}
      >
        <Text
          style={{
            color: tokens.onAccent,
            fontWeight: "600",
            fontSize: 16,
          }}
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </Text>
      </TouchableOpacity>

      {/* Sign Up Link */}
      <TouchableOpacity
        onPress={() => navigation.navigate("Signup")}
        disabled={isLoading}
      >
        <Text
          style={{
            textAlign: "center",
            color: tokens.textDim,
            fontSize: 14,
          }}
        >
          Don't have an account?{" "}
          <Text
            style={{
              color: tokens.accent,
              fontWeight: "600",
            }}
          >
            Sign up
          </Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}
