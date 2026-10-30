const MEAT_PATTERN =
  /\b(beef|bison|buffalo|chicken|duck|goose|ham|lamb|meat|pork|prosciutto|sausage|turkey|veal|venison|bacon|pepperoni|lard|gelatin)\b|\b(?:chicken|beef|bone) (?:stock|broth)\b/;
const FISH_PATTERN =
  /\banchov(?:y|ies)\b|\bcod\b|\bfish\b|\bsalmon\b|\bsardines?\b|\bseafood\b|\bshrimp\b|\btuna\b|\btrout\b|\bcrab\b|\blobster\b|\bshellfish\b|\boyster sauce\b/;
const ANIMAL_PRODUCT_PATTERN =
  /\bbutter\b|\bcasein\b|\bcheese\b|\bcream\b|\bdairy\b|\begg(?:s)?\b|\bghee\b|\bhoney\b|\bgelatin\b|\blard\b|\bmayonnaise\b|\bmilk\b|\boyster sauce\b|\bfish sauce\b|\bwhey\b|\byogurt\b|\byoghurt\b|\b(?:chicken|beef|bone|fish) (?:stock|broth)\b/;
const GLUTEN_PATTERN =
  /\bbarley\b|\bcouscous\b|\bfaro\b|\bkamut\b|\brye\b|\bsemolina\b|\bspelt\b|\bwheat\b|\b(?:all-purpose|bread|cake|pastry|whole[- ]wheat) flour\b/;
const AMBIGUOUS_GLUTEN_PATTERN = /\bflour\b/;
const CHOLESTEROL_FRIENDLY_FOODS =
  /\bapples?\b|\bbarley\b|\bbeans?\b|\bchickpeas?\b|\blentils?\b|\boats?\b|\bpears?\b|\bpsyllium\b/;
const HIGH_SATURATED_FAT_FOODS =
  /\bbacon\b|\bbutter\b|\bcheese\b|\bcoconut (?:cream|milk|oil)\b|\bcream\b|\bghee\b|\blard\b|\bsausage\b|\bshortening\b|\bpalm oil\b/;

function matchesAny(text, pattern) {
  return pattern.test(text);
}

function getNutrition(recipeData = {}) {
  const nutrition = recipeData.nutrition || recipeData.nutritionFacts || recipeData;
  const getValue = (...keys) => {
    for (const key of keys) {
      if (nutrition[key] == null || nutrition[key] === "") continue;
      const value = Number(nutrition[key]);
      if (Number.isFinite(value)) return value;
    }
    return null;
  };

  return {
    carbohydrates: getValue("carbohydrates_g", "carbohydrates", "carbs_g", "carbs"),
    cholesterol: getValue("cholesterol_mg", "cholesterol"),
    fiber: getValue("fiber_g", "fiber"),
    protein: getValue("protein_g", "protein"),
    saturatedFat: getValue("saturated_fat_g", "saturatedFat_g", "saturatedFat"),
    sodium: getValue("sodium_mg", "sodium"),
  };
}

export function inferRecipeTags(recipe = {}) {
  const ingredientNames = (recipe.ingredients || [])
    .map((ingredient) =>
      typeof ingredient === "string" ? ingredient : ingredient?.name || ""
    )
    .filter(Boolean);
  const ingredients = ingredientNames.join(" ").toLowerCase();
  const text = [
    recipe.title,
    recipe.description,
    recipe.instructions?.join?.(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const combined = `${text} ${ingredients}`;
  const tags = [];
  const hasMeat = matchesAny(ingredients, MEAT_PATTERN);
  const hasFish = matchesAny(ingredients, FISH_PATTERN);
  const hasAnimalProducts = matchesAny(ingredients, ANIMAL_PRODUCT_PATTERN);
  const hasExplicitVegan = /\bvegan\b|\bplant[- ]based\b/.test(text);
  const hasExplicitVegetarian = /\bvegetarian\b/.test(text);

  if (ingredientNames.length > 0 && !hasMeat && !hasFish) {
    tags.push("vegetarian");
    if (!hasAnimalProducts) {
      tags.push("vegan", "dairy-free");
    }
  } else if (ingredientNames.length === 0 && hasExplicitVegan) {
    tags.push("vegan", "vegetarian", "dairy-free");
  } else if (ingredientNames.length === 0 && hasExplicitVegetarian) {
    tags.push("vegetarian");
  }

  if (hasFish && !hasMeat) tags.push("pescatarian");

  const nutrition = getNutrition(recipe.recipeData);
  const isKeto =
    /\bketo(?:genic)?\b/.test(combined) ||
    nutrition.carbohydrates !== null && nutrition.carbohydrates <= 10;
  if (isKeto) tags.push("keto");
  if (
    isKeto ||
    /\blow[- ]carb(?:ohydrate)?\b/.test(combined) ||
    nutrition.carbohydrates !== null && nutrition.carbohydrates <= 20
  ) {
    tags.push("low-carb");
  }
  if (/\bpaleo\b/.test(combined)) tags.push("paleo");
  const hasGluten = matchesAny(ingredients, GLUTEN_PATTERN);
  if (
    !hasGluten &&
    (/\bgluten[- ]free\b|\bceliac[- ]friendly\b/.test(text) ||
      ingredientNames.length > 0 &&
        !matchesAny(ingredients, AMBIGUOUS_GLUTEN_PATTERN))
  ) {
    tags.push("gluten-free");
  }
  if (/\bnut[- ]free\b/.test(text) && !/\b(?:almonds?|cashews?|hazelnuts?|macadamias?|peanuts?|pecans?|pistachios?|walnuts?)\b/.test(ingredients)) {
    tags.push("nut-free");
  }
  if (nutrition.protein !== null && nutrition.protein >= 20 || /\bhigh[- ]protein\b/.test(combined)) {
    tags.push("high-protein");
  }
  if (nutrition.sodium !== null && nutrition.sodium <= 140 || /\blow[- ]sodium\b/.test(combined)) {
    tags.push("low-sodium");
  }
  if (
    /\bcholesterol[- ]friendly\b|\bheart[- ]healthy\b/.test(combined) ||
    nutrition.saturatedFat !== null &&
      nutrition.saturatedFat <= 2 &&
      nutrition.fiber !== null &&
      nutrition.fiber >= 3 ||
    ingredientNames.length > 0 &&
      matchesAny(ingredients, CHOLESTEROL_FRIENDLY_FOODS) &&
      !matchesAny(ingredients, HIGH_SATURATED_FAT_FOODS) &&
      !hasMeat
  ) {
    tags.push("cholesterol-friendly");
  }

  if (
    /\bbreakfast\b|\bbrunch\b|\bpancakes?\b|\bwaffles?\b|\boatmeal\b|\bcereal\b|\bomelets?\b|\bomelettes?\b|\bfrittatas?\b|\bsmoothies?\b/.test(text)
  ) {
    tags.push("breakfast");
  }
  if (/\blunch\b/.test(text)) tags.push("lunch");
  if (/\bdinner\b|\bsupper\b/.test(text)) tags.push("dinner");
  if (/\bdessert\b|\bcake\b|\bcookies?\b|\bbrownies?\b|\bpudding\b|\bpie\b|\btart\b|\bice cream\b|\bcheesecake\b|\bfudge\b/.test(text)) {
    tags.push("dessert");
  }

  const times = [recipe.prepTime, recipe.cookTime]
    .filter((time) => time !== null && time !== undefined && time !== "")
    .map(Number);
  const totalTime = times.reduce((total, time) => total + time, 0);
  if (
    /\bquick\b|\beasy\b|\b30[- ]minute\b|\b30 minutes?\b/.test(text) ||
    times.length > 0 &&
      times.every((time) => Number.isFinite(time) && time >= 0) &&
      totalTime <= 30
  ) {
    tags.push("quick & easy");
  }
  if (/\bmeal[- ]prep\b/.test(combined)) tags.push("meal prep");
  if (/\bone[- ]pot\b|\bone[- ]pan\b/.test(combined)) tags.push("one-pot");

  return [...new Set(tags)];
}
