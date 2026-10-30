"use client";

import { HouseholdGuard } from "../components/household-guard";

export default function RecipesLayout({ children }) {
  return (
    <HouseholdGuard>
      <div className="theme-content">
        <main className="recipe-page-main">{children}</main>
      </div>
    </HouseholdGuard>
  );
}
