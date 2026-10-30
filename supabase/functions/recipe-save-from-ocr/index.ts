import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

interface SaveRecipeRequest {
  ocrImportId: string;
  householdId: string;
  title: string;
  servings?: string;
  prepTime?: number;
  cookTime?: number;
  ingredients: Array<{
    name: string;
    quantity?: number;
    unit?: string;
  }>;
  instructions: string[];
  tags?: string[];
  imageUrl?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase configuration" }),
        { status: 500, headers: corsHeaders }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract user ID from authorization header (JWT)
    const token = authHeader.replace("Bearer ", "");

    const body = (await req.json()) as SaveRecipeRequest;

    if (!body.householdId || !body.title || !body.ingredients || !body.instructions) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: householdId, title, ingredients, instructions" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Get user from session (this is simplified - in production use proper JWT verification)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: corsHeaders }
      );
    }

    const { data: membership, error: membershipError } = await supabase
      .from("household_members")
      .select("household_id")
      .eq("household_id", body.householdId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) {
      throw new Error(`Failed to verify household membership: ${membershipError.message}`);
    }
    if (!membership) {
      return new Response(
        JSON.stringify({ error: "You must belong to this household to save a recipe" }),
        { status: 403, headers: corsHeaders }
      );
    }

    // Create recipe in database
    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .insert({
        user_id: user.id,
        household_id: body.householdId,
        title: body.title,
        servings: body.servings,
        prep_time_minutes: body.prepTime,
        cook_time_minutes: body.cookTime,
        image_url: body.imageUrl,
        recipe_data: {},
      })
      .select()
      .single();

    if (recipeError) {
      throw new Error(`Failed to create recipe: ${recipeError.message}`);
    }

    // Insert ingredients
    const ingredientRows = body.ingredients.map((ing, idx) => ({
      recipe_id: recipe.id,
      ingredient: ing.name,
      quantity: ing.quantity,
      unit: ing.unit,
      order: idx,
    }));

    const { error: ingredientError } = await supabase
      .from("recipe_ingredients")
      .insert(ingredientRows);

    if (ingredientError) {
      throw new Error(`Failed to insert ingredients: ${ingredientError.message}`);
    }

    // Insert instructions
    const instructionRows = body.instructions.map((instr, idx) => ({
      recipe_id: recipe.id,
      step: instr,
      order: idx,
    }));

    const { error: instructionError } = await supabase
      .from("recipe_instructions")
      .insert(instructionRows);

    if (instructionError) {
      throw new Error(`Failed to insert instructions: ${instructionError.message}`);
    }

    // Insert tags if provided
    if (body.tags && body.tags.length > 0) {
      const tagRows = body.tags.map((tag) => ({
        recipe_id: recipe.id,
        tag_name: tag,
      }));

      const { error: tagError } = await supabase
        .from("recipe_tags")
        .insert(tagRows);

      if (tagError) {
        console.warn(`Warning: Failed to insert tags: ${tagError.message}`);
      }
    }

    // Update OCR import record to mark as completed
    if (body.ocrImportId) {
      await supabase
        .from("ocr_imports")
        .update({
          recipe_id: recipe.id,
          processing_status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", body.ocrImportId);
    }

    return new Response(JSON.stringify({ recipe }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 201,
    });
  } catch (error) {
    console.error("Recipe save error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to save recipe",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
