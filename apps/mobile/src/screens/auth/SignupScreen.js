import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "@recipehelper/core";
import { useTheme } from "../../theme/ThemeProvider";
import { useGoogleAuth } from "../../hooks/useGoogleAuth";

export function SignupScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();
  const { signInWithGoogle } = useGoogleAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Missing fields", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Passwords don't match", "Please enter matching passwords");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      Alert.alert("Success", "Check your email to confirm your account!");
      navigation.navigate("Login");
    } catch (error) {
      Alert.alert("Sign up failed", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: tokens.bg }}>
      <View style={{ padding: 20, paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }}>
        {/* Header */}
        <View style={{ marginBottom: 40 }}>
          <Text
            style={{
              fontSize: 36,
              fontWeight: "400",
              fontFamily: "FingerPaint",
              color: tokens.accent,
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            Create Account
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: tokens.textDim,
              textAlign: "center",
            }}
          >
            Start managing your recipes
          </Text>
        </View>

        {/* Google Sign Up */}
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
            placeholder="At least 6 characters"
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
              marginBottom: 16,
            }}
          />

          {/* Confirm Password */}
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: tokens.textDim,
              marginBottom: 6,
            }}
          >
            Confirm Password
          </Text>
          <TextInput
            placeholder="Confirm password"
            placeholderTextColor={tokens.textDim}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
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

        {/* Sign Up Button */}
        <TouchableOpacity
          onPress={handleSignup}
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
            {isLoading ? "Creating account..." : "Create Account"}
          </Text>
        </TouchableOpacity>

        {/* Sign In Link */}
        <TouchableOpacity
          onPress={() => navigation.navigate("Login")}
          disabled={isLoading}
        >
          <Text
            style={{
              textAlign: "center",
              color: tokens.textDim,
              fontSize: 14,
            }}
          >
            Already have an account?{" "}
            <Text
              style={{
                color: tokens.accent,
                fontWeight: "600",
              }}
            >
              Sign in
            </Text>
          </Text>
        </TouchableOpacity>

        {/* Privacy Info */}
        <View
          style={{
            backgroundColor: tokens.accent + "20",
            borderColor: tokens.accent,
            borderWidth: 1,
            borderRadius: 8,
            padding: 12,
            marginTop: 24,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              color: tokens.accent,
              lineHeight: 18,
            }}
          >
            <Text style={{ fontWeight: "600" }}>Privacy:</Text> Your recipes are always private
            and synced securely across your devices.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
