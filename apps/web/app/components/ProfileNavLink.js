"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../supabase-client";

export function ProfileNavLink() {
  const [pendingInvitations, setPendingInvitations] = useState(0);

  useEffect(() => {
    let active = true;

    const loadPendingInvitations = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) {
        console.error("Failed to load profile invitation badge:", userError);
        return;
      }
      if (!user?.email) return;

      const { count, error } = await supabase
        .from("household_invitations")
        .select("id", { count: "exact", head: true })
        .eq("email", user.email.toLowerCase())
        .eq("status", "pending");

      if (error) {
        console.error("Failed to load profile invitation badge:", error);
        return;
      }
      if (active) setPendingInvitations(count || 0);
    };

    loadPendingInvitations();
    const channel = supabase
      .channel("profile-household-invitations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "household_invitations" },
        loadPendingInvitations
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Link
      href="/profile"
      aria-label={
        pendingInvitations
          ? `Profile, ${pendingInvitations} pending household invitations`
            : "Profile"
      }
      style={{
        color: "#666",
        textDecoration: "none",
        fontSize: "14px",
        fontWeight: "500",
        position: "relative",
      }}
    >
      Profile
      {pendingInvitations > 0 && (
        <span
          aria-label={`${pendingInvitations} pending`}
          style={{
            display: "inline-flex",
            justifyContent: "center",
            alignItems: "center",
            minWidth: 18,
            height: 18,
            marginLeft: 6,
            padding: "0 5px",
            borderRadius: 9,
            backgroundColor: "#dc2626",
            color: "#fff",
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {pendingInvitations}
        </span>
      )}
    </Link>
  );
}
