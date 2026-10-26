"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Redirect to recipes
      router.push("/recipes");
    } catch (err) {
      setError(err.message || "Failed to sign in");
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
          Sign In
        </h1>
        <p style={{ color: "#6b7280", fontSize: "14px" }}>
          Welcome back to RecipeHelper
        </p>
      </div>

      <form
        onSubmit={handleLogin}
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
            placeholder="Your password"
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
          {isLoading ? "Signing in..." : "Sign In"}
        </button>

        {/* Sign Up Link */}
        <div style={{ textAlign: "center", fontSize: "14px", color: "#6b7280" }}>
          Don't have an account?{" "}
          <Link
            href="/auth/signup"
            style={{ color: "#10b981", textDecoration: "none", fontWeight: "600" }}
          >
            Sign up
          </Link>
        </div>
      </form>
    </div>
  );
}
