"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { getDeviceType } from "./utils/device-detection";

export default function Home() {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [deviceType, setDeviceType] = useState("desktop");

  useEffect(() => {
    setIsHydrated(true);
    const device = getDeviceType();
    setDeviceType(device.deviceType);

    // Check if user is already signed in
    const checkAuth = async () => {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Android users go back to install page, others go to recipes
        if (device.isAndroid) {
          return;
        }
        router.push("/recipes");
      }
    };
    checkAuth();
  }, [router]);

  // Android shows install instructions
  if (deviceType === "android") {
    return (
      <main style={{ minHeight: "100vh", background: "linear-gradient(to bottom, #faf8f3 0%, #f5f1e8 100%)", padding: "20px" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto", paddingTop: "40px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: "700", color: "#111827", marginBottom: "8px" }}>
            RecipeHelper
          </h1>
          <p style={{ color: "#6b7280", marginBottom: "40px", fontSize: "16px" }}>
            Capture recipes from photos. Sync across devices.
          </p>

          <div style={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "32px", marginBottom: "24px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#111827", marginBottom: "20px" }}>
              📱 Install the App
            </h2>
            <p style={{ color: "#6b7280", marginBottom: "24px", lineHeight: "1.6" }}>
              RecipeHelper works best as a native Android app. Download it now to capture recipes from your phone camera.
            </p>
            <button
              onClick={() => window.open("https://github.com/amarks07/RecipeHelper/releases", "_blank")}
              style={{
                width: "100%",
                padding: "16px 24px",
                backgroundColor: "#16a34a",
                color: "#fff",
                border: "none",
                borderRadius: "50px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
                marginBottom: "16px",
                transition: "background-color 0.3s",
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#15803d")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "#16a34a")}
            >
              Download on Google Play
            </button>

            <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "24px", marginTop: "24px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#111827", marginBottom: "12px" }}>
                Features
              </h3>
              <ul style={{ color: "#6b7280", fontSize: "14px", lineHeight: "1.8", paddingLeft: "20px" }}>
                <li>📸 Capture recipes with your camera</li>
                <li>🤖 Smart OCR extracts ingredients & instructions</li>
                <li>☁️ Sync across all your devices</li>
                <li>🔍 Search and organize by ingredients</li>
                <li>📱 Works on iOS and web too!</li>
              </ul>
            </div>
          </div>

          <div style={{ backgroundColor: "#ecfdf5", borderRadius: "12px", padding: "20px", borderLeft: "4px solid #10b981" }}>
            <p style={{ color: "#065f46", fontSize: "14px", margin: 0 }}>
              <strong>💡 Tip:</strong> On desktop or iOS? Visit the website for the full experience.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/icon?family=Material+Icons');
        .material-icon {
          font-family: 'Material Icons';
          font-weight: normal;
          font-style: normal;
          font-size: 48px;
          display: inline-block;
          line-height: 1;
          text-transform: none;
          letter-spacing: normal;
          word-wrap: normal;
          white-space: nowrap;
          direction: ltr;
          color: #fff;
        }
      `}</style>

      <main
        style={{
          minHeight: "100vh",
          background: "linear-gradient(to bottom, #faf8f3 0%, #f5f1e8 100%)",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Get Started Button - Top Right */}
        <Link
          href="/auth/login"
          style={{
            position: "absolute",
            top: "32px",
            right: "32px",
            padding: "12px 32px",
            backgroundColor: "#16a34a",
            color: "#fff",
            borderRadius: "50px",
            textDecoration: "none",
            fontWeight: "600",
            fontSize: "14px",
            zIndex: 10,
            transition: "background-color 0.3s",
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = "#15803d")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "#16a34a")}
        >
          Get Started
        </Link>

        {/* Hero Title */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px 24px",
          }}
        >
          <h1
            style={{
              fontSize: "96px",
              fontWeight: "400",
              color: "#16a34a",
              margin: 0,
              fontFamily: "'Fontdiner Swanky', cursive",
              letterSpacing: "0px",
              textShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
            }}
          >
            RecipeHelper
          </h1>
        </div>

        {/* Features Sections with Dividers */}
        <div
          style={{
            display: "flex",
            width: "100%",
            paddingBottom: "80px",
          }}
        >
          {/* Section 1 */}
          <div
            style={{
              flex: 1,
              padding: "40px 32px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <span className="material-icon" style={{ color: "#16a34a" }}>photo_camera</span>
            <h3 style={{ color: "#16a34a", fontSize: "20px", fontWeight: "600", marginBottom: "12px" }}>
              Capture
            </h3>
            <p style={{ color: "#6b7280", fontSize: "14px" }}>
              Take screenshots of recipes. Smart OCR extracts ingredients and instructions.
            </p>
          </div>

          {/* Divider */}
          <div style={{ width: "1px", backgroundColor: "#16a34a" }} />

          {/* Section 2 */}
          <div
            style={{
              flex: 1,
              padding: "40px 32px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <span className="material-icon" style={{ color: "#16a34a" }}>search</span>
            <h3 style={{ color: "#16a34a", fontSize: "20px", fontWeight: "600", marginBottom: "12px" }}>
              Organize
            </h3>
            <p style={{ color: "#6b7280", fontSize: "14px" }}>
              Search by ingredient. Filter by tags. Organize your collection perfectly.
            </p>
          </div>

          {/* Divider */}
          <div style={{ width: "1px", backgroundColor: "#16a34a" }} />

          {/* Section 3 */}
          <div
            style={{
              flex: 1,
              padding: "40px 32px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <span className="material-icon" style={{ color: "#16a34a" }}>cloud_sync</span>
            <h3 style={{ color: "#16a34a", fontSize: "20px", fontWeight: "600", marginBottom: "12px" }}>
              Sync
            </h3>
            <p style={{ color: "#6b7280", fontSize: "14px" }}>
              Access on mobile and web. Everything syncs automatically across devices.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
