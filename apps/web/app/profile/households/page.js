"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { sendHouseholdInvite } from "@recipehelper/core";
import { AuthGuard } from "../../components/auth-guard";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function HouseholdManagementContent() {
  const [households, setHouseholds] = useState([]);
  const [householdId, setHouseholdId] = useState("");
  const [name, setName] = useState("");
  const [newHouseholdName, setNewHouseholdName] = useState("");
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [householdToDelete, setHouseholdToDelete] = useState(null);

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
    setHouseholds(owned);
    setHouseholdId((current) =>
      owned.some((household) => household.id === current)
        ? current
        : owned[0]?.id || ""
    );
    setLoading(false);
  }, []);

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

  const createHousehold = async (event) => {
    event.preventDefault();
    const householdName = newHouseholdName.trim();
    setWorking(true);
    setError("");
    setNotice("");
    try {
      const { data: createdId, error: createError } = await supabase.rpc(
        "create_household",
        { household_name: householdName, invited_emails: [] }
      );
      if (createError) {
        setError(createError.message);
        return;
      }

      await loadHouseholds();
      setHouseholdId(createdId);
      setNewHouseholdName("");
      setNotice("Household created.");
    } catch (createError) {
      setError(createError.message || "Could not create the household.");
    } finally {
      setWorking(false);
    }
  };

  const deleteHousehold = async () => {
    const household = householdToDelete;
    if (!household) return;

    setWorking(true);
    setError("");
    setNotice("");
    try {
      const { error: deleteError } = await supabase.rpc("delete_household", {
        target_household_id: householdId,
      });
      if (deleteError) {
        setError(deleteError.message);
        return;
      }

      setNotice(`"${household.name}" was deleted.`);
      setHouseholdToDelete(null);
      await loadHouseholds();
    } catch (deleteError) {
      setError(deleteError.message || "Could not delete the household.");
    } finally {
      setWorking(false);
    }
  };

  const sendInvite = async (event) => {
    event.preventDefault();
    const sent = await runAction(
      () => sendHouseholdInvite(supabase, householdId, inviteEmail)
        .then(() => ({ error: null })),
      "Invitation sent."
    );
    if (sent) setInviteEmail("");
    else await loadDetails(householdId);
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
    <section className="theme-content profile-page">
      <div className="profile-page-header">
        <Link href="/profile" style={{ color: "#16a34a" }}>← Profile</Link>
        <h1>Household management</h1>
      </div>
      {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}
      {notice && <p role="status" style={{ color: "#15803d" }}>{notice}</p>}

      <form onSubmit={createHousehold} style={{ marginTop: 24 }}>
        <h2>{households.length ? "Create another household" : "Create a household"}</h2>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input
            aria-label="New household name"
            value={newHouseholdName}
            onChange={(event) => setNewHouseholdName(event.target.value)}
            maxLength={100}
            placeholder="Household name"
            required
            style={{ flex: 1, padding: 10 }}
          />
          <button disabled={working || !newHouseholdName.trim()}>Create household</button>
        </div>
      </form>

      {households.length === 0 ? (
        <p style={{ marginTop: 24 }}>You don&apos;t own any households yet.</p>
      ) : (
        <>
          {households.length > 1 && (
            <div className="household-select-field">
              <label htmlFor="managed-household">Household</label>
              <select
                className="app-select"
                id="managed-household"
                value={householdId}
                onChange={(event) => setHouseholdId(event.target.value)}
              >
                {households.map((household) => (
                  <option key={household.id} value={household.id}>{household.name}</option>
                ))}
              </select>
            </div>
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
              <button disabled={working}>Invite</button>
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

          <div className="household-delete-section">
            <h2>Delete household</h2>
            <p>
              Deleting this household also permanently deletes its recipes,
              memberships, and invitations.
            </p>
            <button
              type="button"
              className="household-delete-button"
              disabled={working}
              onClick={() => setHouseholdToDelete(
                households.find((item) => item.id === householdId) || null
              )}
            >
              Delete household
            </button>
          </div>
        </>
      )}

      {householdToDelete && (
        <div
          className="confirmation-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !working) {
              setHouseholdToDelete(null);
            }
          }}
        >
          <section
            aria-labelledby="delete-household-title"
            aria-describedby="delete-household-description"
            aria-modal="true"
            className="confirmation-modal"
            role="dialog"
          >
            <h2 id="delete-household-title">Delete household?</h2>
            <p id="delete-household-description">
              Delete &quot;{householdToDelete.name}&quot; permanently? This also
              deletes all recipes, members, and invitations associated with it.
              This cannot be undone.
            </p>
            {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}
            <div className="confirmation-modal-actions">
              <button
                type="button"
                className="confirmation-cancel-button"
                disabled={working}
                onClick={() => setHouseholdToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="household-delete-button"
                disabled={working}
                onClick={deleteHousehold}
              >
                {working ? "Deleting..." : "Delete household"}
              </button>
            </div>
          </section>
        </div>
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
