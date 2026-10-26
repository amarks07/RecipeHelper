"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function NewRecipePage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    ingredients: [{ name: "", quantity: "", unit: "" }],
    instructions: [""],
    tags: "",
  });

  const handleSave = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      alert("You must be signed in to create a recipe");
      router.push("/");
      return;
    }

    if (!form.title.trim()) {
      alert("Recipe title is required");
      return;
    }

    setIsSaving(true);
    try {
      // Create recipe
      const { data: recipe, error: recipeError } = await supabase
        .from("recipes")
        .insert({
          user_id: session.user.id,
          title: form.title,
          description: form.description,
        })
        .select()
        .single();

      if (recipeError) throw recipeError;

      // Add ingredients
      const ingredients = form.ingredients
        .filter((ing) => ing.name.trim())
        .map((ing, idx) => ({
          recipe_id: recipe.id,
          ingredient: ing.name,
          quantity: ing.quantity ? parseFloat(ing.quantity) : null,
          unit: ing.unit || null,
          order: idx,
        }));

      if (ingredients.length > 0) {
        const { error: ingError } = await supabase
          .from("recipe_ingredients")
          .insert(ingredients);
        if (ingError) throw ingError;
      }

      // Add instructions
      const instructions = form.instructions
        .filter((instr) => instr.trim())
        .map((instr, idx) => ({
          recipe_id: recipe.id,
          step: instr,
          order: idx,
        }));

      if (instructions.length > 0) {
        const { error: instrError } = await supabase
          .from("recipe_instructions")
          .insert(instructions);
        if (instrError) throw instrError;
      }

      // Add tags
      const tags = form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag);

      if (tags.length > 0) {
        const tagRows = tags.map((tag) => ({
          recipe_id: recipe.id,
          tag_name: tag,
        }));

        const { error: tagError } = await supabase
          .from("recipe_tags")
          .insert(tagRows);
        if (tagError) throw tagError;
      }

      router.push(`/recipes/${recipe.id}`);
    } catch (error) {
      console.error("Failed to save recipe:", error);
      alert("Failed to save recipe");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
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
        <h1 style={{ fontSize: "36px", fontWeight: "700", color: "#111827", marginTop: "16px" }}>
          Create Recipe
        </h1>
      </div>

      <div style={{ maxWidth: "800px" }}>
        {/* Title */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontWeight: "600", marginBottom: "6px" }}>
            Title *
          </label>
          <input
            type="text"
            placeholder="Recipe title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            style={{
              width: "100%",
              padding: "12px 16px",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontWeight: "600", marginBottom: "6px" }}>
            Description
          </label>
          <textarea
            placeholder="Optional description..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            style={{
              width: "100%",
              padding: "12px 16px",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Ingredients */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontWeight: "600", marginBottom: "12px" }}>
            Ingredients
          </label>
          {form.ingredients.map((ingredient, idx) => (
            <div
              key={idx}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 2fr auto",
                gap: "8px",
                marginBottom: "8px",
              }}
            >
              <input
                type="number"
                placeholder="Qty"
                value={ingredient.quantity}
                onChange={(e) => {
                  const newIngredients = [...form.ingredients];
                  newIngredients[idx].quantity = e.target.value;
                  setForm({ ...form, ingredients: newIngredients });
                }}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              />
              <input
                type="text"
                placeholder="Unit"
                value={ingredient.unit}
                onChange={(e) => {
                  const newIngredients = [...form.ingredients];
                  newIngredients[idx].unit = e.target.value;
                  setForm({ ...form, ingredients: newIngredients });
                }}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              />
              <input
                type="text"
                placeholder="Ingredient"
                value={ingredient.name}
                onChange={(e) => {
                  const newIngredients = [...form.ingredients];
                  newIngredients[idx].name = e.target.value;
                  setForm({ ...form, ingredients: newIngredients });
                }}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              />
              <button
                onClick={() => {
                  const newIngredients = form.ingredients.filter((_, i) => i !== idx);
                  setForm({ ...form, ingredients: newIngredients });
                }}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#fecaca",
                  color: "#7f1d1d",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "600",
                }}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            onClick={() => {
              setForm({
                ...form,
                ingredients: [
                  ...form.ingredients,
                  { name: "", quantity: "", unit: "" },
                ],
              });
            }}
            style={{
              padding: "8px 16px",
              backgroundColor: "#d1fae5",
              color: "#065f46",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            + Add Ingredient
          </button>
        </div>

        {/* Instructions */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontWeight: "600", marginBottom: "12px" }}>
            Instructions
          </label>
          {form.instructions.map((instruction, idx) => (
            <div key={idx} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
              <span style={{ width: "24px", fontWeight: "600", color: "#10b981" }}>
                {idx + 1}
              </span>
              <input
                type="text"
                placeholder="Instruction step"
                value={instruction}
                onChange={(e) => {
                  const newInstructions = [...form.instructions];
                  newInstructions[idx] = e.target.value;
                  setForm({ ...form, instructions: newInstructions });
                }}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              />
              <button
                onClick={() => {
                  const newInstructions = form.instructions.filter(
                    (_, i) => i !== idx
                  );
                  setForm({ ...form, instructions: newInstructions });
                }}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#fecaca",
                  color: "#7f1d1d",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "600",
                }}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            onClick={() => {
              setForm({
                ...form,
                instructions: [...form.instructions, ""],
              });
            }}
            style={{
              padding: "8px 16px",
              backgroundColor: "#d1fae5",
              color: "#065f46",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            + Add Step
          </button>
        </div>

        {/* Tags */}
        <div style={{ marginBottom: "32px" }}>
          <label style={{ display: "block", fontWeight: "600", marginBottom: "6px" }}>
            Tags (comma-separated)
          </label>
          <input
            type="text"
            placeholder="e.g., vegan, quick, breakfast"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            style={{
              width: "100%",
              padding: "12px 16px",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "12px" }}>
          <Link
            href="/recipes"
            style={{
              padding: "12px 24px",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              textDecoration: "none",
              color: "#111827",
              fontWeight: "600",
            }}
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              padding: "12px 24px",
              backgroundColor: "#10b981",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              opacity: isSaving ? 0.7 : 1,
            }}
          >
            {isSaving ? "Saving..." : "Create Recipe"}
          </button>
        </div>
      </div>
    </div>
  );
}
