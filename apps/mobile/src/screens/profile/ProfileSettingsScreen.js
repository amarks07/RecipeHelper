import { useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { LogOut } from "lucide-react-native";
import { useAppState } from "../../state/AppStateProvider";
import { useTheme } from "../../theme/ThemeProvider";

export function ProfileSettingsScreen() {
  const { tokens } = useTheme();
  const { user, handleSignOut } = useAppState();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleLogout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          setIsSigningOut(true);
          try {
            await handleSignOut();
          } catch (error) {
            Alert.alert("Error", "Failed to sign out");
          } finally {
            setIsSigningOut(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg, padding: 16 }}>
      {/* Header */}
      <Text
        style={{
          fontSize: 28,
          fontWeight: "700",
          color: tokens.text,
          marginBottom: 24,
        }}
      >
        Profile
      </Text>

      {/* Account Section */}
      <View
        style={{
          backgroundColor: tokens.surface,
          borderRadius: 12,
          borderColor: tokens.line,
          borderWidth: 1,
          padding: 16,
          marginBottom: 20,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: tokens.textDim,
            marginBottom: 8,
          }}
        >
          Account
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: tokens.text,
            marginBottom: 12,
          }}
        >
          {user?.email}
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: tokens.textDim,
            lineHeight: 18,
          }}
        >
          Your recipes sync securely across all your devices using Supabase.
        </Text>
      </View>

      {/* Settings Section */}
      <View
        style={{
          backgroundColor: tokens.surface,
          borderRadius: 12,
          borderColor: tokens.line,
          borderWidth: 1,
          padding: 16,
          marginBottom: 20,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: tokens.textDim,
            marginBottom: 12,
          }}
        >
          Settings
        </Text>
        <View style={{ marginBottom: 12 }}>
          <Text
            style={{
              fontSize: 13,
              color: tokens.text,
              fontWeight: "500",
              marginBottom: 4,
            }}
          >
            ✅ Cloud Sync
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: tokens.textDim,
            }}
          >
            Your recipes are synced in real-time
          </Text>
        </View>
        <View>
          <Text
            style={{
              fontSize: 13,
              color: tokens.text,
              fontWeight: "500",
              marginBottom: 4,
            }}
          >
            ✅ Offline Mode
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: tokens.textDim,
            }}
          >
            All recipes available offline
          </Text>
        </View>
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity
        onPress={handleLogout}
        disabled={isSigningOut}
        style={{
          backgroundColor: tokens.danger,
          borderRadius: 8,
          paddingVertical: 14,
          paddingHorizontal: 16,
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "center",
          gap: 8,
          opacity: isSigningOut ? 0.7 : 1,
        }}
      >
        <LogOut size={18} color="#fff" />
        <Text
          style={{
            color: "#fff",
            fontWeight: "600",
            fontSize: 14,
          }}
        >
          {isSigningOut ? "Signing out..." : "Sign Out"}
        </Text>
      </TouchableOpacity>

      {/* Info */}
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
          <Text style={{ fontWeight: "600" }}>Tip:</Text> Your recipes are protected by
          Supabase's Row Level Security. Only you can access your data.
        </Text>
      </View>
    </View>
  );
}
