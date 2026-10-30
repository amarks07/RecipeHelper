import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HouseholdInvitationCard } from "../../components/households/HouseholdInvitationCard";
import { useAppState } from "../../state/AppStateProvider";
import { useTheme } from "../../theme/ThemeProvider";

export function HouseholdNotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();
  const { pendingInvitations, respondToInvitation, refreshHouseholds } = useAppState();
  const [workingId, setWorkingId] = useState("");

  const respond = async (id, accept) => {
    setWorkingId(id);
    try {
      await respondToInvitation(id, accept);
    } catch (error) {
      Alert.alert("Invitation error", error.message || "Could not update the invitation.");
    } finally {
      setWorkingId("");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg, paddingTop: insets.top }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text style={{ color: tokens.text, fontSize: 24, fontWeight: "700", marginBottom: 16 }}>
          Notifications
        </Text>
        {pendingInvitations.length === 0 ? (
          <Text style={{ color: tokens.textDim }}>You&apos;re all caught up.</Text>
        ) : (
          pendingInvitations.map((invitation) => (
            <HouseholdInvitationCard
              key={invitation.id}
              invitation={invitation}
              onRespond={respond}
              disabled={workingId === invitation.id}
              tokens={tokens}
            />
          ))
        )}
        <Text
          onPress={refreshHouseholds}
          style={{ color: tokens.accent, marginTop: 16, fontWeight: "600" }}
        >
          Refresh
        </Text>
      </ScrollView>
    </View>
  );
}
