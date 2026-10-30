import { useState } from "react";
import { View, Text, Alert, ScrollView } from "react-native";
import { Bell, LogOut, Trash2, Users } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppState } from "../../state/AppStateProvider";
import { useTheme } from "../../theme/ThemeProvider";
import { supabase } from "../../lib/supabase-client";
import { SketchButton as TouchableOpacity } from "../../components/ui/SketchButton";

export function ProfileSettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();
  const { user, households, pendingInvitations, handleSignOut } = useAppState();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLogout = async () => {
    Alert.alert("Sign Out", "Your recipes will be saved. Sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          setIsSigningOut(true);
          try {
            await handleSignOut();
          } catch (error) {
            console.error("Sign out error:", error);
            Alert.alert("Error", "Failed to sign out");
          } finally {
            setIsSigningOut(false);
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all your recipes. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              const { error } = await supabase.rpc("delete_user_account");
              if (error) throw error;
              Alert.alert("Account Deleted", "Your account has been deleted.");
              await handleSignOut();
            } catch (error) {
              console.error("Delete account error:", error);
              Alert.alert("Error", error.message || "Failed to delete account");
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: tokens.bg,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
      {/* Header */}
      <Text
        style={{
          fontSize: 36,
          fontWeight: "400",
          fontFamily: "FingerPaint",
          color: tokens.accent,
          marginBottom: 24,
        }}
      >
        nibble
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

      <View style={{ marginBottom: 20 }}>
        <TouchableOpacity
          onPress={() => navigation.navigate("HouseholdNotifications")}
          style={{
            backgroundColor: tokens.surface,
            borderColor: tokens.line,
            borderWidth: 1,
            borderRadius: 8,
            padding: 14,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            marginBottom: 10,
          }}
        >
          <Bell size={18} color={tokens.accent} />
          <Text style={{ color: tokens.text, fontWeight: "600", flex: 1 }}>
            Notifications
          </Text>
          {pendingInvitations.length > 0 && (
            <View style={{ backgroundColor: tokens.danger, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 }}>
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
                {pendingInvitations.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        {households.some((household) => household.owner_id === user?.id) && (
          <TouchableOpacity
            onPress={() => navigation.navigate("HouseholdManagement")}
            style={{
              backgroundColor: tokens.surface,
              borderColor: tokens.line,
              borderWidth: 1,
              borderRadius: 8,
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Users size={18} color={tokens.accent} />
            <Text style={{ color: tokens.text, fontWeight: "600" }}>
              Manage household
            </Text>
          </TouchableOpacity>
        )}
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
          marginBottom: 12,
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

      {/* Delete Account Button */}
      <TouchableOpacity
        onPress={handleDeleteAccount}
        disabled={isDeleting}
        style={{
          backgroundColor: "#dc2626",
          borderRadius: 8,
          paddingVertical: 14,
          paddingHorizontal: 16,
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "center",
          gap: 8,
          opacity: isDeleting ? 0.7 : 1,
          marginBottom: 24,
        }}
      >
        <Trash2 size={18} color="#fff" />
        <Text
          style={{
            color: "#fff",
            fontWeight: "600",
            fontSize: 14,
          }}
        >
          {isDeleting ? "Deleting..." : "Delete Account"}
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
          Supabase&apos;s Row Level Security. Household recipes are shared only with household members.
        </Text>
      </View>
      </ScrollView>
    </View>
  );
}
