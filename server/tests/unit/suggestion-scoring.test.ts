import { describe, expect, it } from "vitest";

import { scoreServing } from "../../src/services/nutrition.service";
import type { WholeFood } from "../../src/constants/whole-foods";

const chicken: WholeFood = {
  name: "Chicken Breast (grilled)",
  servingSize: "6 oz",
  category: "PROTEIN",
  calories: 280,
  protein: 53,
  carbs: 0,
  fat: 6,
};

const banana: WholeFood = {
  name: "Banana",
  servingSize: "1 medium",
  category: "PRODUCE",
  calories: 105,
  protein: 1,
  carbs: 27,
  fat: 0,
};

const fullDay = { calories: 2000, protein: 150, carbs: 200, fat: 60 };

describe("scoreServing", () => {
  it("rejects servings that blow past the meal budget", () => {
    // 3 servings = 840 cal against a 500 cal budget
    expect(scoreServing(chicken, 3, fullDay, 500)).toBe(-1);
  });

  it("ranks protein-dense foods above low-protein foods for the same budget", () => {
    const chickenScore = scoreServing(chicken, 1, fullDay, 900);
    const bananaScore = scoreServing(banana, 1, fullDay, 900);
    expect(chickenScore).toBeGreaterThan(bananaScore);
  });

  it("prefers a serving size that fills more of the budget", () => {
    const oneServing = scoreServing(chicken, 1, fullDay, 900);
    const twoServings = scoreServing(chicken, 2, fullDay, 900);
    expect(twoServings).toBeGreaterThan(oneServing);
  });

  it("penalizes macros the user has already filled", () => {
    const proteinDone = { calories: 800, protein: 0, carbs: 100, fat: 30 };
    const score = scoreServing(chicken, 1, proteinDone, 400);
    // Protein contribution counts against the food when none is needed.
    expect(score).toBeLessThan(scoreServing(chicken, 1, fullDay, 400));
  });
});
