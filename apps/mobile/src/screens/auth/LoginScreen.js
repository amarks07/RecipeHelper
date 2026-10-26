import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { supabase } from "@recipehelper/core";
import { useTheme } from "../../theme/ThemeProvider";

export function LoginScreen({ navigation }) {
  const { tokens } = useTheme();
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
    <View style={{ flex: 1, backgroundColor: tokens.bg, justifyContent: "center", padding: 20 }}>
      {/* Header */}
      <View style={{ marginBottom: 40 }}>
        <Text
          style={{
            fontSize: 32,
            fontWeight: "700",
            color: tokens.text,
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          Sign In
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: tokens.textDim,
            textAlign: "center",
          }}
        >
          Welcome back to RecipeHelper
        </Text>
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
