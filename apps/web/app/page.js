import Link from "next/link";

export default function Home() {
  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "80px 24px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <h1
            style={{
              fontSize: "48px",
              fontWeight: "700",
              color: "#111827",
              marginBottom: "16px",
            }}
          >
            RecipeHelper
          </h1>
          <p
            style={{
              fontSize: "18px",
              color: "#6b7280",
              maxWidth: "560px",
              margin: "0 auto 32px",
            }}
          >
            Capture recipes from photos, search by ingredient, manage and sync
            across all your devices.
          </p>
        </div>

        {/* Features Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "32px",
            marginBottom: "64px",
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              padding: "32px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>📸</div>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#111827",
                marginBottom: "8px",
              }}
            >
              Capture Recipes
            </h3>
            <p style={{ color: "#6b7280", fontSize: "14px" }}>
              Take screenshots of any recipe. Our smart OCR extracts ingredients
              and instructions automatically.
            </p>
          </div>

          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              padding: "32px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>🔍</div>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#111827",
                marginBottom: "8px",
              }}
            >
              Search & Filter
            </h3>
            <p style={{ color: "#6b7280", fontSize: "14px" }}>
              Find recipes by ingredient, cuisine, or custom tags. Organize your
              collection exactly how you want.
            </p>
          </div>

          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              padding: "32px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>☁️</div>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#111827",
                marginBottom: "8px",
              }}
            >
              Sync Everywhere
            </h3>
            <p style={{ color: "#6b7280", fontSize: "14px" }}>
              Access your recipes on mobile and web. Everything syncs
              automatically across devices.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div
          style={{
            backgroundColor: "#ecfdf5",
            borderRadius: "12px",
            padding: "48px 24px",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontSize: "32px",
              fontWeight: "700",
              color: "#111827",
              marginBottom: "16px",
            }}
          >
            Ready to organize your recipes?
          </h2>
          <p
            style={{
              color: "#6b7280",
              marginBottom: "32px",
              fontSize: "16px",
            }}
          >
            Start managing your recipes now on web or download the mobile app to capture from photos.
          </p>

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
        </div>

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            marginTop: "80px",
            paddingTop: "32px",
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <p style={{ color: "#6b7280", fontSize: "14px" }}>
            RecipeHelper — Capture photos • Sync devices • Organize recipes
          </p>
        </div>
      </div>
    </main>
  );
}
