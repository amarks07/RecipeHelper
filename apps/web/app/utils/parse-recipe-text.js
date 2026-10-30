const FRACTIONS = {
  "½": "1/2",
  "¼": "1/4",
  "¾": "3/4",
  "⅓": "1/3",
  "⅔": "2/3",
  "⅛": "1/8",
  "⅜": "3/8",
  "⅝": "5/8",
  "⅞": "7/8",
};

const UNITS = /^(cups?|c\.?|tablespoons?|tbsp\.?|teaspoons?|tsp\.?|ounces?|oz\.?|pounds?|lbs?\.?|grams?|g|kilograms?|kg|milliliters?|millilitres?|ml|liters?|litres?|l|quarts?|qt\.?|pints?|pt\.?|gallons?|gal\.?|cloves?|cans?|packages?|packets?|slices?|pinches?|bunches?|stalks?|sprigs?|pieces?)\b\.?\s*/i;

function parseQuantity(rawQuantity) {
  const normalized = rawQuantity.replace(/([\d])([½¼¾⅓⅔⅛⅜⅝⅞])/g, (_match, whole, fraction) =>
    `${whole} ${FRACTIONS[fraction]}`
  ).replace(/[½¼¾⅓⅔⅛⅜⅝⅞]/g, (fraction) => FRACTIONS[fraction]);
  const parts = normalized.trim().split(/\s+/);
  const fraction = (value) => {
    if (!value.includes("/")) return Number(value) || 0;
    const [numerator, denominator] = value.split("/").map(Number);
    return denominator ? numerator / denominator : 0;
  };
  return String(
    parts.length > 1
      ? Number(parts[0]) + fraction(parts[1])
      : fraction(parts[0])
  );
}

export function parseIngredientLine(line) {
  const cleaned = line.replace(/^[•*-]\s*/, "").trim();
  const quantityMatch = cleaned.match(
    /^((?:\d+\s+)?\d+(?:\/\d+)?|[\d./½¼¾⅓⅔⅛⅜⅝⅞]+)(?:\s+|$)(.*)$/
  );
  const quantity = quantityMatch ? parseQuantity(quantityMatch[1]) : "";
  const rest = quantityMatch?.[2] || cleaned;
  const unitMatch = rest.match(UNITS);
  return {
    quantity,
    unit: unitMatch?.[0]?.trim().replace(/\.$/, "") || "",
    name: (unitMatch ? rest.slice(unitMatch[0].length) : rest).trim() || cleaned,
  };
}

function parseDuration(text, label) {
  const match = text.match(new RegExp(`${label}\\s*time\\s*:?\\s*(\\d+)\\s*(?:minutes?|mins?)?`, "i"));
  return match?.[1] || "";
}

export function parseRecipeText(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  let section = "";
  const ingredients = [];
  const instructions = [];
  const title = lines.find(
    (line) => !/^(ingredients?|instructions?|directions|method|steps?|prep(?:aration)?\s*time|cook\s*time)\b/i.test(line)
  ) || "";

  for (const line of lines) {
    if (/^(ingredients?|what you need)\b/i.test(line)) {
      section = "ingredients";
    } else if (/^(instructions?|directions|method|preparation|steps?)\b/i.test(line)) {
      section = "instructions";
    } else if (/^(notes?|nutrition|prep(?:aration)?\s*time|cook\s*time|servings?|yield)\b/i.test(line)) {
      section = "";
    } else if (section === "ingredients") {
      ingredients.push(parseIngredientLine(line));
    } else if (section === "instructions") {
      instructions.push(line.replace(/^\d+[.)]\s*/, ""));
    }
  }

  const servings = text.match(/(?:servings?|yield)\s*:?\s*([^\r\n]+)/i)?.[1]?.trim() || "";

  return {
    title,
    prepTime: parseDuration(text, "prep"),
    cookTime: parseDuration(text, "cook"),
    servings,
    ingredients,
    instructions,
  };
}
