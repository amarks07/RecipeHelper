"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function RecipesPage() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("recipes")
        .select(
          `
          *,
          recipe_ingredients(*),
          recipe_instructions(*),
          recipe_tags(*)
        `
        )
        .eq("user_id", session.user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Transform data
      const transformed = (data || []).map((recipe) => ({
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        imageUrl: recipe.image_url,
        ingredients: recipe.recipe_ingredients || [],
        instructions: recipe.recipe_instructions || [],
        tags: recipe.recipe_tags?.map((t) => t.tag_name) || [],
        prepTime: recipe.prep_time_minutes,
        cookTime: recipe.cook_time_minutes,
        servings: recipe.servings,
      }));

      setRecipes(transformed);
    } catch (error) {
      console.error("Failed to fetch recipes:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique tags
  const allTags = Array.from(
    new Set(recipes.flatMap((r) => r.tags || []))
  ).sort();

  // Filter recipes
  const filtered = recipes.filter((recipe) => {
    const matchesSearch =
      !searchQuery ||
      recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.ingredients?.some((ing) =>
        ing.ingredient.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.every((tag) => recipe.tags?.includes(tag));

    return matchesSearch && matchesTags;
  });

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px" }}>
        <p style={{ color: "#6b7280" }}>Loading recipes...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "40px" }}>
        <h1 style={{ fontSize: "36px", fontWeight: "700", color: "#111827" }}>
          Recipes
        </h1>
        <p style={{ color: "#6b7280", marginTop: "8px" }}>
          Manage and organize your favorite recipes
        </p>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: "24px" }}>
        <input
          type="text"
          placeholder="Search recipes by title or ingredient..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 16px",
            fontSize: "14px",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            backgroundColor: "#fff",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Tag Filter */}
      {allTags.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  if (selectedTags.includes(tag)) {
                    setSelectedTags(selectedTags.filter((t) => t !== tag));
                  } else {
                    setSelectedTags([...selectedTags, tag]);
                  }
                }}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: selectedTags.includes(tag)
                    ? "2px solid #10b981"
                    : "1px solid #e5e7eb",
                  backgroundColor: selectedTags.includes(tag)
                    ? "#ecfdf5"
                    : "#fff",
                  color: selectedTags.includes(tag) ? "#10b981" : "#6b7280",
                  fontSize: "12px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.3s",
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recipe Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <p style={{ color: "#6b7280", marginBottom: "20px" }}>
            {recipes.length === 0
              ? "No recipes yet. Create one to get started!"
              : "No recipes match your search."}
          </p>
          {recipes.length === 0 && (
            <Link
              href="/recipes/new"
              style={{
                display: "inline-block",
                padding: "12px 24px",
                backgroundColor: "#10b981",
                color: "#fff",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: "600",
              }}
            >
              Create First Recipe
            </Link>
          )}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "24px",
          }}
        >
          {filtered.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.id}`}
              style={{
                backgroundColor: "#fff",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                overflow: "hidden",
                transition: "all 0.3s",
                cursor: "pointer",
                textDecoration: "none",
                color: "inherit",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(0, 0, 0, 0.1)";
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {/* Image */}
              {recipe.imageUrl && (
                <img
                  src={recipe.imageUrl}
                  alt={recipe.title}
                  style={{
                    width: "100%",
                    height: "160px",
                    objectFit: "cover",
                  }}
                />
              )}

              {/* Content */}
              <div style={{ padding: "16px" }}>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#111827",
                    marginBottom: "8px",
                  }}
                >
                  {recipe.title}
                </h3>

                {recipe.description && (
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#6b7280",
                      marginBottom: "12px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {recipe.description}
                  </p>
                )}

                {/* Metadata */}
                <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                  {recipe.ingredients && recipe.ingredients.length > 0 && (
                    <span style={{ fontSize: "12px", color: "#6b7280" }}>
                      🧂 {recipe.ingredients.length} ingredients
                    </span>
                  )}
                  {recipe.prepTime && (
                    <span style={{ fontSize: "12px", color: "#6b7280" }}>
                      ⏱️ {recipe.prepTime}m prep
                    </span>
                  )}
                </div>

                {/* Tags */}
                {recipe.tags && recipe.tags.length > 0 && (
                  <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    {recipe.tags.slice(0, 2).map((tag, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: "11px",
                          backgroundColor: "#ecfdf5",
                          color: "#10b981",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontWeight: "500",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                    {recipe.tags.length > 2 && (
                      <span
                        style={{
                          fontSize: "11px",
                          color: "#6b7280",
                          padding: "4px 0",
                        }}
                      >
                        +{recipe.tags.length - 2} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
