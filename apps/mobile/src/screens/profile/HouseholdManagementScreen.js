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
import { sendHouseholdInvite } from "@recipehelper/core";
import { useAppState } from "../../state/AppStateProvider";
import { useTheme } from "../../theme/ThemeProvider";
import { PushableButton as TouchableOpacity } from "../../components/ui/PushableButton";

export function HouseholdManagementScreen() {
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();
  const { households, user, refreshHouseholds, createHousehold } = useAppState();
  const ownedHouseholds = households.filter(
    (household) => household.owner_id === user?.id
  );
  const [householdId, setHouseholdId] = useState(ownedHouseholds[0]?.id || "");
  const [householdName, setHouseholdName] = useState("");
  const [newHouseholdName, setNewHouseholdName] = useState("");
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [showHouseholdPicker, setShowHouseholdPicker] = useState(false);
  const [householdToDelete, setHouseholdToDelete] = useState(null);
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
    await runAction(
      () => supabase.rpc("rename_household", {
        target_household_id: householdId,
        new_name: householdName,
      }),
      "The name has been changed."
    );
  };

  const addHousehold = async () => {
    const name = newHouseholdName.trim();
    if (!name) {
      Alert.alert("Name required", "Enter a name for the new household.");
      return;
    }

    setIsWorking(true);
    setError("");
    try {
      const createdId = await createHousehold(name);
      setHouseholdId(createdId);
      setNewHouseholdName("");
      Alert.alert("Household created", "Your new household is ready.");
    } catch (createError) {
      setError(createError.message || "Could not create the household.");
    } finally {
      setIsWorking(false);
    }
  };

  const deleteHousehold = () => {
    const household = ownedHouseholds.find((item) => item.id === householdId);
    if (!household) return;
    setHouseholdToDelete(household);
  };

  const confirmDeleteHousehold = async () => {
    if (!householdToDelete) return;
    setIsWorking(true);
    setError("");
    try {
      const { error: deleteError } = await supabase.rpc(
        "delete_household",
        { target_household_id: householdToDelete.id }
      );
      if (deleteError) throw deleteError;
      setHouseholdId("");
      setHouseholdToDelete(null);
      await refreshHouseholds();
    } catch (deleteError) {
      setError(deleteError.message || "Could not delete the household.");
    } finally {
      setIsWorking(false);
    }
  };

  const sendInvite = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert("Email required", "Enter an email address to invite.");
      return;
    }
    const sent = await runAction(
      () => sendHouseholdInvite(supabase, householdId, inviteEmail.trim())
        .then(() => ({ error: null })),
      "The invitation has been sent."
    );
    if (sent) setInviteEmail("");
    else await loadDetails();
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

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg, paddingTop: insets.top }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <Text style={{ color: tokens.text, fontSize: 28, fontWeight: "700", marginBottom: 16 }}>
          Household management
        </Text>

        {ownedHouseholds.length > 1 && (
          <>
            <Text style={{ color: tokens.text, fontWeight: "600", marginBottom: 6 }}>
              Household
            </Text>
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

        <View style={{ backgroundColor: tokens.surface, borderColor: tokens.line, borderWidth: 1, borderRadius: 12, padding: 16, marginTop: 16 }}>
          <Text style={{ color: tokens.text, fontWeight: "600", marginBottom: 8 }}>
            {ownedHouseholds.length ? "Create another household" : "Create a household"}
          </Text>
          <TextInput
            value={newHouseholdName}
            onChangeText={setNewHouseholdName}
            maxLength={100}
            placeholder="Household name"
            placeholderTextColor={tokens.textDim}
            style={{ color: tokens.text, backgroundColor: tokens.bg, borderColor: tokens.line, borderWidth: 1, borderRadius: 8, padding: 10 }}
          />
          <TouchableOpacity
            onPress={addHousehold}
            disabled={isWorking || !newHouseholdName.trim()}
            style={{ backgroundColor: tokens.accent, borderRadius: 8, padding: 12, alignItems: "center", marginTop: 12, opacity: isWorking || !newHouseholdName.trim() ? 0.6 : 1 }}
          >
            <Text style={{ color: tokens.onAccent, fontWeight: "600" }}>
              {isWorking ? "Creating..." : "Create household"}
            </Text>
          </TouchableOpacity>
        </View>

        {error ? <Text style={{ color: tokens.danger, marginTop: 12 }}>{error}</Text> : null}
        {!ownedHouseholds.length && (
          <Text style={{ color: tokens.textDim, marginTop: 16 }}>
            You don&apos;t own any households yet.
          </Text>
        )}
        {isLoading ? (
          <Text style={{ color: tokens.textDim, marginTop: 20 }}>Loading household...</Text>
        ) : householdId ? (
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
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <TextInput
                  value={inviteEmail}
                  onChangeText={setInviteEmail}
                  placeholder="name@example.com"
                  placeholderTextColor={tokens.textDim}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  style={{ flex: 1, minWidth: 0, color: tokens.text, backgroundColor: tokens.bg, borderColor: tokens.line, borderWidth: 1, borderRadius: 8, padding: 10 }}
                />
                <TouchableOpacity
                  onPress={sendInvite}
                  disabled={isWorking || !inviteEmail.trim()}
                  style={{ alignItems: "center", opacity: isWorking ? 0.6 : 1 }}
                >
                  <Text style={{ color: tokens.onAccent, fontWeight: "600" }}>
                    {isWorking ? "Inviting..." : "Invite"}
                  </Text>
                </TouchableOpacity>
              </View>
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

            {householdId ? (
              <View style={{ backgroundColor: tokens.surface, borderColor: tokens.danger, borderWidth: 1, borderRadius: 12, padding: 16, marginTop: 28 }}>
                <Text style={{ color: tokens.danger, fontSize: 18, fontWeight: "700", marginBottom: 8 }}>
                  Delete household
                </Text>
                <Text style={{ color: tokens.textDim, marginBottom: 12 }}>
                  Deleting this household also permanently deletes its recipes, memberships, and invitations.
                </Text>
                <TouchableOpacity
                  onPress={deleteHousehold}
                  disabled={isWorking}
                  style={{ backgroundColor: tokens.danger, borderRadius: 8, padding: 12, alignItems: "center", opacity: isWorking ? 0.6 : 1 }}
                >
                  <Text style={{ color: "#fff", fontWeight: "600" }}>
                    Delete household
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </>
        ) : null}
      </ScrollView>
      <Modal
        visible={Boolean(householdToDelete)}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isWorking) setHouseholdToDelete(null);
        }}
      >
        <View style={{ flex: 1, justifyContent: "center", padding: 24, backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ backgroundColor: tokens.surface, borderRadius: 16, padding: 20 }}>
            <Text style={{ color: tokens.text, fontSize: 20, fontWeight: "700", marginBottom: 8 }}>
              Delete household?
            </Text>
            <Text style={{ color: tokens.textDim, lineHeight: 22 }}>
              Delete &quot;{householdToDelete?.name}&quot; permanently? This also deletes all recipes, members, and invitations associated with it. This cannot be undone.
            </Text>
            {error ? (
              <Text accessibilityRole="alert" style={{ color: tokens.danger, marginTop: 12 }}>
                {error}
              </Text>
            ) : null}
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
              <TouchableOpacity
                onPress={() => setHouseholdToDelete(null)}
                disabled={isWorking}
                style={{ padding: 12, opacity: isWorking ? 0.6 : 1 }}
              >
                <Text style={{ color: tokens.text, fontWeight: "600" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmDeleteHousehold}
                disabled={isWorking}
                style={{ backgroundColor: tokens.danger, borderRadius: 8, padding: 12, opacity: isWorking ? 0.6 : 1 }}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>
                  {isWorking ? "Deleting..." : "Delete household"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
