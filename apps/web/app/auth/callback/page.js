"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function CallbackPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get code from hash fragment
        const hash = typeof window !== "undefined" ? window.location.hash.substring(1) : "";
        const params = new URLSearchParams(hash);
        const code = params.get("code");
        const errorCode = params.get("error");
        const errorDescription = params.get("error_description");

        console.log("Callback params:", { code, errorCode, errorDescription });

        // Handle errors from Google/Supabase
        if (errorCode) {
          console.error("OAuth error:", errorDescription || errorCode);
          setError(errorDescription || errorCode);
          setTimeout(() => {
            router.push("/auth/login");
          }, 2000);
          return;
        }

        if (!code) {
          console.log("No code in URL, checking for existing session...");
          // Check if session already exists
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            console.log("Session exists, redirecting to recipes");
            router.push("/recipes");
            return;
          }
          // No code and no session - just redirect to login silently
          console.log("No code and no session, redirecting to login");
          router.push("/auth/login");
          return;
        }

        console.log("Exchanging code for session...");
        // Exchange code for session
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          console.error("Exchange error:", exchangeError);
          setError(exchangeError.message || "Failed to complete sign-in");
          setTimeout(() => {
            router.push("/auth/login");
          }, 2000);
          return;
        }

        console.log("Exchange successful, session:", data?.session?.user?.email);

        // Wait a moment for session to be persisted, then redirect
        setTimeout(() => {
          console.log("Redirecting to recipes");
          router.push("/recipes");
        }, 500);
      } catch (err) {
        console.error("Callback error:", err);
        setError(err.message || "An error occurred");
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
      } finally {
        setIsLoading(false);
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div style={{ flex: 1, backgroundColor: "#f9fafb", justifyContent: "center", padding: 20, minHeight: "100vh", display: "flex", alignItems: "center" }}>
      <div style={{ textAlign: "center", maxWidth: "400px" }}>
        {isLoading ? (
          <>
            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  display: "inline-block",
                  width: "40px",
                  height: "40px",
                  border: "4px solid #e5e7eb",
                  borderTop: "4px solid #10b981",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
            </div>
            <p style={{ color: "#6b7280", fontSize: "16px" }}>
              Completing sign-in...
            </p>
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </>
        ) : error ? (
          <>
            <p style={{ color: "#991b1b", fontSize: "16px", marginBottom: "10px" }}>
              {error}
            </p>
            <p style={{ color: "#6b7280", fontSize: "14px" }}>
              Redirecting to sign in...
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
