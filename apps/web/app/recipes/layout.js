"use client";

import Link from "next/link";
import { AuthGuard } from "../components/auth-guard";

export default function RecipesLayout({ children }) {
  return (
    <AuthGuard>
      <div style={{ minHeight: "100vh", background: "linear-gradient(to bottom, #faf8f3 0%, #f5f1e8 100%)" }}>
      {/* Header */}
      <header
        style={{
          backgroundColor: "#fff",
          borderBottom: "2px solid #e8e4d9",
          padding: "20px 0",
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(10px)",
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Link
            href="/recipes"
            style={{
              fontSize: "28px",
              fontWeight: "400",
              color: "#16a34a",
              textDecoration: "none",
              fontFamily: "'Fontdiner Swanky', cursive",
            }}
          >
            Nibble
          </Link>

          <nav style={{ display: "flex", gap: "32px", alignItems: "center" }}>
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
          marginTop: "80px",
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
            Nibble — Manage recipes across all your devices
          </p>
        </div>
      </footer>
    </div>
    </AuthGuard>
  );
}
