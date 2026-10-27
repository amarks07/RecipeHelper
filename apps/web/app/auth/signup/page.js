"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { getDeviceType } from "../../utils/device-detection";

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

  useEffect(() => {
    // Android users can't access the web app
    const device = getDeviceType();
    if (device.isAndroid) {
      router.push("/");
    }
  }, [router]);

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

  const handleGoogleSignUp = async () => {
    setError("");
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (err) {
      setError(err.message || "Failed to sign up with Google");
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div style={{ maxWidth: "420px", width: "100%", minWidth: "280px" }}>
        <div style={{ marginBottom: "40px", textAlign: "center" }}>
          <h1
            style={{
              fontSize: "36px",
              fontWeight: "400",
              color: "#16a34a",
              marginBottom: "12px",
              fontFamily: "'Finger Paint', cursive",
              letterSpacing: "0px",
            }}
          >
            Create Account
          </h1>
          <p style={{ color: "#666", fontSize: "14px" }}>
            Start managing your recipes
          </p>
        </div>

        <form
          onSubmit={handleSignup}
          style={{
            backgroundColor: "#fff",
            borderRadius: "32px",
            border: "2px solid #e8e4d9",
            padding: "40px",
            boxShadow: "0 4px 20px rgba(74, 222, 128, 0.1)",
          }}
        >
        {/* Google Sign Up */}
        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "14px 16px",
            backgroundColor: "#f0fdf4",
            border: "2px solid #e8e4d9",
            borderRadius: "50px",
            fontWeight: "600",
            cursor: "pointer",
            opacity: isLoading ? 0.7 : 1,
            marginBottom: "20px",
            transition: "all 0.3s",
            color: "#333",
            fontSize: "15px",
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = "#dcfce7")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "#f0fdf4")}
        >
          {isLoading ? "…" : "Continue with Google"}
        </button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: "24px" }}>
          <div style={{ flex: 1, height: "1px", backgroundColor: "#ddd" }} />
          <span style={{ margin: "0 12px", color: "#999", fontSize: "12px" }}>or</span>
          <div style={{ flex: 1, height: "1px", backgroundColor: "#ddd" }} />
        </div>

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
            padding: "14px 16px",
            backgroundColor: "#16a34a",
            color: "#fff",
            border: "none",
            borderRadius: "50px",
            fontWeight: "600",
            cursor: "pointer",
            opacity: isLoading ? 0.7 : 1,
            marginBottom: "20px",
            transition: "all 0.3s",
            fontSize: "15px",
          }}
          onMouseEnter={(e) => !isLoading && (e.target.style.backgroundColor = "#15803d")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "#16a34a")}
        >
          {isLoading ? "Creating account..." : "Create Account"}
        </button>

        {/* Sign In Link */}
        <div style={{ textAlign: "center", fontSize: "14px", color: "#666" }}>
          Already have an account?{" "}
          <Link
            href="/auth/login"
            style={{ color: "#16a34a", textDecoration: "none", fontWeight: "600" }}
          >
            Sign in
          </Link>
        </div>
      </form>
      </div>
    </div>
  );
}
