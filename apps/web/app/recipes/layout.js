"use client";

import Link from "next/link";
import { AuthGuard } from "../components/auth-guard";

export default function RecipesLayout({ children }) {
  return (
    <AuthGuard>
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Header */}
      <header
        style={{
          backgroundColor: "#fff",
          borderBottom: "2px solid #e8e4d9",
          padding: "12px 0",
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(10px)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "0 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/recipes"
            style={{
              fontSize: "28px",
              fontWeight: "400",
              color: "#16a34a",
              textDecoration: "none",
              fontFamily: "'Finger Paint', cursive",
            }}
          >
            nibble
          </Link>

          <nav style={{ display: "flex", gap: "clamp(16px, 3vw, 32px)", alignItems: "center", flexWrap: "wrap" }}>
            <Link
              href="/recipes"
              style={{
                color: "#666",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "500",
                transition: "color 0.3s",
              }}
              onMouseEnter={(e) => (e.target.style.color = "#16a34a")}
              onMouseLeave={(e) => (e.target.style.color = "#666")}
            >
              Recipes
            </Link>
            <Link
              href="/recipes/new"
              style={{
                color: "#666",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "500",
                transition: "color 0.3s",
              }}
              onMouseEnter={(e) => (e.target.style.color = "#16a34a")}
              onMouseLeave={(e) => (e.target.style.color = "#666")}
            >
              New Recipe
            </Link>
            <Link
              href="/profile"
              style={{
                color: "#666",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "500",
                transition: "color 0.3s",
              }}
              onMouseEnter={(e) => (e.target.style.color = "#16a34a")}
              onMouseLeave={(e) => (e.target.style.color = "#666")}
            >
              Profile
            </Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "40px 24px",
          flex: 1,
          width: "100%",
        }}
      >
        {children}
      </main>

      {/* Footer */}
      <footer
        style={{
          backgroundColor: "#fff",
          borderTop: "2px solid #e8e4d9",
          padding: "40px 24px",
          marginTop: "auto",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            textAlign: "center",
            color: "#999",
            fontSize: "14px",
          }}
        >
          <p>
            nibble — Manage recipes across all your devices
          </p>
        </div>
      </footer>
    </div>
    </AuthGuard>
  );
}
