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
      <div style={{ marginBottom: "40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "700", color: "#111827", margin: 0 }}>
          Your Recipes
        </h1>
        <Link
          href="/recipes/new"
          style={{
            padding: "12px 28px",
            backgroundColor: "#16a34a",
            color: "#fff",
            borderRadius: "50px",
            textDecoration: "none",
            fontWeight: "600",
            fontSize: "14px",
            transition: "background-color 0.3s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#15803d")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#16a34a")}
        >
          + Add Recipe
        </Link>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: "32px" }}>
        <input
          type="text"
          placeholder="Search recipes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "14px 18px",
            fontSize: "15px",
            border: "2px solid #e8e4d9",
            borderRadius: "10px",
            backgroundColor: "#fefdfb",
            color: "#111827",
            boxSizing: "border-box",
            cursor: "text",
            caretColor: "#111827",
            transition: "border-color 0.3s",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#16a34a")}
          onBlur={(e) => (e.target.style.borderColor = "#e8e4d9")}
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
                    ? "2px solid #16a34a"
                    : "1px solid #e8e4d9",
                  backgroundColor: selectedTags.includes(tag)
                    ? "#f0fdf4"
                    : "#fff",
                  color: selectedTags.includes(tag) ? "#16a34a" : "#6b7280",
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
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <p style={{ color: "#666", marginBottom: "20px", fontSize: "16px" }}>
            {recipes.length === 0
              ? "No recipes yet. Create one to get started!"
              : "No recipes match your search."}
          </p>
          {recipes.length === 0 && (
            <Link
              href="/recipes/new"
              style={{
                display: "inline-block",
                padding: "12px 28px",
                backgroundColor: "#16a34a",
                color: "#fff",
                borderRadius: "50px",
                textDecoration: "none",
                fontWeight: "600",
                transition: "background-color 0.3s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#15803d")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#16a34a")}
            >
              Create First Recipe
            </Link>
          )}
        </div>
      ) : (
        <div
          style={{
            columnCount: 3,
            columnGap: "24px",
            columnFill: "balance",
          }}
        >
          {filtered.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.id}`}
              style={{
                backgroundColor: "#fefdfb",
                borderRadius: "32px",
                border: "2px solid #e8e4d9",
                overflow: "hidden",
                transition: "all 0.3s ease",
                cursor: "pointer",
                textDecoration: "none",
                color: "inherit",
                boxShadow: "0 4px 12px rgba(74, 222, 128, 0.08)",
                breakInside: "avoid",
                marginBottom: "24px",
                display: "block",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 12px 24px rgba(74, 222, 128, 0.15)";
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(74, 222, 128, 0.08)";
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
              <div style={{ padding: "20px" }}>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    color: "#111827",
                    marginBottom: "12px",
                    lineHeight: "1.3",
                  }}
                >
                  {recipe.title}
                </h3>

                {recipe.description && (
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#666",
                      marginBottom: "14px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      lineHeight: "1.4",
                    }}
                  >
                    {recipe.description}
                  </p>
                )}

                {/* Metadata */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
                  {recipe.ingredients && recipe.ingredients.length > 0 && (
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#16a34a",
                        backgroundColor: "#f0fdf4",
                        padding: "4px 10px",
                        borderRadius: "12px",
                      }}
                    >
                      {recipe.ingredients.length} ingredients
                    </span>
                  )}
                  {recipe.prepTime && (
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#16a34a",
                        backgroundColor: "#f0fdf4",
                        padding: "4px 10px",
                        borderRadius: "12px",
                      }}
                    >
                      {recipe.prepTime}m prep
                    </span>
                  )}
                </div>

                {/* Tags */}
                {recipe.tags && recipe.tags.length > 0 && (
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {recipe.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: "12px",
                          backgroundColor: "#f0fdf4",
                          color: "#16a34a",
                          padding: "4px 10px",
                          borderRadius: "12px",
                          fontWeight: "500",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                    {recipe.tags.length > 3 && (
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#999",
                          padding: "4px 0",
                        }}
                      >
                        +{recipe.tags.length - 3}
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
