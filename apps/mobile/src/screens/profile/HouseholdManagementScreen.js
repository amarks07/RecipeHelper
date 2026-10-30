import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { ChevronDown, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase-client";
import { useAppState } from "../../state/AppStateProvider";
import { useTheme } from "../../theme/ThemeProvider";
import { SketchButton as TouchableOpacity } from "../../components/ui/SketchButton";

export function HouseholdManagementScreen() {
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();
  const { households, user, refreshHouseholds } = useAppState();
  const ownedHouseholds = households.filter(
    (household) => household.owner_id === user?.id
  );
  const [householdId, setHouseholdId] = useState(ownedHouseholds[0]?.id || "");
  const [householdName, setHouseholdName] = useState("");
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [showHouseholdPicker, setShowHouseholdPicker] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ownedHouseholds.some((household) => household.id === householdId)) {
      setHouseholdId(ownedHouseholds[0]?.id || "");
    }
  }, [ownedHouseholds, householdId]);

  const loadDetails = useCallback(async () => {
    if (!householdId) {
      setMembers([]);
      setInvitations([]);
      setHouseholdName("");
      return;
    }
    setIsLoading(true);
    setError("");
    const [{ data: household, error: householdError }, { data: memberData, error: memberError }, { data: inviteData, error: inviteError }] =
      await Promise.all([
        supabase
          .from("households")
          .select("name")
          .eq("id", householdId)
          .eq("owner_id", user?.id)
          .single(),
        supabase.rpc("get_household_members", {
          target_household_id: householdId,
        }),
        supabase
          .from("household_invitations")
          .select("id, email, created_at")
          .eq("household_id", householdId)
          .eq("status", "pending")
          .order("created_at", { ascending: false }),
      ]);
    const loadError = householdError || memberError || inviteError;
    if (loadError) {
      setError(loadError.message);
    } else {
      setHouseholdName(household.name);
      setMembers(memberData || []);
      setInvitations(inviteData || []);
    }
    setIsLoading(false);
  }, [householdId, user?.id]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const runAction = async (action, successMessage) => {
    setIsWorking(true);
    setError("");
    try {
      const { error: actionError } = await action();
      if (actionError) {
        setError(actionError.message);
        return false;
      } else {
        Alert.alert("Household updated", successMessage);
        await Promise.all([loadDetails(), refreshHouseholds()]);
        return true;
      }
    } catch (actionError) {
      setError(actionError.message || "Could not update the household.");
      return false;
    } finally {
      setIsWorking(false);
    }
  };

  const saveName = async () => {
    const sent = await runAction(
      () => supabase.rpc("rename_household", {
        target_household_id: householdId,
        new_name: householdName,
      }),
      "The name has been changed."
    );
  };

  const sendInvite = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert("Email required", "Enter an email address to invite.");
      return;
    }
    await runAction(
      () => supabase.rpc("send_household_invite", {
        target_household_id: householdId,
        invitee_email: inviteEmail.trim(),
      }),
      "The invitation has been sent."
    );
    if (sent) setInviteEmail("");
  };

  const revokeInvite = (invitation) => {
    Alert.alert("Rescind invitation", `Rescind the invitation to ${invitation.email}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Rescind",
        style: "destructive",
        onPress: () => runAction(
          () => supabase.rpc("revoke_household_invite", {
            invitation_id: invitation.id,
          }),
          "The invitation has been rescinded."
        ),
      },
    ]);
  };

  const removeMember = (member) => {
    Alert.alert("Remove household member", `Remove ${member.email} from this household?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => runAction(
          () => supabase.rpc("remove_household_member", {
            target_household_id: householdId,
            target_user_id: member.user_id,
          }),
          "The member has been removed."
        ),
      },
    ]);
  };

  if (!ownedHouseholds.length) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.bg, padding: 24, paddingTop: insets.top + 24 }}>
        <Text style={{ color: tokens.text, fontSize: 18 }}>Household management is only available to household owners.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg, paddingTop: insets.top }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <Text style={{ color: tokens.text, fontSize: 24, fontWeight: "700", marginBottom: 16 }}>
          Household management
        </Text>

        {ownedHouseholds.length > 1 && (
          <>
            <TouchableOpacity
              onPress={() => setShowHouseholdPicker(true)}
              style={{
                backgroundColor: tokens.surface,
                borderColor: tokens.line,
                borderWidth: 1,
                borderRadius: 8,
                padding: 12,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ color: tokens.text }}>
                {ownedHouseholds.find((household) => household.id === householdId)?.name}
              </Text>
              <ChevronDown size={18} color={tokens.textDim} />
            </TouchableOpacity>
            <Modal
              visible={showHouseholdPicker}
              transparent
              animationType="fade"
              onRequestClose={() => setShowHouseholdPicker(false)}
            >
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => setShowHouseholdPicker(false)}
                style={{ flex: 1, justifyContent: "center", padding: 24, backgroundColor: "rgba(0,0,0,0.45)" }}
              >
                <View style={{ backgroundColor: tokens.surface, borderRadius: 12, padding: 12 }}>
                  {ownedHouseholds.map((household) => (
                    <TouchableOpacity
                      key={household.id}
                      onPress={() => {
                        setHouseholdId(household.id);
                        setShowHouseholdPicker(false);
                      }}
                      style={{ padding: 14 }}
                    >
                      <Text style={{ color: tokens.text }}>{household.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableOpacity>
            </Modal>
          </>
        )}

        {error ? <Text style={{ color: tokens.danger, marginTop: 12 }}>{error}</Text> : null}
        {isLoading ? (
          <Text style={{ color: tokens.textDim, marginTop: 20 }}>Loading household...</Text>
        ) : (
          <>
            <View style={{ backgroundColor: tokens.surface, borderColor: tokens.line, borderWidth: 1, borderRadius: 12, padding: 16, marginTop: 16 }}>
              <Text style={{ color: tokens.text, fontWeight: "600", marginBottom: 8 }}>Household name</Text>
              <TextInput
                value={householdName}
                onChangeText={setHouseholdName}
                maxLength={100}
                style={{ color: tokens.text, backgroundColor: tokens.bg, borderColor: tokens.line, borderWidth: 1, borderRadius: 8, padding: 10 }}
              />
              <TouchableOpacity
                onPress={saveName}
                disabled={isWorking}
                style={{ backgroundColor: tokens.accent, borderRadius: 8, padding: 12, alignItems: "center", marginTop: 12, opacity: isWorking ? 0.6 : 1 }}
              >
                <Text style={{ color: tokens.onAccent, fontWeight: "600" }}>Save name</Text>
              </TouchableOpacity>
            </View>

            <View style={{ backgroundColor: tokens.surface, borderColor: tokens.line, borderWidth: 1, borderRadius: 12, padding: 16, marginTop: 16 }}>
              <Text style={{ color: tokens.text, fontWeight: "600", marginBottom: 8 }}>Invite someone</Text>
              <TextInput
                value={inviteEmail}
                onChangeText={setInviteEmail}
                placeholder="name@example.com"
                placeholderTextColor={tokens.textDim}
                keyboardType="email-address"
                autoCapitalize="none"
                style={{ color: tokens.text, backgroundColor: tokens.bg, borderColor: tokens.line, borderWidth: 1, borderRadius: 8, padding: 10 }}
              />
              <TouchableOpacity
                onPress={sendInvite}
                disabled={isWorking}
                style={{ backgroundColor: tokens.accent, borderRadius: 8, padding: 12, alignItems: "center", marginTop: 12, opacity: isWorking ? 0.6 : 1 }}
              >
                <Text style={{ color: tokens.onAccent, fontWeight: "600" }}>Send invite</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ color: tokens.text, fontSize: 18, fontWeight: "600", marginTop: 24, marginBottom: 8 }}>
              Pending invitations
            </Text>
            {invitations.length ? invitations.map((invitation) => (
              <View key={invitation.id} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: tokens.line }}>
                <Text style={{ color: tokens.text, flex: 1 }}>{invitation.email}</Text>
                <TouchableOpacity disabled={isWorking} onPress={() => revokeInvite(invitation)}>
                  <Text style={{ color: tokens.danger, fontWeight: "600" }}>Rescind</Text>
                </TouchableOpacity>
              </View>
            )) : <Text style={{ color: tokens.textDim }}>No pending invitations.</Text>}

            <Text style={{ color: tokens.text, fontSize: 18, fontWeight: "600", marginTop: 24, marginBottom: 8 }}>
              Members
            </Text>
            {members.map((member) => (
              <View key={member.user_id} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: tokens.line }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: tokens.text }}>{member.email}</Text>
                  <Text style={{ color: tokens.textDim, fontSize: 12 }}>{member.role}</Text>
                </View>
                {member.role !== "owner" && (
                  <TouchableOpacity disabled={isWorking} onPress={() => removeMember(member)}>
                    <X size={20} color={tokens.danger} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}
