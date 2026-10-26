// Recipe data codec for serialization/deserialization with migrations
// Follows Barrow's pattern with versioned schema

export const RECIPES_CODEC = {
  version: 1,

  deserialize(json) {
    if (!json) return [];

    const data = typeof json === 'string' ? JSON.parse(json) : json;

    // If data is already migrated, return as-is
    if (data.version === this.version) {
      return data.recipes || [];
    }

    // Handle future migrations here
    return data || [];
  },

  serialize(recipes) {
    return JSON.stringify({
      version: this.version,
      recipes: recipes || [],
    });
  },
};

// Individual recipe structure
export function createRecipe({
  id,
  title,
  description = '',
  imageUrl = null,
  prepTime = null,
  cookTime = null,
  servings = null,
  ingredients = [],
  instructions = [],
  tags = [],
  sourceUrl = null,
  recipeData = {},
  createdAt = new Date().toISOString(),
  updatedAt = new Date().toISOString(),
}) {
  return {
    id,
    title,
    description,
    imageUrl,
    prepTime,
    cookTime,
    servings,
    ingredients, // Array of { name, quantity, unit }
    instructions, // Array of strings
    tags, // Array of strings
    sourceUrl,
    recipeData, // Flexible JSONB-like data
    createdAt,
    updatedAt,
  };
}
