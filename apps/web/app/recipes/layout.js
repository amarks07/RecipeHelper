import Link from "next/link";

export default function RecipesLayout({ children }) {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
      {/* Header */}
      <header
        style={{
          backgroundColor: "#fff",
          borderBottom: "1px solid #e5e7eb",
          padding: "20px 0",
          position: "sticky",
          top: 0,
          zIndex: 50,
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
              fontSize: "24px",
              fontWeight: "700",
              color: "#10b981",
              textDecoration: "none",
            }}
          >
            RecipeHelper
          </Link>

          <nav style={{ display: "flex", gap: "32px" }}>
            <Link
              href="/recipes"
              style={{
                color: "#6b7280",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Recipes
            </Link>
            <Link
              href="/recipes/new"
              style={{
                color: "#6b7280",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              New Recipe
            </Link>
            <Link
              href="/profile"
              style={{
                color: "#6b7280",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "500",
              }}
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
          backgroundColor: "#f3f4f6",
          borderTop: "1px solid #e5e7eb",
          padding: "40px 24px",
          marginTop: "80px",
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            textAlign: "center",
            color: "#6b7280",
            fontSize: "14px",
          }}
        >
          <p>
            RecipeHelper — Manage recipes across all your devices with
            Supabase
          </p>
        </div>
      </footer>
    </div>
  );
}
