"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { AuthGuard } from "../components/auth-guard";

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
    <div className="theme-content profile-page">
      <div className="profile-page-header">
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
        <h1>Profile</h1>
        <p>
          Manage your account and preferences
        </p>
      </div>

      <section className="profile-app-card">
        <div>
          <h2>Use Nibble on mobile</h2>
          <p>Sync your recipes with the mobile app.</p>
        </div>
        <Link className="profile-action-button" href="/">
          Download Mobile App
        </Link>
      </section>

      <div className="profile-account-card">
        {user ? (
          <div>
            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "12px" }}>
                Account
              </h2>
              <p className="profile-secondary-text">
                {user.email}
              </p>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "12px" }}>
                Info
              </h2>
              <p className="profile-secondary-text">
                Signed in via {user.app_metadata?.provider || "email"}
              </p>
            </div>

            <button
              onClick={handleSignOut}
              className="profile-sign-out"
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
            <p className="profile-secondary-text">
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
