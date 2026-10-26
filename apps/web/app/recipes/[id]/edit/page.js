"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function EditRecipePage({ params }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    prepTime: "",
    cookTime: "",
    servings: "",
    ingredients: [],
    instructions: [],
    tags: "",
  });

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

      setForm({
        title: data.title,
        description: data.description || "",
        prepTime: data.prep_time_minutes || "",
        cookTime: data.cook_time_minutes || "",
        servings: data.servings || "",
        ingredients: (data.recipe_ingredients || []).map((ing) => ({
          id: ing.id,
          name: ing.ingredient,
          quantity: ing.quantity || "",
          unit: ing.unit || "",
        })),
        instructions: (data.recipe_instructions || [])
          .sort((a, b) => a.order - b.order)
          .map((instr) => ({
            id: instr.id,
            step: instr.step,
          })),
        tags: (data.recipe_tags || [])
          .map((t) => t.tag_name)
          .join(", "),
      });
    } catch (error) {
      console.error("Failed to fetch recipe:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      alert("Recipe title is required");
      return;
    }

    setIsSaving(true);
    try {
      // Update recipe
      const { error: updateError } = await supabase
        .from("recipes")
        .update({
          title: form.title,
          description: form.description,
          prep_time_minutes: form.prepTime ? parseInt(form.prepTime) : null,
          cook_time_minutes: form.cookTime ? parseInt(form.cookTime) : null,
          servings: form.servings,
        })
        .eq("id", params.id);

      if (updateError) throw updateError;

      // Delete and re-insert ingredients
      await supabase.from("recipe_ingredients").delete().eq("recipe_id", params.id);

      const ingredients = form.ingredients
        .filter((ing) => ing.name.trim())
        .map((ing, idx) => ({
          recipe_id: params.id,
          ingredient: ing.name,
          quantity: ing.quantity ? parseFloat(ing.quantity) : null,
          unit: ing.unit || null,
          order: idx,
        }));

      if (ingredients.length > 0) {
        const { error } = await supabase
          .from("recipe_ingredients")
          .insert(ingredients);
        if (error) throw error;
      }

      // Delete and re-insert instructions
      await supabase.from("recipe_instructions").delete().eq("recipe_id", params.id);

      const instructions = form.instructions
        .filter((instr) => instr.step.trim())
        .map((instr, idx) => ({
          recipe_id: params.id,
          step: instr.step,
          order: idx,
        }));

      if (instructions.length > 0) {
        const { error } = await supabase
          .from("recipe_instructions")
          .insert(instructions);
        if (error) throw error;
      }

      // Delete and re-insert tags
      await supabase.from("recipe_tags").delete().eq("recipe_id", params.id);

      const tags = form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag);

      if (tags.length > 0) {
        const tagRows = tags.map((tag) => ({
          recipe_id: params.id,
          tag_name: tag,
        }));

        const { error } = await supabase.from("recipe_tags").insert(tagRows);
        if (error) throw error;
      }

      router.push(`/recipes/${params.id}`);
    } catch (error) {
      console.error("Failed to save recipe:", error);
      alert("Failed to save recipe");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <p style={{ textAlign: "center", color: "#6b7280" }}>Loading...</p>;
  }

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <Link
          href={`/recipes/${params.id}`}
          style={{
            color: "#10b981",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: "600",
            marginBottom: "16px",
            display: "inline-block",
          }}
        >
          ← Back to recipe
        </Link>
        <h1 style={{ fontSize: "36px", fontWeight: "700", color: "#111827", marginTop: "16px" }}>
          Edit Recipe
        </h1>
      </div>

      <div style={{ maxWidth: "800px" }}>
        {/* Title */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontWeight: "600", marginBottom: "6px" }}>
            Title
          </label>
          <input
            type="text"
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

        {/* Timing */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "20px" }}>
          <div>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "6px", fontSize: "14px" }}>
              Prep Time (min)
            </label>
            <input
              type="number"
              value={form.prepTime}
              onChange={(e) => setForm({ ...form, prepTime: e.target.value })}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "6px", fontSize: "14px" }}>
              Cook Time (min)
            </label>
            <input
              type="number"
              value={form.cookTime}
              onChange={(e) => setForm({ ...form, cookTime: e.target.value })}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "6px", fontSize: "14px" }}>
              Servings
            </label>
            <input
              type="text"
              value={form.servings}
              onChange={(e) => setForm({ ...form, servings: e.target.value })}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>
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
                  const newIngredients = form.ingredients.filter(
                    (_, i) => i !== idx
                  );
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
                value={instruction.step}
                onChange={(e) => {
                  const newInstructions = [...form.instructions];
                  newInstructions[idx].step = e.target.value;
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
                instructions: [...form.instructions, { step: "" }],
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
            href={`/recipes/${params.id}`}
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
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
