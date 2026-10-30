"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { getRecipeImageUrl } from "../../utils/recipe-images";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function RecipeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [servings, setServings] = useState(null);
  const [showPrintView, setShowPrintView] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");

  useEffect(() => {
    if (params?.id) {
      fetchRecipe(params.id);
    }
  }, [params?.id]);

  const fetchRecipe = async (id) => {
    try {
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
        .eq("id", id)
        .single();

      if (error) throw error;
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;

      const transformed = {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        description: data.description,
        imageUrl: await getRecipeImageUrl(supabase, data.image_url),
        sourceUrl: data.source_url,
        ingredients: data.recipe_ingredients?.sort((a, b) => a.order - b.order) || [],
        instructions: data.recipe_instructions?.sort((a, b) => a.order - b.order) || [],
        tags: data.recipe_tags?.map((t) => t.tag_name) || [],
        prepTime: data.prep_time_minutes,
        cookTime: data.cook_time_minutes,
        servings: data.servings,
      };

      setRecipe(transformed);
      setCurrentUserId(user?.id || "");
      setServings(transformed.servings);
    } catch (error) {
      console.error("Failed to fetch recipe:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this recipe?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("recipes")
        .delete()
        .eq("id", recipe.id);

      if (error) throw error;

      router.push("/recipes");
    } catch (error) {
      console.error("Failed to delete recipe:", error);
      alert("Failed to delete recipe");
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px" }}>
        <p style={{ color: "#6b7280" }}>Loading recipe...</p>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px" }}>
        <p style={{ color: "#ef4444", marginBottom: "20px" }}>
          Recipe not found
        </p>
        <Link
          href="/recipes"
          style={{
            color: "#10b981",
            textDecoration: "none",
            fontWeight: "600",
          }}
        >
          Back to recipes
        </Link>
      </div>
    );
  }

  if (showPrintView) {
    return (
      <div style={{ padding: "40px 20px" }}>
        <button
          onClick={() => setShowPrintView(false)}
          style={{
            marginBottom: "20px",
            padding: "8px 16px",
            backgroundColor: "#f3f4f6",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          ← Back
        </button>

        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <style>{`
            @media print {
              body { margin: 0; padding: 0; }
              .no-print { display: none; }
            }
          `}</style>

          <h1 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "16px" }}>
            {recipe.title}
          </h1>

          {recipe.servings && (
            <p style={{ color: "#6b7280", marginBottom: "16px" }}>
              Servings: {recipe.servings}
            </p>
          )}

          <h2 style={{ fontSize: "18px", fontWeight: "600", marginTop: "24px", marginBottom: "12px" }}>
            Ingredients
          </h2>
          <ul style={{ color: "#111827", lineHeight: "1.8" }}>
            {recipe.ingredients.map((ing, idx) => (
              <li key={idx}>
                {ing.quantity && <strong>{ing.quantity}</strong>}
                {ing.quantity && ing.unit && " "}
                {ing.unit && <strong>{ing.unit}</strong>}
                {(ing.quantity || ing.unit) && " "}
                {ing.ingredient}
              </li>
            ))}
          </ul>

          <h2 style={{ fontSize: "18px", fontWeight: "600", marginTop: "24px", marginBottom: "12px" }}>
            Instructions
          </h2>
          <ol style={{ color: "#111827", lineHeight: "1.8" }}>
            {recipe.instructions.map((instr, idx) => (
              <li key={idx}>{instr.step}</li>
            ))}
          </ol>

          <button
            onClick={() => window.print()}
            className="no-print"
            style={{
              marginTop: "40px",
              padding: "12px 24px",
              backgroundColor: "#10b981",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Print Recipe
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <Link
          href="/recipes"
          style={{
            color: "#10b981",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: "600",
            marginBottom: "16px",
            display: "inline-block",
          }}
        >
          ← Back to recipes
        </Link>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginTop: "16px",
          }}
        >
          <div>
            <h1 style={{ fontSize: "36px", fontWeight: "700", color: "#111827" }}>
              {recipe.title}
            </h1>
            {recipe.description && (
              <p style={{ color: "#6b7280", marginTop: "8px", fontSize: "16px" }}>
                {recipe.description}
              </p>
            )}
          </div>

          {recipe.userId === currentUserId && (
          <div style={{ display: "flex", gap: "8px" }}>
            <Link
              href={`/recipes/${recipe.id}/edit`}
              style={{
                padding: "8px 16px",
                backgroundColor: "#10b981",
                color: "#fff",
                borderRadius: "6px",
                textDecoration: "none",
                fontWeight: "500",
                fontSize: "14px",
              }}
            >
              Edit
            </Link>
            <button
              onClick={handleDelete}
              style={{
                padding: "8px 16px",
                backgroundColor: "#ef4444",
                color: "#fff",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "14px",
              }}
            >
              Delete
            </button>
          </div>
          )}
        </div>
      </div>

      {/* Image */}
      {recipe.imageUrl && (
        <img
          src={recipe.imageUrl}
          alt={recipe.title}
          style={{
            width: "100%",
            maxHeight: "400px",
            objectFit: "cover",
            borderRadius: "12px",
            marginBottom: "32px",
          }}
        />
      )}

      {recipe.sourceUrl && (
        <p className="recipe-source-link">
          <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer">
            View original recipe
          </a>
        </p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "40px" }}>
        {/* Main Content */}
        <div>
          {/* Ingredients */}
          <section style={{ marginBottom: "40px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: "600", marginBottom: "16px" }}>
              Ingredients
            </h2>
            <ul style={{ color: "#111827", lineHeight: "2", fontSize: "16px" }}>
              {recipe.ingredients.map((ing, idx) => (
                <li key={idx} style={{ marginBottom: "8px" }}>
                  <input
                    type="checkbox"
                    style={{ marginRight: "8px" }}
                    id={`ingredient-${idx}`}
                  />
                  <label htmlFor={`ingredient-${idx}`}>
                    {ing.quantity && <span style={{ fontWeight: "600" }}>{ing.quantity}</span>}
                    {ing.quantity && ing.unit && " "}
                    {ing.unit && <span style={{ fontWeight: "600" }}>{ing.unit}</span>}
                    {(ing.quantity || ing.unit) && " "}
                    {ing.ingredient}
                  </label>
                </li>
              ))}
            </ul>
          </section>

          {/* Instructions */}
          <section>
            <h2 style={{ fontSize: "24px", fontWeight: "600", marginBottom: "16px" }}>
              Instructions
            </h2>
            <ol style={{ color: "#111827", fontSize: "16px", lineHeight: "2" }}>
              {recipe.instructions.map((instr, idx) => (
                <li
                  key={idx}
                  style={{
                    marginBottom: "16px",
                    paddingLeft: "8px",
                    borderLeft: "3px solid #10b981",
                    paddingBottom: "12px",
                  }}
                >
                  {instr.step}
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* Sidebar */}
        <aside>
          {/* Timing */}
          <div
            style={{
              backgroundColor: "#f3f4f6",
              borderRadius: "8px",
              padding: "20px",
              marginBottom: "24px",
            }}
          >
            <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px", color: "#111827" }}>
              Timing
            </h3>
            {recipe.prepTime && (
              <p style={{ color: "#6b7280", marginBottom: "8px" }}>
                <strong>Prep:</strong> {recipe.prepTime} minutes
              </p>
            )}
            {recipe.cookTime && (
              <p style={{ color: "#6b7280" }}>
                <strong>Cook:</strong> {recipe.cookTime} minutes
              </p>
            )}
            {recipe.prepTime && recipe.cookTime && (
              <p style={{ color: "#10b981", marginTop: "8px", fontWeight: "600" }}>
                Total: {recipe.prepTime + recipe.cookTime} minutes
              </p>
            )}
          </div>

          {/* Servings */}
          {recipe.servings && (
            <div
              style={{
                backgroundColor: "#f3f4f6",
                borderRadius: "8px",
                padding: "20px",
                marginBottom: "24px",
              }}
            >
              <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px", color: "#111827" }}>
                Servings
              </h3>
              <p style={{ color: "#111827", fontSize: "16px", fontWeight: "600" }}>
                {recipe.servings}
              </p>
            </div>
          )}

          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <div
              style={{
                backgroundColor: "#f3f4f6",
                borderRadius: "8px",
                padding: "20px",
              }}
            >
              <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px", color: "#111827" }}>
                Tags
              </h3>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {recipe.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    style={{
                      backgroundColor: "#ecfdf5",
                      color: "#10b981",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "500",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ marginTop: "24px" }}>
            <button
              onClick={() => setShowPrintView(true)}
              style={{
                width: "100%",
                padding: "12px 16px",
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
                color: "#111827",
              }}
            >
              🖨️ Print
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
