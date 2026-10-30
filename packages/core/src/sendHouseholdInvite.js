export async function sendHouseholdInvite(supabase, householdId, email) {
  const { data, error } = await supabase.functions.invoke("send-household-invite", {
    body: { householdId, email },
  });

  if (!error) {
    if (!data?.invitationId || !data.email || !data.createdAt) {
      throw new Error("The invitation service returned an incomplete response.");
    }
    return data;
  }

  const response = error.context;
  if (response && typeof response.json === "function") {
    const body = await response.json().catch(() => null);
    if (typeof body?.error === "string") {
      throw new Error(body.error);
    }
  }

  throw new Error(error.message || "Could not send the household invitation.");
}
