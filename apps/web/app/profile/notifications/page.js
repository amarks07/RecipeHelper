"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { AuthGuard } from "../../components/auth-guard";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function NotificationsContent() {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState("");
  const [error, setError] = useState("");

  const loadInvitations = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  const respond = async (id, accept) => {
    setWorkingId(id);
    setError("");
    const { error: responseError } = await supabase.rpc(
      "respond_to_household_invite",
      { invitation_id: id, accept_invitation: accept }
    );
    if (responseError) {
      setError(responseError.message);
    } else {
      await loadInvitations();
    }
    setWorkingId("");
  };

  return (
    <section style={{ maxWidth: 760, margin: "0 auto" }}>
      <Link href="/profile" style={{ color: "#16a34a" }}>← Profile</Link>
      <h1>Notifications</h1>
      {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}
      {loading ? (
        <p>Loading notifications...</p>
      ) : invitations.length === 0 ? (
        <p>You&apos;re all caught up. No pending notifications.</p>
      ) : (
        invitations.map((invitation) => (
          <article
            key={invitation.id}
            style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, marginTop: 16 }}
          >
            <h2 style={{ marginTop: 0 }}>
              Invitation to {invitation.households?.name || "a household"}
            </h2>
            <p>You&apos;ve been invited to share recipes with this household.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                disabled={workingId === invitation.id}
                onClick={() => respond(invitation.id, true)}
              >
                Accept
              </button>
              <button
                disabled={workingId === invitation.id}
                onClick={() => respond(invitation.id, false)}
              >
                Decline
              </button>
            </div>
          </article>
        ))
      )}
    </section>
  );
}

export default function NotificationsPage() {
  return (
    <AuthGuard>
      <NotificationsContent />
    </AuthGuard>
  );
}
