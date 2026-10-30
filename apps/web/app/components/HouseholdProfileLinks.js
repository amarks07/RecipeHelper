"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../supabase-client";

export function HouseholdProfileLinks() {
  const [isHouseholdOwner, setIsHouseholdOwner] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const loadOwnedHouseholds = async () => {
      const { data, error: userError } = await supabase.auth.getUser();
      if (userError) {
        if (active) setError(userError.message);
        return;
      }
      if (!data.user) return;
      const { data: households, error: householdError } = await supabase
        .from("households")
        .select("id")
        .eq("owner_id", data.user.id)
        .limit(1);
      if (householdError) {
        if (active) setError(householdError.message);
        return;
      }
      if (active) setIsHouseholdOwner(Boolean(households?.length));
    };
    loadOwnedHouseholds();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
        Households
      </h2>
      {isHouseholdOwner && (
        <p style={{ margin: "8px 0" }}>
          <Link href="/profile/households" style={{ color: "#16a34a" }}>
            Manage your households
          </Link>
        </p>
      )}
      <p style={{ margin: "8px 0" }}>
        <Link href="/profile/notifications" style={{ color: "#16a34a" }}>
          View household invitations
        </Link>
      </p>
      {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}
    </div>
  );
}
