"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { getDeviceType } from "../../utils/device-detection";
import FruitPhysicsLayer from "../../components/FruitPhysicsLayer";
import GoogleLogo from "../../components/GoogleLogo";

const FRUIT_ICONS = [
  "fig", "lemon", "pear", "red-apple", "tomato", "cherries", "yellow-pear",
  "blueberries", "watermelon", "peach", "pomegranate", "strawberry",
  "avocado", "pineapple", "grapes", "green-apple", "plum", "orange",
];

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

  useEffect(() => {
    // Android users can't access the web app
    const device = getDeviceType();
    if (device.isAndroid) {
      router.push("/");
    }
  }, [router]);

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

  const handleGoogleSignIn = async () => {
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
      setError(err.message || "Failed to sign in with Google");
      setIsLoading(false);
    }
  };

  return (
    <main className="login-page theme-content">
      <FruitPhysicsLayer fruits={FRUIT_ICONS} />
      <div style={{ maxWidth: "420px", width: "100%", minWidth: "280px" }}>
        <form
          className="login-card fruit-physics-obstacle"
          onSubmit={handleLogin}
          style={{
            borderRadius: "32px",
            border: "2px solid #e8e4d9",
            padding: "40px",
            boxShadow: "0 4px 20px rgba(74, 222, 128, 0.1)",
          }}
        >
        <div style={{ marginBottom: "32px", textAlign: "center" }}>
          <h1
            className="home-wordmark theme-brand"
            style={{
              fontSize: "36px",
              fontWeight: "400",
              color: "#16a34a",
              marginBottom: "12px",
              fontFamily: "'Finger Paint', cursive",
              letterSpacing: "0px",
            }}
          >
            nibble
          </h1>
          <p style={{ color: "#666", fontSize: "14px" }}>
            Welcome back to nibble
          </p>
        </div>
        {/* Google Sign In */}
        <button
          className="google-signin"
          type="button"
          onClick={handleGoogleSignIn}
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
          <GoogleLogo />
          <span>{isLoading ? "…" : "Continue with Google"}</span>
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
          {isLoading ? "Signing in..." : "Sign In"}
        </button>

        {/* Sign Up Link */}
        <div style={{ textAlign: "center", fontSize: "14px", color: "#666" }}>
          Don't have an account?{" "}
          <Link
            href="/auth/signup"
            style={{ color: "#16a34a", textDecoration: "none", fontWeight: "600" }}
          >
            Sign up
          </Link>
        </div>
      </form>
      </div>
    </main>
  );
}
