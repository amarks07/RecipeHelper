"use client";

import Link from "next/link";
import { useState } from "react";

export default function ProfilePage() {
  const [isSignedIn, setIsSignedIn] = useState(false);

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ marginBottom: "40px" }}>
        <h1 style={{ fontSize: "36px", fontWeight: "700", color: "#111827" }}>
          Profile
        </h1>
        <p style={{ color: "#6b7280", marginTop: "8px" }}>
          Manage your account and preferences
        </p>
      </div>

      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          padding: "32px",
        }}
      >
        {!isSignedIn ? (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#6b7280", marginBottom: "20px" }}>
              Sign in to sync your recipes across devices and access exclusive features.
            </p>
            <button
              onClick={() => setIsSignedIn(true)}
              style={{
                padding: "12px 24px",
                backgroundColor: "#10b981",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Sign In
            </button>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "12px" }}>
                Account
              </h2>
              <p style={{ color: "#6b7280", fontSize: "14px" }}>
                user@example.com
              </p>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "12px" }}>
                Preferences
              </h2>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input type="checkbox" defaultChecked />
                  <span style={{ color: "#6b7280", fontSize: "14px" }}>
                    Email notifications for recipe suggestions
                  </span>
                </label>
              </div>
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input type="checkbox" defaultChecked />
                  <span style={{ color: "#6b7280", fontSize: "14px" }}>
                    Allow recipe syncing across devices
                  </span>
                </label>
              </div>
            </div>

            <button
              onClick={() => setIsSignedIn(false)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#fecaca",
                color: "#7f1d1d",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              Sign Out
            </button>
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: "40px",
          padding: "20px",
          backgroundColor: "#f3f4f6",
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
            backgroundColor: "#10b981",
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
