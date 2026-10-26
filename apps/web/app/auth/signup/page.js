"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      // Show success message and redirect
      alert("Check your email to confirm your account!");
      router.push("/auth/login");
    } catch (err) {
      setError(err.message || "Failed to sign up");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "32px", textAlign: "center" }}>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: "700",
            color: "#111827",
            marginBottom: "8px",
          }}
        >
          Create Account
        </h1>
        <p style={{ color: "#6b7280", fontSize: "14px" }}>
          Start managing your recipes with RecipeHelper
        </p>
      </div>

      <form
        onSubmit={handleSignup}
        style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          padding: "32px",
        }}
      >
        {/* Email */}
        <div style={{ marginBottom: "20px" }}>
          <label
            htmlFor="email"
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "6px",
              fontSize: "14px",
              color: "#111827",
            }}
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "12px 16px",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: "20px" }}>
          <label
            htmlFor="password"
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "6px",
              fontSize: "14px",
              color: "#111827",
            }}
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "12px 16px",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Confirm Password */}
        <div style={{ marginBottom: "20px" }}>
          <label
            htmlFor="confirmPassword"
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "6px",
              fontSize: "14px",
              color: "#111827",
            }}
          >
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "12px 16px",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              backgroundColor: "#fee2e2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              padding: "12px",
              marginBottom: "20px",
              color: "#991b1b",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "12px 16px",
            backgroundColor: "#10b981",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontWeight: "600",
            cursor: "pointer",
            opacity: isLoading ? 0.7 : 1,
            marginBottom: "16px",
            transition: "opacity 0.3s",
          }}
        >
          {isLoading ? "Creating account..." : "Create Account"}
        </button>

        {/* Sign In Link */}
        <div style={{ textAlign: "center", fontSize: "14px", color: "#6b7280" }}>
          Already have an account?{" "}
          <Link
            href="/auth/login"
            style={{ color: "#10b981", textDecoration: "none", fontWeight: "600" }}
          >
            Sign in
          </Link>
        </div>
      </form>

      {/* Info */}
      <div
        style={{
          backgroundColor: "#ecfdf5",
          border: "1px solid #d1fae5",
          borderRadius: "8px",
          padding: "16px",
          marginTop: "24px",
          fontSize: "13px",
          color: "#065f46",
        }}
      >
        <strong>Privacy:</strong> We'll send you a confirmation email. Your recipes are always private
        and synced securely.
      </div>
    </div>
  );
}
