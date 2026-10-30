import { useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HouseholdInvitationCard } from "../../components/households/HouseholdInvitationCard";
import { useAppState } from "../../state/AppStateProvider";
import { useTheme } from "../../theme/ThemeProvider";
import { SketchButton as TouchableOpacity } from "../../components/ui/SketchButton";

export function HouseholdSetupScreen() {
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();
  const {
    pendingInvitations,
    householdsLoading,
    householdError,
    refreshHouseholds,
    createHousehold,
    respondToInvitation,
  } = useAppState();
  const [name, setName] = useState("");
  const [emails, setEmails] = useState("");
  const [workingId, setWorkingId] = useState("");
  const [isCreating, setIsCreating] = useState(false);

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

  const submit = async () => {
    if (!name.trim()) {
      Alert.alert("Household name required", "Enter a name for your household.");
      return;
    }
    const invitedEmails = [...new Set(
      emails
        .split(/[,\n;]/)
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean)
    )];

    setIsCreating(true);
    try {
      await createHousehold(name.trim(), invitedEmails);
    } catch (error) {
      Alert.alert("Could not create household", error.message || "Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg, paddingTop: insets.top }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
        <Text style={{ color: tokens.accent, fontSize: 32, fontFamily: "FingerPaint", marginBottom: 8 }}>
          nibble
        </Text>
        <Text style={{ color: tokens.text, fontSize: 24, fontWeight: "700", marginBottom: 8 }}>
          Set up your household
        </Text>
        <Text style={{ color: tokens.textDim, lineHeight: 21, marginBottom: 24 }}>
          Create a household or accept an invitation before adding recipes.
        </Text>

        {householdError ? (
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: tokens.danger, marginBottom: 8 }}>{householdError}</Text>
            <TouchableOpacity onPress={refreshHouseholds}>
              <Text style={{ color: tokens.accent, fontWeight: "600" }}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {pendingInvitations.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text style={{ color: tokens.text, fontSize: 18, fontWeight: "600", marginBottom: 12 }}>
              Household invitations
            </Text>
            {pendingInvitations.map((invitation) => (
              <HouseholdInvitationCard
                key={invitation.id}
                invitation={invitation}
                onRespond={respond}
                disabled={workingId === invitation.id || householdsLoading}
                tokens={tokens}
              />
            ))}
          </View>
        )}

        <View
          style={{
            backgroundColor: tokens.surface,
            borderColor: tokens.line,
            borderWidth: 1,
            borderRadius: 12,
            padding: 16,
          }}
        >
          <Text style={{ color: tokens.text, fontSize: 18, fontWeight: "600", marginBottom: 16 }}>
            Create a household
          </Text>
          <Text style={{ color: tokens.textDim, fontSize: 13, marginBottom: 6 }}>
            Household name
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. The Rivera family"
            placeholderTextColor={tokens.textDim}
            maxLength={100}
            style={{
              backgroundColor: tokens.bg,
              borderColor: tokens.line,
              borderWidth: 1,
              borderRadius: 8,
              color: tokens.text,
              padding: 12,
              marginBottom: 16,
            }}
          />
          <Text style={{ color: tokens.textDim, fontSize: 13, marginBottom: 6 }}>
            Invite by email (optional)
          </Text>
          <TextInput
            value={emails}
            onChangeText={setEmails}
            placeholder="Separate email addresses with commas or new lines"
            placeholderTextColor={tokens.textDim}
            multiline
            style={{
              minHeight: 76,
              textAlignVertical: "top",
              backgroundColor: tokens.bg,
              borderColor: tokens.line,
              borderWidth: 1,
              borderRadius: 8,
              color: tokens.text,
              padding: 12,
              marginBottom: 16,
            }}
          />
          <TouchableOpacity
            onPress={submit}
            disabled={isCreating || householdsLoading}
            style={{
              alignItems: "center",
              backgroundColor: tokens.accent,
              borderRadius: 8,
              paddingVertical: 13,
              opacity: isCreating || householdsLoading ? 0.6 : 1,
            }}
          >
            <Text style={{ color: tokens.onAccent, fontWeight: "700" }}>
              {isCreating ? "Creating..." : "Create household"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
