"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { AuthGuard } from "../../components/auth-guard";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function HouseholdManagementContent() {
  const router = useRouter();
  const [households, setHouseholds] = useState([]);
  const [householdId, setHouseholdId] = useState("");
  const [name, setName] = useState("");
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadHouseholds = useCallback(async () => {
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
    const { data, error: householdError } = await supabase
      .from("households")
      .select("id, name, owner_id")
      .eq("owner_id", user.id)
      .order("created_at");
    if (householdError) {
      setError(householdError.message);
      setLoading(false);
      return;
    }
    const owned = data || [];
    if (owned.length === 0) {
      router.replace("/profile");
      setLoading(false);
      return;
    }
    setHouseholds(owned);
    setHouseholdId((current) =>
      owned.some((household) => household.id === current)
        ? current
        : owned[0]?.id || ""
    );
    setLoading(false);
  }, [router]);

  const loadDetails = useCallback(async (id) => {
    if (!id) {
      setMembers([]);
      setInvitations([]);
      setName("");
      return;
    }
    const [{ data: household, error: householdError }, { data: memberData, error: memberError }, { data: inviteData, error: inviteError }] =
      await Promise.all([
        supabase.from("households").select("name").eq("id", id).single(),
        supabase.rpc("get_household_members", { target_household_id: id }),
        supabase
          .from("household_invitations")
          .select("id, email, created_at")
          .eq("household_id", id)
          .eq("status", "pending")
          .order("created_at", { ascending: false }),
      ]);

    const detailError = householdError || memberError || inviteError;
    if (detailError) {
      setError(detailError.message);
      return;
    }
    setName(household.name);
    setMembers(memberData || []);
    setInvitations(inviteData || []);
  }, []);

  useEffect(() => {
    loadHouseholds();
  }, [loadHouseholds]);

  useEffect(() => {
    loadDetails(householdId);
  }, [householdId, loadDetails]);

  const runAction = async (action, successMessage) => {
    setWorking(true);
    setError("");
    setNotice("");
    try {
      const { error: actionError } = await action();
      if (actionError) {
        setError(actionError.message);
        return false;
      } else {
        setNotice(successMessage);
        await loadDetails(householdId);
        await loadHouseholds();
        return true;
      }
    } catch (actionError) {
      setError(actionError.message || "Could not update the household.");
      return false;
    } finally {
      setWorking(false);
    }
  };

  const saveName = async (event) => {
    event.preventDefault();
    await runAction(
      () => supabase.rpc("rename_household", {
        target_household_id: householdId,
        new_name: name,
      }),
      "Household name updated."
    );
  };

  const sendInvite = async (event) => {
    event.preventDefault();
    const sent = await runAction(
      () => supabase.rpc("send_household_invite", {
        target_household_id: householdId,
        invitee_email: inviteEmail,
      }),
      "Invitation sent."
    );
    if (sent) setInviteEmail("");
  };

  const revokeInvite = async (id) => {
    await runAction(
      () => supabase.rpc("revoke_household_invite", { invitation_id: id }),
      "Invitation rescinded."
    );
  };

  const removeMember = async (member) => {
    if (!window.confirm(`Remove ${member.email} from this household?`)) return;
    await runAction(
      () => supabase.rpc("remove_household_member", {
        target_household_id: householdId,
        target_user_id: member.user_id,
      }),
      "Member removed."
    );
  };

  if (loading) return <p>Loading household management...</p>;

  return (
    <section style={{ maxWidth: 800, margin: "0 auto" }}>
      <Link href="/profile" style={{ color: "#16a34a" }}>← Profile</Link>
      <h1>Household management</h1>
      {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}
      {notice && <p role="status" style={{ color: "#15803d" }}>{notice}</p>}
      {households.length > 0 && (
        <>
          {households.length > 1 && (
            <label>
              Household{" "}
              <select value={householdId} onChange={(event) => setHouseholdId(event.target.value)}>
                {households.map((household) => (
                  <option key={household.id} value={household.id}>{household.name}</option>
                ))}
              </select>
            </label>
          )}

          <form onSubmit={saveName} style={{ marginTop: 24 }}>
            <label htmlFor="household-name">Household name</label>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input
                id="household-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={100}
                required
                style={{ flex: 1, padding: 10 }}
              />
              <button disabled={working}>Save name</button>
            </div>
          </form>

          <form onSubmit={sendInvite} style={{ marginTop: 28 }}>
            <h2>Invite someone</h2>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="email"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="name@example.com"
                required
                style={{ flex: 1, padding: 10 }}
              />
              <button disabled={working}>Send invite</button>
            </div>
          </form>

          <div style={{ marginTop: 28 }}>
            <h2>Pending invitations</h2>
            {invitations.length === 0 ? (
              <p>No pending invitations.</p>
            ) : invitations.map((invitation) => (
              <div key={invitation.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #e5e7eb" }}>
                <span>{invitation.email}</span>
                <button disabled={working} onClick={() => revokeInvite(invitation.id)}>Rescind</button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 28 }}>
            <h2>Household members</h2>
            {members.map((member) => (
              <div key={member.user_id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #e5e7eb" }}>
                <span>{member.email} · {member.role}</span>
                {member.role !== "owner" && (
                  <button disabled={working} onClick={() => removeMember(member)}>Remove</button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default function HouseholdManagementPage() {
  return (
    <AuthGuard>
      <HouseholdManagementContent />
    </AuthGuard>
  );
}
