"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { inferRecipeTags } from "@recipehelper/core";
import { parseRecipeText } from "../../utils/parse-recipe-text";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const MAX_SCREENSHOT_SIZE = 8 * 1024 * 1024;
const SCREENSHOT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export default function NewRecipePage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [households, setHouseholds] = useState([]);
  const [householdId, setHouseholdId] = useState("");
  const [loadError, setLoadError] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState("");
  const [sourceError, setSourceError] = useState("");
  const [extractMessage, setExtractMessage] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractProgress, setExtractProgress] = useState(0);
  const [form, setForm] = useState({
    title: "",
    description: "",
    sourceUrl: "",
    prepTime: "",
    cookTime: "",
    servings: "",
    ingredients: [{ name: "", quantity: "", unit: "" }],
    instructions: [""],
  });

  const selectScreenshot = (file) => {
    if (!SCREENSHOT_TYPES.has(file.type)) {
      setSourceError("Choose a JPEG, PNG, or WebP screenshot.");
      return;
    }
    if (file.size > MAX_SCREENSHOT_SIZE) {
      setSourceError("Screenshots must be 8 MB or smaller.");
      return;
    }
    setSourceError("");
    setExtractMessage("");
    setScreenshot(file);
  };

  const applyImportedRecipe = (importedRecipe) => {
    setForm((current) => ({
      ...current,
      title: importedRecipe.title || current.title,
      description: importedRecipe.description || current.description,
      prepTime: importedRecipe.prepTime || current.prepTime,
      cookTime: importedRecipe.cookTime || current.cookTime,
      servings: importedRecipe.servings || current.servings,
      ingredients: importedRecipe.ingredients?.length
        ? importedRecipe.ingredients
        : current.ingredients,
      instructions: importedRecipe.instructions?.length
        ? importedRecipe.instructions
        : current.instructions,
    }));
  };

  const handleExtractRecipe = async () => {
    const sourceUrl = form.sourceUrl.trim();
    if (!sourceUrl && !screenshot) {
      setSourceError("Add a recipe link or screenshot first.");
      return;
    }

    setIsExtracting(true);
    setSourceError("");
    setExtractMessage("");
    setExtractProgress(0);
    let importedFields = 0;

    try {
      if (sourceUrl) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) throw new Error("Sign in to import a recipe link.");

        let parsedUrl;
        try {
          parsedUrl = new URL(sourceUrl);
        } catch {
          throw new Error("Enter a valid http:// or https:// recipe link.");
        }
        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          throw new Error("Enter a valid http:// or https:// recipe link.");
        }

        const response = await fetch("/api/recipe-source", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ url: parsedUrl.href }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Couldn't read that recipe link.");
        applyImportedRecipe(result.recipe);
        importedFields += 1;
      }

      if (screenshot) {
        const { createWorker } = await import("tesseract.js");
        const worker = await createWorker("eng", 1, {
          logger: ({ status, progress }) => {
            if (status === "recognizing text") {
              setExtractProgress(Math.round(progress * 100));
            }
          },
        });
        try {
          const {
            data: { text },
          } = await worker.recognize(screenshot);
          const result = parseRecipeText(text);
          const hasRecipeText =
            result.title ||
            result.ingredients.length > 0 ||
            result.instructions.length > 0;
          if (hasRecipeText) {
            applyImportedRecipe(result);
            importedFields += 1;
          }
        } finally {
          await worker.terminate();
        }
      }

      if (!importedFields) {
        throw new Error("Couldn't find readable recipe details. You can still enter them manually.");
      }
      setExtractMessage("Recipe details filled in. Give them a quick review before saving.");
    } catch (error) {
      console.error("Recipe extraction failed:", error);
      setSourceError(error.message || "Couldn't read the recipe details.");
    } finally {
      setIsExtracting(false);
    }
  };

  useEffect(() => {
    let active = true;
    const loadHouseholds = async () => {
      const { data, error } = await supabase
        .from("households")
        .select("id, name")
        .order("name");
      if (error) {
        if (active) setLoadError(error.message);
        return;
      }
      if (active) {
        setHouseholds(data || []);
        setHouseholdId(data?.[0]?.id || "");
      }
    };
    loadHouseholds();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!screenshot) {
      setScreenshotPreview("");
      return undefined;
    }
    const previewUrl = URL.createObjectURL(screenshot);
    setScreenshotPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [screenshot]);

  useEffect(() => {
    const handlePaste = (event) => {
      const imageItem = Array.from(event.clipboardData?.items || []).find(
        (item) => item.type.startsWith("image/")
      );
      if (!imageItem) return;

      const file = imageItem.getAsFile();
      if (file) {
        event.preventDefault();
        selectScreenshot(file);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

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
    if (!householdId) {
      setLoadError("Choose a household before creating a recipe.");
      return;
    }

    let sourceUrl = null;
    if (form.sourceUrl.trim()) {
      try {
        const parsedSourceUrl = new URL(form.sourceUrl.trim());
        if (!["http:", "https:"].includes(parsedSourceUrl.protocol)) {
          throw new Error("Recipe links must start with http:// or https://.");
        }
        sourceUrl = parsedSourceUrl.href;
      } catch {
        setSourceError("Enter a valid http:// or https:// recipe link.");
        return;
      }
    }

    setIsSaving(true);
    let screenshotPath = null;
    let createdRecipeId = null;
    try {
      if (screenshot) {
        const extensionByType = {
          "image/jpeg": "jpg",
          "image/png": "png",
          "image/webp": "webp",
        };
        screenshotPath = `${session.user.id}/${crypto.randomUUID()}.${extensionByType[screenshot.type]}`;
        const { error: uploadError } = await supabase.storage
          .from("recipe-screenshots")
          .upload(screenshotPath, screenshot, {
            contentType: screenshot.type,
            upsert: false,
          });
        if (uploadError) throw uploadError;
      }

      // Create recipe
      const { data: recipe, error: recipeError } = await supabase
        .from("recipes")
        .insert({
          user_id: session.user.id,
          household_id: householdId,
          title: form.title.trim(),
          description: form.description,
          prep_time_minutes: form.prepTime ? parseInt(form.prepTime, 10) : null,
          cook_time_minutes: form.cookTime ? parseInt(form.cookTime, 10) : null,
          servings: form.servings || null,
          source_url: sourceUrl,
          image_url: screenshotPath,
        })
        .select()
        .single();

      if (recipeError) throw recipeError;
      createdRecipeId = recipe.id;

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
      const tags = inferRecipeTags({
        title: form.title,
        description: form.description,
        ingredients: form.ingredients
          .filter((ingredient) => ingredient.name.trim())
          .map((ingredient) => ingredient.name),
        instructions: form.instructions.filter((instruction) => instruction.trim()),
        prepTime: form.prepTime,
        cookTime: form.cookTime,
      });

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
      if (createdRecipeId) {
        const { error: cleanupError } = await supabase
          .from("recipes")
          .delete()
          .eq("id", createdRecipeId);
        if (cleanupError) {
          console.error("Failed to clean up incomplete recipe:", cleanupError);
        }
      }
      if (screenshotPath) {
        const { error: cleanupError } = await supabase.storage
          .from("recipe-screenshots")
          .remove([screenshotPath]);
        if (cleanupError) {
          console.error("Failed to clean up uploaded screenshot:", cleanupError);
        }
      }
      alert(error.message || "Failed to save recipe");
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
            color: "#16a34a",
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

      {/* Household */}
      <div style={{ marginBottom: "20px" }}>
        {households.length > 1 && (
          <>
            <label htmlFor="recipe-household" style={{ display: "block", fontWeight: "600", marginBottom: "6px", color: "#111827" }}>
              Household
            </label>
            <select
              className="app-select"
              id="recipe-household"
              value={householdId}
              onChange={(event) => setHouseholdId(event.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "1px solid #e8e4d9",
                borderRadius: "8px",
                fontSize: "14px",
                backgroundColor: "#fefdfb",
              }}
            >
              {households.map((household) => (
                <option key={household.id} value={household.id}>{household.name}</option>
              ))}
            </select>
          </>
        )}
        {loadError && <p role="alert" style={{ color: "#b91c1c" }}>{loadError}</p>}
      </div>

      <div style={{ maxWidth: "800px" }}>
        {/* Title */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontWeight: "600", marginBottom: "6px", color: "#111827" }}>
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
              border: "1px solid #e8e4d9",
              borderRadius: "8px",
              fontSize: "14px",
              boxSizing: "border-box",
              backgroundColor: "#fefdfb",
              caretColor: "#111827",
            }}
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontWeight: "600", marginBottom: "6px", color: "#111827" }}>
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
              border: "1px solid #e8e4d9",
              borderRadius: "8px",
              fontSize: "14px",
              boxSizing: "border-box",
              backgroundColor: "#fefdfb",
              caretColor: "#111827",
            }}
          />
        </div>

        <section className="recipe-source-capture" aria-labelledby="recipe-source-heading">
          <h2 id="recipe-source-heading">Keep the original close</h2>
          <p>Save the recipe link or paste a screenshot from your clipboard.</p>
          <label htmlFor="recipe-source-url">Recipe link</label>
          <input
            id="recipe-source-url"
            type="url"
            placeholder="https://..."
            value={form.sourceUrl}
            onChange={(event) => {
              setSourceError("");
              setForm({ ...form, sourceUrl: event.target.value });
            }}
          />
          <button
            type="button"
            onClick={handleExtractRecipe}
            disabled={isExtracting}
            style={{ justifySelf: "start" }}
          >
            {isExtracting
              ? screenshot
                ? `Reading screenshot... ${extractProgress}%`
                : "Reading recipe..."
              : "Read recipe details"}
          </button>
          <p className="recipe-source-hint">
            Link import reads recipe data published by the site. Screenshot OCR runs locally in your browser using free, open-source software.
          </p>
          <label htmlFor="recipe-screenshot">Screenshot</label>
          <input
            id="recipe-screenshot"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) selectScreenshot(file);
              event.target.value = "";
            }}
          />
          <p className="recipe-source-hint">
            You can also paste an image anywhere on this page. JPEG, PNG, or WebP up to 8 MB.
          </p>
          {screenshotPreview && (
            <div className="recipe-screenshot-preview">
              <img src={screenshotPreview} alt="Screenshot to save with this recipe" />
              <button
                type="button"
                onClick={() => setScreenshot(null)}
                aria-label="Remove screenshot"
              >
                Remove screenshot
              </button>
            </div>
          )}
          {sourceError && <p role="alert" className="recipe-source-error">{sourceError}</p>}
          {extractMessage && <p role="status">{extractMessage}</p>}
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          {[
            ["prepTime", "Prep time (minutes)"],
            ["cookTime", "Cook time (minutes)"],
            ["servings", "Servings"],
          ].map(([field, label]) => (
            <label key={field} style={{ display: "grid", gap: "6px", fontWeight: "600" }}>
              {label}
              <input
                type={field === "servings" ? "text" : "number"}
                min={field === "servings" ? undefined : "0"}
                value={form[field]}
                onChange={(event) =>
                  setForm((current) => ({ ...current, [field]: event.target.value }))
                }
                style={{ width: "100%", boxSizing: "border-box" }}
              />
            </label>
          ))}
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
                  caretColor: "#111827",
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
                  caretColor: "#111827",
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
                  caretColor: "#111827",
                }}
              />
              <button
                type="button"
                className="recipe-remove-button"
                aria-label={`Remove ingredient ${idx + 1}`}
                onClick={() => {
                  const newIngredients = form.ingredients.filter((_, i) => i !== idx);
                  setForm({ ...form, ingredients: newIngredients });
                }}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#fee2e2",
                  color: "#991b1b",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "600",
                }}
              >
                ×
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
              backgroundColor: "#f0fdf4",
              color: "#16a34a",
              border: "2px solid #16a34a",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              marginTop: "1rem"
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
            <div key={idx} className="recipe-instruction-row">
              <span className="recipe-instruction-number">
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
                  caretColor: "#111827",
                }}
              />
              <button
                type="button"
                className="recipe-remove-button"
                aria-label={`Remove instruction ${idx + 1}`}
                onClick={() => {
                  const newInstructions = form.instructions.filter(
                    (_, i) => i !== idx
                  );
                  setForm({ ...form, instructions: newInstructions });
                }}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#fee2e2",
                  color: "#991b1b",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "600",
                }}
              >
                ×
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
              backgroundColor: "#f0fdf4",
              color: "#16a34a",
              border: "2px solid #16a34a",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              marginTop: "1rem"
            }}
          >
            + Add Step
          </button>
        </div>

        {/* Automatic Tags */}
        <div style={{ marginBottom: "32px" }}>
          <label style={{ display: "block", fontWeight: "600", marginBottom: "6px", color: "#111827" }}>
            Tags are applied automatically
          </label>
          <p style={{ color: "#6b7280", fontSize: "13px", margin: "0 0 12px" }}>
            We use the recipe title, ingredients, and instructions to identify relevant tags when you save.
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "12px" }}>
          <Link
            href="/recipes"
            style={{
              padding: "12px 28px",
              border: "2px solid #e8e4d9",
              borderRadius: "50px",
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
              padding: "12px 28px",
              backgroundColor: "#16a34a",
              color: "#fff",
              border: "none",
              borderRadius: "50px",
              cursor: "pointer",
              fontWeight: "600",
              opacity: isSaving ? 0.7 : 1,
              transition: "background-color 0.3s",
            }}
            onMouseEnter={(e) => !isSaving && (e.target.style.backgroundColor = "#15803d")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "#16a34a")}
          >
            {isSaving ? "Saving..." : "Create Recipe"}
          </button>
        </div>
      </div>
    </div>
  );
}
