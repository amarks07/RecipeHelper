"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../supabase-client";

const ProfileNavLink = dynamic(
  () => import("./ProfileNavLink").then((module) => module.ProfileNavLink),
  { ssr: false }
);

const navigationLinkStyle = {
  color: "#666",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: "500",
  transition: "color 0.3s",
};

function NavigationLink({ href, children }) {
  return (
    <Link
      href={href}
      style={navigationLinkStyle}
      onMouseEnter={(event) => (event.currentTarget.style.color = "#16a34a")}
      onMouseLeave={(event) => (event.currentTarget.style.color = "#666")}
    >
      {children}
    </Link>
  );
}

export function SiteNavbar() {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let active = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setIsAuthenticated(Boolean(session));
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error("Failed to load navbar auth state:", error);
        return;
      }
      if (active) setIsAuthenticated(Boolean(data.session));
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (!isAuthenticated || pathname.startsWith("/auth/")) return null;

  return (
    <header className="recipe-header">
      <div className="recipe-header-inner">
        <Link className="recipe-wordmark theme-brand" href="/recipes">
          nibble
        </Link>
        <nav className="recipe-header-nav">
          <NavigationLink href="/recipes">Recipes</NavigationLink>
          <NavigationLink href="/recipes/new">New Recipe</NavigationLink>
          <ProfileNavLink />
        </nav>
      </div>
    </header>
  );
}
