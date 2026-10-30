"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../supabase-client";

const linkStyle = {
  color: "#666",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: "500",
  transition: "color 0.3s",
};

export function ProfileNavLink() {
  const [isHouseholdOwner, setIsHouseholdOwner] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState(0);

  useEffect(() => {
    let active = true;

    const loadNavData = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) {
        console.error("Failed to load profile navigation:", userError);
        return;
      }
      if (!user) return;

      const [{ data: households, error: householdError }, { count, error: invitationError }] =
        await Promise.all([
          supabase
            .from("households")
            .select("id")
            .eq("owner_id", user.id)
            .limit(1),
          supabase
            .from("household_invitations")
            .select("id", { count: "exact", head: true })
            .eq("email", user.email?.toLowerCase() || "")
            .eq("status", "pending"),
        ]);

      if (householdError) {
        console.error("Failed to load owned households:", householdError);
      } else if (active) {
        setIsHouseholdOwner(Boolean(households?.length));
      }
      if (invitationError) {
        console.error("Failed to load profile invitation badge:", invitationError);
      } else if (active) {
        setPendingInvitations(count || 0);
      }
    };

    loadNavData();
    const channel = supabase
      .channel("profile-household-invitations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "household_invitations" },
        loadNavData
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <>
      <Link
        href="/profile"
        style={linkStyle}
        onMouseEnter={(event) => (event.currentTarget.style.color = "#16a34a")}
        onMouseLeave={(event) => (event.currentTarget.style.color = "#666")}
      >
        Profile
      </Link>
      <Link
        href={isHouseholdOwner ? "/profile/households" : "/profile/notifications"}
        aria-label={
          pendingInvitations
            ? `Households, ${pendingInvitations} pending invitations`
            : "Households"
        }
        style={linkStyle}
        onMouseEnter={(event) => (event.currentTarget.style.color = "#16a34a")}
        onMouseLeave={(event) => (event.currentTarget.style.color = "#666")}
      >
        Households
        {pendingInvitations > 0 && (
          <span className="profile-nav-badge" aria-hidden="true">
            {pendingInvitations}
          </span>
        )}
      </Link>
    </>
  );
}
