import { Text, View } from "react-native";
import { PushableButton as TouchableOpacity } from "../ui/PushableButton";

export function HouseholdInvitationCard({
  invitation,
  onRespond,
  disabled,
  tokens,
}) {
  return (
    <View
      style={{
        backgroundColor: tokens.surface,
        borderColor: tokens.line,
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <Text style={{ color: tokens.text, fontSize: 16, fontWeight: "600", marginBottom: 12 }}>
        Invitation to {invitation.households?.name || "a household"}
      </Text>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <TouchableOpacity
          disabled={disabled}
          onPress={() => onRespond(invitation.id, true)}
          style={{
            flex: 1,
            alignItems: "center",
            padding: 10,
            borderRadius: 8,
            backgroundColor: tokens.accent,
            opacity: disabled ? 0.6 : 1,
          }}
        >
          <Text style={{ color: tokens.onAccent, fontWeight: "600" }}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={disabled}
          onPress={() => onRespond(invitation.id, false)}
          style={{
            flex: 1,
            alignItems: "center",
            padding: 10,
            borderRadius: 8,
            borderColor: tokens.line,
            borderWidth: 1,
            opacity: disabled ? 0.6 : 1,
          }}
        >
          <Text style={{ color: tokens.text, fontWeight: "600" }}>Decline</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
