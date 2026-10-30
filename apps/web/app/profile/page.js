"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { AuthGuard } from "../components/auth-guard";
import { HouseholdProfileLinks } from "../components/HouseholdProfileLinks";

function ProfilePageContent() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [signOutError, setSignOutError] = useState("");

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setIsLoading(false);
    };
    getUser();
  }, []);

  const handleSignOut = async () => {
    setSignOutError("");
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push("/");
    } catch (error) {
      console.error("Sign out failed:", error);
      setSignOutError(error.message || "Failed to sign out");
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <p style={{ color: "#6b7280" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="theme-content" style={{ maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ marginBottom: "40px" }}>
        <Link
          href="/recipes"
          style={{
            color: "#16a34a",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: "600",
            marginBottom: "16px",
            display: "inline-block",
          }}
        >
          ← Back to recipes
        </Link>
        <h1 style={{ fontSize: "36px", fontWeight: "700", color: "#111827", marginTop: "16px" }}>
          Profile
        </h1>
        <p style={{ color: "#6b7280", marginTop: "8px" }}>
          Manage your account and preferences
        </p>
      </div>

      <div
        style={{
          backgroundColor: "#fefdfb",
          borderRadius: "32px",
          border: "2px solid #e8e4d9",
          padding: "32px",
        }}
      >
        {user ? (
          <div>
            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "12px" }}>
                Account
              </h2>
              <p style={{ color: "#6b7280", fontSize: "14px" }}>
                {user.email}
              </p>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "12px" }}>
                Info
              </h2>
              <p style={{ color: "#6b7280", fontSize: "14px" }}>
                Signed in via {user.app_metadata?.provider || "email"}
              </p>
            </div>

            <HouseholdProfileLinks />

            <button
              onClick={handleSignOut}
              style={{
                padding: "8px 16px",
                backgroundColor: "#fee2e2",
                color: "#991b1b",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              Sign Out
            </button>
            {signOutError && (
              <p role="alert" style={{ color: "#991b1b", marginTop: "12px" }}>
                {signOutError}
              </p>
            )}
          </div>
        ) : (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#6b7280", marginBottom: "20px" }}>
              Not signed in
            </p>
            <Link
              href="/auth/login"
              style={{
                display: "inline-block",
                padding: "12px 28px",
                backgroundColor: "#16a34a",
                color: "#fff",
                border: "none",
                borderRadius: "50px",
                cursor: "pointer",
                fontWeight: "600",
                textDecoration: "none",
              }}
            >
              Sign In
            </Link>
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: "40px",
          padding: "20px",
          backgroundColor: "#f5f1e8",
          borderRadius: "8px",
          textAlign: "center",
        }}
      >
        <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "12px" }}>
          Sync your recipes with the mobile app
        </p>
        <Link
          href="/"
          style={{
            display: "inline-block",
            padding: "8px 16px",
            backgroundColor: "#16a34a",
            color: "#fff",
            borderRadius: "6px",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: "600",
          }}
        >
          Download Mobile App
        </Link>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfilePageContent />
    </AuthGuard>
  );
}
