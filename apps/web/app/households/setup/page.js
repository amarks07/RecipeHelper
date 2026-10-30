"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { sendHouseholdInvite } from "@recipehelper/core";
import { AuthGuard } from "../../components/auth-guard";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function HouseholdSetupContent() {
  const router = useRouter();
  const [householdName, setHouseholdName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [householdId, setHouseholdId] = useState("");
  const [invitations, setInvitations] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState("");

  const loadHouseholdData = useCallback(async () => {
    setLoading(true);
    setError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) {
      setError(userError.message);
      setLoading(false);
      return;
    }
    if (!user) {
      router.replace("/auth/login");
      return;
    }

    const { data: memberships, error: membershipError } = await supabase
      .from("household_members")
      .select("household_id")
      .eq("user_id", user.id)
      .limit(1);
    if (membershipError) {
      setError(membershipError.message);
      setLoading(false);
      return;
    }
    if (memberships?.length) {
      router.replace("/recipes");
      return;
    }

    const { data, error: invitationError } = await supabase
      .from("household_invitations")
      .select("id, household_id, invited_by, created_at, households(name)")
      .eq("email", user.email.toLowerCase())
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (invitationError) {
      setError(invitationError.message);
    } else {
      setInvitations(data || []);
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadHouseholdData();
  }, [loadHouseholdData]);

  const respondToInvitation = async (invitationId, accept) => {
    setWorkingId(invitationId);
    setError("");
    const { error: responseError } = await supabase.rpc(
      "respond_to_household_invite",
      { invitation_id: invitationId, accept_invitation: accept }
    );
    if (responseError) {
      setError(responseError.message);
      setWorkingId("");
      return;
    }
    if (accept) {
      router.replace("/recipes");
      return;
    }
    await loadHouseholdData();
    setWorkingId("");
  };

  const createHousehold = async (event) => {
    event.preventDefault();
    if (!householdName.trim()) {
      setError("Enter a household name.");
      return;
    }

    setIsCreating(true);
    setError("");
    try {
      const { data, error: createError } = await supabase.rpc("create_household", {
        household_name: householdName.trim(),
        invited_emails: [],
      });
      if (createError) throw createError;
      setHouseholdId(data);
    } catch (createError) {
      setError(createError.message || "Could not create the household.");
    } finally {
      setIsCreating(false);
    }
  };

  const sendInvite = async (event) => {
    event.preventDefault();
    setIsInviting(true);
    setError("");
    try {
      const invitation = await sendHouseholdInvite(supabase, householdId, inviteEmail);
      setInviteEmail("");
      setPendingInvites((current) => [
        {
          id: invitation.invitationId,
          email: invitation.email,
          created_at: invitation.createdAt,
        },
        ...current.filter((item) => item.id !== invitation.invitationId),
      ]);
    } catch (inviteError) {
      setError(inviteError.message || "Could not send the invitation.");
      const { data, error: loadError } = await supabase
        .from("household_invitations")
        .select("id, email, created_at")
        .eq("household_id", householdId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (!loadError) setPendingInvites(data || []);
    } finally {
      setIsInviting(false);
    }
  };

  if (loading) {
    return <p style={{ textAlign: "center", padding: 40 }}>Loading households...</p>;
  }

  return (
    <main style={{ maxWidth: 640, margin: "48px auto", padding: 24 }}>
      <h1>Set up your household</h1>
      <p>You need to create a household or accept an invitation before adding recipes.</p>
      {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}

      {invitations.length > 0 && (
        <section style={{ margin: "24px 0" }}>
          <h2>Household invitations</h2>
          {invitations.map((invitation) => (
            <div
              key={invitation.id}
              style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 16, marginTop: 12 }}
            >
              <p>
                You&apos;ve been invited to join{" "}
                <strong>{invitation.households?.name || "a household"}</strong>.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  disabled={workingId === invitation.id}
                  onClick={() => respondToInvitation(invitation.id, true)}
                >
                  Accept invitation
                </button>
                <button
                  disabled={workingId === invitation.id}
                  onClick={() => respondToInvitation(invitation.id, false)}
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {!householdId ? (
        <form onSubmit={createHousehold} style={{ marginTop: 32 }}>
          <h2>Create a household</h2>
          <label htmlFor="household-name">Household name</label>
          <input
            id="household-name"
            value={householdName}
            onChange={(event) => setHouseholdName(event.target.value)}
            maxLength={100}
            required
            style={{ display: "block", width: "100%", margin: "8px 0 16px" }}
          />
          <button type="submit" disabled={isCreating}>
            {isCreating ? "Creating..." : "Create household"}
          </button>
        </form>
      ) : (
        <section style={{ marginTop: 32 }}>
          <h2>Invite someone to {householdName}</h2>
          <form onSubmit={sendInvite} style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <input
              type="email"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
              required
              style={{ flex: 1, minWidth: 0 }}
            />
            <button type="submit" disabled={isInviting}>
              {isInviting ? "Inviting..." : "Invite"}
            </button>
          </form>
          <h3 style={{ marginTop: 24 }}>Pending invites</h3>
          {pendingInvites.length ? (
            <ul style={{ marginTop: 8, paddingLeft: 20 }}>
              {pendingInvites.map((invitation) => (
                <li key={invitation.id}>{invitation.email}</li>
              ))}
            </ul>
          ) : (
            <p>No pending invites yet.</p>
          )}
          <button style={{ marginTop: 24 }} onClick={() => router.replace("/recipes")}>
            Continue to recipes
          </button>
        </section>
      )}
    </main>
  );
}

export default function HouseholdSetupPage() {
  return (
    <AuthGuard>
      <HouseholdSetupContent />
    </AuthGuard>
  );
}
