"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "./auth-guard";
import { supabase } from "../supabase-client";

function MembershipGate({ children }) {
  const router = useRouter();
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  const checkMembership = useCallback(async () => {
    setStatus("loading");
    setError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) {
      setError(userError.message);
      setStatus("error");
      return;
    }
    if (!user) {
      router.replace("/auth/login");
      return;
    }

    const { data, error: membershipError } = await supabase
      .from("household_members")
      .select("household_id")
      .eq("user_id", user.id)
      .limit(1);

    if (membershipError) {
      setError(membershipError.message);
      setStatus("error");
      return;
    }
    if (!data?.length) {
      router.replace("/households/setup");
      return;
    }
    setStatus("ready");
  }, [router]);

  useEffect(() => {
    checkMembership();
  }, [checkMembership]);

  if (status === "error") {
    return (
      <div role="alert" style={{ maxWidth: 520, margin: "80px auto", padding: 24 }}>
        <p>We couldn&apos;t verify your household membership: {error}</p>
        <button onClick={checkMembership}>Try again</button>
      </div>
    );
  }
  if (status !== "ready") return null;
  return children;
}

export function HouseholdGuard({ children }) {
  return (
    <AuthGuard>
      <MembershipGate>{children}</MembershipGate>
    </AuthGuard>
  );
}
