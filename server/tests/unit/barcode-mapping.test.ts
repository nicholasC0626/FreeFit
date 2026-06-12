import { describe, expect, it } from "vitest";

import { mapOffProduct } from "../../src/services/food-api.service";

const servingProduct = {
  product_name: "Peanut Butter",
  brands: "Jif, The J.M. Smucker Company",
  serving_size: "2 tbsp (32 g)",
  nutriments: {
    "energy-kcal_serving": 190,
    "energy-kcal_100g": 594,
    proteins_serving: 7,
    proteins_100g: 21.9,
    carbohydrates_serving: 8,
    fat_serving: 16,
    fiber_serving: 2,
    sugars_serving: 3,
    sodium_serving: 0.14,
  },
};

describe("mapOffProduct", () => {
  it("prefers per-serving values when a serving size is declared", () => {
    const result = mapOffProduct("0051500255162", servingProduct);
    expect(result).not.toBeNull();
    expect(result?.servingSize).toBe("2 tbsp (32 g)");
    expect(result?.calories).toBe(190);
    expect(result?.protein).toBe(7);
    expect(result?.brand).toBe("Jif");
    expect(result?.barcode).toBe("0051500255162");
  });

  it("converts sodium from grams to milligrams", () => {
    const result = mapOffProduct("0051500255162", servingProduct);
    expect(result?.sodium).toBe(140);
  });

  it("falls back to per-100g values when no serving is declared", () => {
    const result = mapOffProduct("3017620422003", {
      product_name: "Nutella",
      nutriments: {
        "energy-kcal_100g": 539,
        proteins_100g: 6.3,
        carbohydrates_100g: 57.5,
        fat_100g: 30.9,
      },
    });
    expect(result?.servingSize).toBe("100 g");
    expect(result?.calories).toBe(539);
    expect(result?.carbs).toBe(57.5);
    expect(result?.brand).toBeNull();
    expect(result?.fiber).toBeNull();
  });

  it("returns null when the product has no calorie data", () => {
    const result = mapOffProduct("123456", {
      product_name: "Mystery item",
      nutriments: { proteins_100g: 5 },
    });
    expect(result).toBeNull();
  });

  it("defaults missing macros to zero and missing name to a placeholder", () => {
    const result = mapOffProduct("123456", {
      nutriments: { "energy-kcal_100g": 100 },
    });
    expect(result?.description).toBe("Unknown product");
    expect(result?.protein).toBe(0);
    expect(result?.carbs).toBe(0);
    expect(result?.fat).toBe(0);
  });
});
