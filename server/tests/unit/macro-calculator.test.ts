import { describe, expect, it } from "vitest";

import {
  calculateBmr,
  calculateMacros,
  calculateTdee,
} from "../../src/utils/macro-calculator";

describe("calculateBmr", () => {
  it("uses the Mifflin-St Jeor equation for males", () => {
    // 10*80 + 6.25*180 - 5*25 - 5 = 800 + 1125 - 125 - 5 = 1795
    expect(calculateBmr({ weightKg: 80, heightCm: 180, age: 25, sex: "MALE" })).toBe(1795);
  });

  it("uses the female constant (-161)", () => {
    // 10*60 + 6.25*165 - 5*30 - 161 = 600 + 1031.25 - 150 - 161 = 1320.25
    expect(calculateBmr({ weightKg: 60, heightCm: 165, age: 30, sex: "FEMALE" })).toBeCloseTo(
      1320.25,
    );
  });
});

describe("calculateTdee", () => {
  it("multiplies BMR by the activity factor", () => {
    const tdee = calculateTdee({
      weightKg: 80,
      heightCm: 180,
      age: 25,
      sex: "MALE",
      activityLevel: "MODERATELY_ACTIVE",
    });
    expect(tdee).toBeCloseTo(1795 * 1.55);
  });

  it("scales from sedentary (1.2) to extremely active (1.9)", () => {
    const base = { weightKg: 80, heightCm: 180, age: 25, sex: "MALE" as const };
    const sedentary = calculateTdee({ ...base, activityLevel: "SEDENTARY" });
    const extreme = calculateTdee({ ...base, activityLevel: "EXTREMELY_ACTIVE" });
    expect(extreme / sedentary).toBeCloseTo(1.9 / 1.2);
  });
});

describe("calculateMacros", () => {
  it("sets protein to 1g per lb of bodyweight", () => {
    const macros = calculateMacros({ weightKg: 80, tdee: 2700, goal: "BUILD_MUSCLE" });
    expect(macros.protein).toBe(176); // 80 kg ≈ 176 lbs
  });

  it("adds a surplus for muscle building and a deficit for fat loss", () => {
    const build = calculateMacros({ weightKg: 80, tdee: 2700, goal: "BUILD_MUSCLE" });
    const lose = calculateMacros({ weightKg: 80, tdee: 2700, goal: "LOSE_FAT" });
    const maintain = calculateMacros({ weightKg: 80, tdee: 2700, goal: "MAINTAIN" });
    expect(build.calories).toBe(3000);
    expect(lose.calories).toBe(2200);
    expect(maintain.calories).toBe(2700);
  });

  it("never goes below the 1200 calorie floor", () => {
    const macros = calculateMacros({ weightKg: 45, tdee: 1500, goal: "LOSE_FAT" });
    expect(macros.calories).toBe(1200);
  });

  it("macros roughly add back up to the calorie target", () => {
    const macros = calculateMacros({ weightKg: 80, tdee: 2700, goal: "MAINTAIN" });
    const total = macros.protein * 4 + macros.carbs * 4 + macros.fat * 9;
    expect(Math.abs(total - macros.calories)).toBeLessThan(20); // rounding slack
  });
});
