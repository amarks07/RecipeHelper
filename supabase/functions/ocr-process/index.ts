import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface OCRRequest {
  imageUrl: string;
  base64Image?: string;
}

interface IngredientResult {
  name: string;
  quantity?: number;
  unit?: string;
  confidence: number;
}

interface OCRResult {
  title: string;
  servings?: string;
  prepTime?: number;
  cookTime?: number;
  ingredients: IngredientResult[];
  instructions: string[];
  confidence: number;
}

// Simple regex patterns for parsing ingredients
const INGREDIENT_PATTERN = /^(?<quantity>[\d.\/\s]+)?\s*(?<unit>\w+)?\s*(?<name>.+)$/i;

// Parse ingredient string using heuristics
function parseIngredient(text: string): { quantity?: number; unit?: string; name: string } {
  const match = text.match(INGREDIENT_PATTERN);
  if (!match || !match.groups) {
    return { name: text };
  }

  const { quantity, unit, name } = match.groups;

  let parsedQuantity: number | undefined;
  if (quantity) {
    // Simple fraction handling: "1/2" -> 0.5, "2" -> 2
    const cleanQty = quantity.trim();
    if (cleanQty.includes("/")) {
      const [num, denom] = cleanQty.split("/").map(Number);
      parsedQuantity = num / denom;
    } else {
      parsedQuantity = parseFloat(cleanQty);
    }
  }

  return {
    quantity: parsedQuantity,
    unit: unit?.toLowerCase(),
    name: name?.trim() || text,
  };
}

// Detect recipe sections in OCR text
function parseSections(text: string): { ingredients: string[]; instructions: string[] } {
  const lines = text.split("\n");

  let currentSection = "unknown";
  const ingredients: string[] = [];
  const instructions: string[] = [];

  const ingredientKeywords = ["ingredient", "ingredients"];
  const instructionKeywords = ["instruction", "instructions", "directions", "method", "steps"];

  for (const line of lines) {
    const lower = line.toLowerCase().trim();

    // Detect section headers
    if (ingredientKeywords.some(k => lower.includes(k))) {
      currentSection = "ingredients";
      continue;
    }
    if (instructionKeywords.some(k => lower.includes(k))) {
      currentSection = "instructions";
      continue;
    }

    // Skip empty lines
    if (!lower) continue;

    // Add to appropriate section
    if (currentSection === "ingredients") {
      ingredients.push(line.trim());
    } else if (currentSection === "instructions") {
      instructions.push(line.trim());
    }
  }

  return { ingredients, instructions };
}

// Extract metadata (prep time, cook time, servings)
function extractMetadata(text: string): { prepTime?: number; cookTime?: number; servings?: string } {
  const result: { prepTime?: number; cookTime?: number; servings?: string } = {};

  // Pattern: "prep time: 15 minutes"
  const prepMatch = text.match(/prep\s*time[:\s]+(\d+)\s*(?:minutes?|mins?)?/i);
  if (prepMatch) result.prepTime = parseInt(prepMatch[1]);

  const cookMatch = text.match(/cook\s*time[:\s]+(\d+)\s*(?:minutes?|mins?)?/i);
  if (cookMatch) result.cookTime = parseInt(cookMatch[1]);

  const servingsMatch = text.match(/(?:servings?|yield)[:\s]+([^\n]+?)(?:\n|$)/i);
  if (servingsMatch) result.servings = servingsMatch[1].trim();

  return result;
}

async function callGoogleVisionAPI(imageUrl: string, apiKey: string): Promise<string> {
  // This would call Google Cloud Vision API in production
  // For now, return placeholder for implementation
  console.log("Would call Google Cloud Vision API for:", imageUrl);

  // Placeholder: In production, this would be:
  // const response = await fetch("https://vision.googleapis.com/v1/images:annotate", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({
  //     requests: [{
  //       image: { source: { imageUri: imageUrl } },
  //       features: [{ type: "TEXT_DETECTION" }]
  //     }]
  //   })
  // });

  return ""; // Would return OCR text from Vision API
}

serve(async (req: Request) => {
  // Handle CORS
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

    const body = (await req.json()) as OCRRequest;

    if (!body.imageUrl && !body.base64Image) {
      return new Response(
        JSON.stringify({ error: "Missing imageUrl or base64Image" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Get Google Cloud Vision API key from Supabase secrets
    const visionApiKey = Deno.env.get("GOOGLE_VISION_API_KEY");

    // Call Google Cloud Vision API (or use placeholder for testing)
    let ocrText = "";
    if (visionApiKey && body.imageUrl) {
      ocrText = await callGoogleVisionAPI(body.imageUrl, visionApiKey);
    } else {
      console.log("Vision API key not configured, returning test OCR text");
      ocrText = "Test OCR output"; // Placeholder for development
    }

    // Parse OCR output into structured format
    const { ingredients: ingredientTexts, instructions } = parseSections(ocrText);
    const metadata = extractMetadata(ocrText);

    // Parse individual ingredients
    const ingredients: IngredientResult[] = ingredientTexts
      .filter(text => text.length > 0)
      .map(text => {
        const parsed = parseIngredient(text);
        return {
          name: parsed.name,
          quantity: parsed.quantity,
          unit: parsed.unit,
          confidence: 0.85, // Default confidence for heuristic parsing
        };
      });

    const result: OCRResult = {
      title: "Untitled Recipe", // Would extract from OCR
      servings: metadata.servings,
      prepTime: metadata.prepTime,
      cookTime: metadata.cookTime,
      ingredients,
      instructions: instructions.filter(s => s.length > 0),
      confidence: 0.82, // Overall confidence score
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("OCR processing error:", error);
    return new Response(
      JSON.stringify({
        error: "OCR processing failed",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
