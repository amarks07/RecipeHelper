/**
 * Tests for OCR merging logic
 * Uses Jest for unit testing
 */

import {
  mergeOCRResults,
  findDuplicateIngredients,
  validateMergedRecipe,
} from "../recipe-ocr";

describe("mergeOCRResults", () => {
  it("should merge single OCR result unchanged", () => {
    const input = [
      {
        title: "Pasta",
        ingredients: [{ name: "flour", quantity: 2, unit: "cups" }],
        instructions: ["Mix flour"],
        confidence: 0.9,
      },
    ];

    const result = mergeOCRResults(input);
    expect(result.title).toBe("Pasta");
    expect(result.ingredients.length).toBe(1);
    expect(result.instructions.length).toBe(1);
  });

  it("should deduplicate ingredients from multiple images", () => {
    const input = [
      {
        title: "Cookies",
        ingredients: [
          { name: "flour", quantity: 2, unit: "cups" },
          { name: "butter", quantity: 1, unit: "cup" },
        ],
        instructions: ["Mix"],
        confidence: 0.85,
      },
      {
        title: "Cookies",
        ingredients: [
          { name: "flour", quantity: 2, unit: "cups" }, // Duplicate
          { name: "sugar", quantity: 1, unit: "cup" },
        ],
        instructions: ["Bake"],
        confidence: 0.88,
      },
    ];

    const result = mergeOCRResults(input);
    expect(result.ingredients.length).toBe(3);
    expect(result.ingredients.map((i) => i.name).sort()).toEqual([
      "butter",
      "flour",
      "sugar",
    ]);
  });

  it("should preserve instruction order and remove duplicates", () => {
    const input = [
      {
        title: "Recipe",
        ingredients: [],
        instructions: ["Step 1", "Step 2"],
        confidence: 0.9,
      },
      {
        title: "Recipe",
        ingredients: [],
        instructions: ["Step 2", "Step 3"],
        confidence: 0.9,
      },
    ];

    const result = mergeOCRResults(input);
    expect(result.instructions.length).toBe(3);
    expect(result.instructions).toEqual(["Step 1", "Step 2", "Step 3"]);
  });

  it("should handle empty OCR results gracefully", () => {
    const input = [];
    const result = mergeOCRResults(input);
    expect(result).toBeNull();
  });
});

describe("findDuplicateIngredients", () => {
  it("should find exact duplicate ingredients", () => {
    const ingredients = [
      { name: "flour", quantity: 2, unit: "cups" },
      { name: "flour", quantity: 2, unit: "cups" },
      { name: "butter" },
    ];

    const duplicates = findDuplicateIngredients(ingredients);
    expect(duplicates.has(1)).toBe(true);
    expect(duplicates.has(2)).toBe(false);
  });

  it("should find similar ingredients based on threshold", () => {
    const ingredients = [
      { name: "2 cups flour" },
      { name: "2 cups flour", quantity: 2, unit: "cups" },
    ];

    const duplicates = findDuplicateIngredients(ingredients);
    expect(duplicates.size > 0).toBe(true);
  });
});

describe("validateMergedRecipe", () => {
  it("should identify missing critical fields", () => {
    const merged = {
      title: "",
      ingredients: [],
      instructions: [],
      confidence: 0.5,
    };

    const validation = validateMergedRecipe(merged);
    expect(validation.isValid).toBe(false);
    expect(validation.issues.length > 0).toBe(true);
  });

  it("should pass validation for complete recipe", () => {
    const merged = {
      title: "Complete Recipe",
      ingredients: [{ name: "flour" }],
      instructions: ["Mix"],
      confidence: 0.85,
    };

    const validation = validateMergedRecipe(merged);
    expect(validation.isValid).toBe(true);
    expect(validation.issues.length).toBe(0);
  });
});
