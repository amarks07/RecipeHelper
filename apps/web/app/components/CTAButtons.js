"use client";

import Link from "next/link";

export function CTAButtons() {
  return (
    <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
      <Link
        href="/recipes"
        style={{
          display: "inline-block",
          backgroundColor: "#10b981",
          color: "#fff",
          fontWeight: "600",
          padding: "16px 32px",
          borderRadius: "8px",
          textDecoration: "none",
          transition: "background-color 0.3s",
        }}
        onMouseEnter={(e) => (e.target.style.backgroundColor = "#059669")}
        onMouseLeave={(e) => (e.target.style.backgroundColor = "#10b981")}
      >
        Go to Recipes →
      </Link>
      <a
        href="https://github.com/amarks07/RecipeHelper"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-block",
          backgroundColor: "#fff",
          color: "#111827",
          fontWeight: "600",
          padding: "16px 32px",
          borderRadius: "8px",
          textDecoration: "none",
          border: "1px solid #e5e7eb",
          transition: "all 0.3s",
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = "#f3f4f6";
          e.target.style.borderColor = "#10b981";
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = "#fff";
          e.target.style.borderColor = "#e5e7eb";
        }}
      >
        View on GitHub
      </a>
    </div>
  );
}
