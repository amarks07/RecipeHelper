import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

interface SearchRequest {
  query: string;
  limit?: number;
  offset?: number;
  tags?: string[];
  householdId?: string;
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase configuration" }),
        { status: 500, headers: corsHeaders }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const token = authHeader.replace("Bearer ", "");

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

    const body = (await req.json()) as SearchRequest;
    const limit = body.limit || 20;
    const offset = body.offset || 0;

    const { data: memberships, error: membershipError } = await supabase
      .from("household_members")
      .select("household_id")
      .eq("user_id", user.id);
    if (membershipError) {
      throw new Error(`Failed to load household memberships: ${membershipError.message}`);
    }

    const householdIds = (memberships || []).map((membership) => membership.household_id);
    if (body.householdId && !householdIds.includes(body.householdId)) {
      return new Response(
        JSON.stringify({ error: "You are not a member of this household" }),
        { status: 403, headers: corsHeaders }
      );
    }

    if (householdIds.length === 0) {
      return new Response(
        JSON.stringify({ recipes: [], total: 0, limit, offset }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Full-text search using PostgreSQL trigram search
    let query = supabase
      .from("recipes")
      .select("*", { count: "exact" })
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1);
    query = body.householdId
      ? query.eq("household_id", body.householdId)
      : query.in("household_id", householdIds);

    if (body.query && body.query.trim()) {
      query = query.or(
        `title.ilike.%${body.query}%,description.ilike.%${body.query}%`
      );
    }

    const { data: recipes, error: searchError, count } = await query;

    if (searchError) {
      throw new Error(`Search failed: ${searchError.message}`);
    }

    // If tags filter provided, fetch recipes with those tags
    let filteredRecipes = recipes || [];
    if (body.tags && body.tags.length > 0) {
      const recipeIds = (recipes || []).map((recipe) => recipe.id);
      if (recipeIds.length === 0) {
        filteredRecipes = [];
      } else {
        const { data: taggedRecipeIds, error: tagError } = await supabase
          .from("recipe_tags")
          .select("recipe_id")
          .in("tag_name", body.tags)
          .in("recipe_id", recipeIds);

        if (tagError) {
          throw new Error(`Tag search failed: ${tagError.message}`);
        }
        const taggedIds = new Set(
          taggedRecipeIds?.map((r) => r.recipe_id) || []
        );
        filteredRecipes = filteredRecipes.filter((r) => taggedIds.has(r.id));
      }
    }

    return new Response(
      JSON.stringify({
        recipes: filteredRecipes,
        total: count,
        limit,
        offset,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Search error:", error);
    return new Response(
      JSON.stringify({
        error: "Search failed",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
