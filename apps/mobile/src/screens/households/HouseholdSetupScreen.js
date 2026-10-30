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
import { supabase } from "../../lib/supabase-client";
import { sendHouseholdInvite } from "@recipehelper/core";
import { PushableButton as TouchableOpacity } from "../../components/ui/PushableButton";

export function HouseholdSetupScreen() {
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();
  const {
    pendingInvitations,
    householdsLoading,
    householdError,
    refreshHouseholds,
    respondToInvitation,
  } = useAppState();
  const [name, setName] = useState("");
  const [householdId, setHouseholdId] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [pendingInvites, setPendingInvites] = useState([]);
  const [workingId, setWorkingId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

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
    setIsCreating(true);
    try {
      const { data, error } = await supabase.rpc("create_household", {
        household_name: name.trim(),
        invited_emails: [],
      });
      if (error) throw error;
      setHouseholdId(data);
    } catch (error) {
      Alert.alert("Could not create household", error.message || "Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const invite = async () => {
    setIsInviting(true);
    try {
      const invitation = await sendHouseholdInvite(supabase, householdId, inviteEmail);
      setInviteEmail("");
      setPendingInvites((current) => [
        {
          id: invitation.invitationId,
          email: invitation.email,
        },
        ...current.filter((item) => item.id !== invitation.invitationId),
      ]);
    } catch (error) {
      Alert.alert("Could not send invitation", error.message || "Please try again.");
      const { data } = await supabase
        .from("household_invitations")
        .select("id, email")
        .eq("household_id", householdId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (data) setPendingInvites(data);
    } finally {
      setIsInviting(false);
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
          {!householdId ? (
            <>
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
              <TouchableOpacity
                onPress={submit}
                disabled={isCreating || householdsLoading}
                style={{
                  alignItems: "center",
                  backgroundColor: tokens.accent,
                  borderRadius: 8,
                  opacity: isCreating || householdsLoading ? 0.6 : 1,
                }}
              >
                <Text style={{ color: tokens.onAccent, fontWeight: "700" }}>
                  {isCreating ? "Creating..." : "Create household"}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={{ color: tokens.text, fontSize: 18, fontWeight: "600", marginBottom: 12 }}>
                Invite someone to {name}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <TextInput
                  value={inviteEmail}
                  onChangeText={setInviteEmail}
                  placeholder="name@example.com"
                  placeholderTextColor={tokens.textDim}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    backgroundColor: tokens.bg,
                    borderColor: tokens.line,
                    borderWidth: 1,
                    borderRadius: 8,
                    color: tokens.text,
                    padding: 12,
                  }}
                />
                <TouchableOpacity
                  onPress={invite}
                  disabled={isInviting || !inviteEmail.trim()}
                  style={{ alignItems: "center", opacity: isInviting ? 0.6 : 1 }}
                >
                  <Text style={{ color: tokens.onAccent, fontWeight: "700" }}>
                    {isInviting ? "Inviting..." : "Invite"}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={{ color: tokens.text, fontSize: 16, fontWeight: "600", marginTop: 20, marginBottom: 8 }}>
                Pending invites
              </Text>
              {pendingInvites.length ? pendingInvites.map((invitation) => (
                <Text key={invitation.id} style={{ color: tokens.text, paddingVertical: 6 }}>
                  {invitation.email}
                </Text>
              )) : (
                <Text style={{ color: tokens.textDim }}>No pending invites yet.</Text>
              )}
              <TouchableOpacity
                onPress={refreshHouseholds}
                disabled={isInviting || householdsLoading}
                style={{ alignItems: "center", marginTop: 20 }}
              >
                <Text style={{ color: tokens.onAccent, fontWeight: "700" }}>Continue to recipes</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
