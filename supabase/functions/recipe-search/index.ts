import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

interface SearchRequest {
  query: string;
  limit?: number;
  offset?: number;
  tags?: string[];
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

    // Full-text search using PostgreSQL trigram search
    let query = supabase
      .from("recipes")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1);

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
      const { data: taggedRecipeIds } = await supabase
        .from("recipe_tags")
        .select("recipe_id")
        .in("tag_name", body.tags)
        .eq("recipe_id", user.id);

      const taggedIds = new Set(
        taggedRecipeIds?.map((r) => r.recipe_id) || []
      );
      filteredRecipes = filteredRecipes.filter((r) => taggedIds.has(r.id));
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
