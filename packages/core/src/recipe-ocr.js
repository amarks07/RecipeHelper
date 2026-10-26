/**
 * OCR result parsing and intelligent merging for multi-image recipes
 */

// Simple string similarity (0-1) using Levenshtein distance
function stringSimilarity(str1, str2) {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  // Check if one is a substring of the other
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;

  // Levenshtein distance
  const matrix = Array(s2.length + 1).fill(null).map(() =>
    Array(s1.length + 1).fill(0)
  );

  for (let i = 0; i <= s1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= s2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= s2.length; j++) {
    for (let i = 1; i <= s1.length; i++) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }

  const distance = matrix[s2.length][s1.length];
  const maxLen = Math.max(s1.length, s2.length);
  return 1 - distance / maxLen;
}

// Detect duplicate/overlapping ingredients
function findDuplicateIngredients(ingredients, threshold = 0.8) {
  const duplicates = new Set();

  for (let i = 0; i < ingredients.length; i++) {
    if (duplicates.has(i)) continue;

    for (let j = i + 1; j < ingredients.length; j++) {
      if (duplicates.has(j)) continue;

      const similarity = stringSimilarity(
        ingredients[i].name,
        ingredients[j].name
      );

      if (similarity >= threshold) {
        duplicates.add(j);
      }
    }
  }

  return duplicates;
}

// Detect duplicate/overlapping instructions
function findDuplicateInstructions(instructions, threshold = 0.75) {
  const duplicates = new Set();

  for (let i = 0; i < instructions.length; i++) {
    if (duplicates.has(i)) continue;

    for (let j = i + 1; j < instructions.length; j++) {
      if (duplicates.has(j)) continue;

      const similarity = stringSimilarity(instructions[i], instructions[j]);

      if (similarity >= threshold) {
        duplicates.add(j);
      }
    }
  }

  return duplicates;
}

// Merge multiple OCR results from different images
export function mergeOCRResults(ocrResults) {
  if (!ocrResults || ocrResults.length === 0) {
    return null;
  }

  if (ocrResults.length === 1) {
    return ocrResults[0];
  }

  // Use title from first result with content
  const title = ocrResults
    .find((r) => r.title && r.title !== "Untitled Recipe")?.title ||
    "Untitled Recipe";

  // Merge ingredients (deduplicate by name)
  const allIngredients = ocrResults.flatMap((r) => r.ingredients || []);
  const mergedIngredients = [];
  const seenIngredientNames = new Set();

  allIngredients.forEach((ing) => {
    const normalizedName = ing.name.toLowerCase().trim();
    if (!seenIngredientNames.has(normalizedName)) {
      seenIngredientNames.add(normalizedName);
      mergedIngredients.push(ing);
    }
  });

  // Remove detected duplicates
  const duplicateIndices = findDuplicateIngredients(mergedIngredients);
  const deduplicatedIngredients = mergedIngredients.filter(
    (_, idx) => !duplicateIndices.has(idx)
  );

  // Merge instructions (preserve order, deduplicate)
  const allInstructions = ocrResults.flatMap((r) => r.instructions || []);
  const mergedInstructions = [];
  const seenInstructions = new Set();

  allInstructions.forEach((instr) => {
    const normalized = instr.toLowerCase().trim();
    if (!seenInstructions.has(normalized)) {
      seenInstructions.add(normalized);
      mergedInstructions.push(instr);
    }
  });

  // Remove detected duplicates
  const instructionDuplicates = findDuplicateInstructions(mergedInstructions);
  const deduplicatedInstructions = mergedInstructions.filter(
    (_, idx) => !instructionDuplicates.has(idx)
  );

  // Merge metadata
  const servings = ocrResults.find((r) => r.servings)?.servings;
  const prepTime = ocrResults.find((r) => r.prepTime)?.prepTime;
  const cookTime = ocrResults.find((r) => r.cookTime)?.cookTime;

  // Overall confidence is average of all results
  const confidence =
    ocrResults.reduce((sum, r) => sum + r.confidence, 0) /
    ocrResults.length;

  return {
    title,
    servings,
    prepTime,
    cookTime,
    ingredients: deduplicatedIngredients,
    instructions: deduplicatedInstructions,
    confidence,
    // Track which images contributed what
    imageCount: ocrResults.length,
    mergedFrom: ocrResults.map((r, idx) => ({
      index: idx,
      ingredientsContributed: r.ingredients?.length || 0,
      instructionsContributed: r.instructions?.length || 0,
    })),
  };
}

// Detect if an instruction is a continuation (e.g., "3. Mix the flour" followed by "4. ... until smooth")
export function detectInstructionSequence(instructions) {
  return instructions.map((instr, idx) => ({
    text: instr,
    isStep: /^\d+[\.\)]\s/.test(instr),
    stepNumber: parseInt(instr.match(/^\d+/)?.[0] || idx + 1),
    order: idx,
  }));
}

// Reorder instructions based on detected step numbers
export function reorderInstructions(instructions) {
  const sequences = detectInstructionSequence(instructions);
  return sequences
    .sort((a, b) => a.stepNumber - b.stepNumber)
    .map((s) => s.text);
}

// Validate merged result for missing critical fields
export function validateMergedRecipe(merged) {
  const issues = [];

  if (!merged.title || merged.title === "Untitled Recipe") {
    issues.push("Title missing - will need manual input");
  }

  if (!merged.ingredients || merged.ingredients.length === 0) {
    issues.push("No ingredients found - this is critical");
  }

  if (!merged.instructions || merged.instructions.length === 0) {
    issues.push("No instructions found - this is critical");
  }

  if (merged.confidence < 0.7) {
    issues.push("Low confidence OCR - review carefully");
  }

  return {
    isValid: issues.length === 0,
    issues,
    confidence: merged.confidence,
  };
}
