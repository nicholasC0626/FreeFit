/**
 * Curated whole-food database for the suggestion engine.
 * Whole, minimally processed foods only — the app intentionally favors these
 * over packaged products for hitting macro and micronutrient targets.
 * Macros are per single serving as described in servingSize.
 */

export type WholeFoodCategory = "PROTEIN" | "CARB" | "FAT" | "DAIRY" | "PRODUCE";

export type WholeFood = {
  name: string;
  servingSize: string;
  category: WholeFoodCategory;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export const WHOLE_FOODS: WholeFood[] = [
  // ── Lean proteins ──────────────────────────────────────
  { name: "Chicken Breast (grilled)", servingSize: "6 oz", category: "PROTEIN", calories: 280, protein: 53, carbs: 0, fat: 6 },
  { name: "Chicken Thigh (skinless)", servingSize: "6 oz", category: "PROTEIN", calories: 360, protein: 46, carbs: 0, fat: 18 },
  { name: "93/7 Lean Ground Beef", servingSize: "6 oz cooked", category: "PROTEIN", calories: 340, protein: 44, carbs: 0, fat: 17 },
  { name: "Sirloin Steak", servingSize: "6 oz", category: "PROTEIN", calories: 340, protein: 52, carbs: 0, fat: 14 },
  { name: "Salmon Fillet", servingSize: "6 oz", category: "PROTEIN", calories: 350, protein: 38, carbs: 0, fat: 22 },
  { name: "Tilapia Fillet", servingSize: "6 oz", category: "PROTEIN", calories: 220, protein: 44, carbs: 0, fat: 4 },
  { name: "Shrimp", servingSize: "6 oz", category: "PROTEIN", calories: 170, protein: 39, carbs: 1, fat: 1 },
  { name: "Canned Tuna (in water)", servingSize: "1 can (5 oz)", category: "PROTEIN", calories: 120, protein: 27, carbs: 0, fat: 1 },
  { name: "Whole Eggs", servingSize: "3 large", category: "PROTEIN", calories: 210, protein: 18, carbs: 2, fat: 15 },
  { name: "Egg Whites", servingSize: "1 cup", category: "PROTEIN", calories: 125, protein: 26, carbs: 2, fat: 0 },
  { name: "Pork Tenderloin", servingSize: "6 oz", category: "PROTEIN", calories: 290, protein: 48, carbs: 0, fat: 9 },
  { name: "Turkey Breast (roasted)", servingSize: "6 oz", category: "PROTEIN", calories: 230, protein: 51, carbs: 0, fat: 2 },
  { name: "Tofu (firm)", servingSize: "1 cup", category: "PROTEIN", calories: 180, protein: 20, carbs: 4, fat: 11 },

  // ── Dairy ──────────────────────────────────────────────
  { name: "Greek Yogurt (nonfat)", servingSize: "1 cup", category: "DAIRY", calories: 130, protein: 23, carbs: 9, fat: 0 },
  { name: "Cottage Cheese (lowfat)", servingSize: "1 cup", category: "DAIRY", calories: 180, protein: 24, carbs: 8, fat: 5 },
  { name: "Skim Milk", servingSize: "1 cup", category: "DAIRY", calories: 85, protein: 8, carbs: 12, fat: 0 },
  { name: "Whole Milk", servingSize: "1 cup", category: "DAIRY", calories: 150, protein: 8, carbs: 12, fat: 8 },

  // ── Whole-food carbs ───────────────────────────────────
  { name: "White Rice (cooked)", servingSize: "1 cup", category: "CARB", calories: 205, protein: 4, carbs: 45, fat: 0 },
  { name: "Brown Rice (cooked)", servingSize: "1 cup", category: "CARB", calories: 215, protein: 5, carbs: 45, fat: 2 },
  { name: "Oats (dry)", servingSize: "1/2 cup", category: "CARB", calories: 150, protein: 5, carbs: 27, fat: 3 },
  { name: "Quinoa (cooked)", servingSize: "1 cup", category: "CARB", calories: 220, protein: 8, carbs: 39, fat: 4 },
  { name: "Sweet Potato (baked)", servingSize: "1 medium", category: "CARB", calories: 105, protein: 2, carbs: 24, fat: 0 },
  { name: "White Potato (baked)", servingSize: "1 medium", category: "CARB", calories: 160, protein: 4, carbs: 37, fat: 0 },
  { name: "Whole Wheat Bread", servingSize: "2 slices", category: "CARB", calories: 160, protein: 8, carbs: 28, fat: 2 },
  { name: "Whole Wheat Pasta (cooked)", servingSize: "1 cup", category: "CARB", calories: 175, protein: 7, carbs: 37, fat: 1 },
  { name: "Black Beans (cooked)", servingSize: "1 cup", category: "CARB", calories: 225, protein: 15, carbs: 41, fat: 1 },
  { name: "Lentils (cooked)", servingSize: "1 cup", category: "CARB", calories: 230, protein: 18, carbs: 40, fat: 1 },
  { name: "Chickpeas (cooked)", servingSize: "1 cup", category: "CARB", calories: 270, protein: 15, carbs: 45, fat: 4 },

  // ── Fruit & vegetables ─────────────────────────────────
  { name: "Banana", servingSize: "1 medium", category: "PRODUCE", calories: 105, protein: 1, carbs: 27, fat: 0 },
  { name: "Apple", servingSize: "1 medium", category: "PRODUCE", calories: 95, protein: 0, carbs: 25, fat: 0 },
  { name: "Blueberries", servingSize: "1 cup", category: "PRODUCE", calories: 85, protein: 1, carbs: 21, fat: 0 },
  { name: "Orange", servingSize: "1 medium", category: "PRODUCE", calories: 60, protein: 1, carbs: 15, fat: 0 },
  { name: "Broccoli (steamed)", servingSize: "1 cup", category: "PRODUCE", calories: 55, protein: 4, carbs: 11, fat: 0 },
  { name: "Spinach (raw)", servingSize: "2 cups", category: "PRODUCE", calories: 15, protein: 2, carbs: 2, fat: 0 },
  { name: "Green Beans", servingSize: "1 cup", category: "PRODUCE", calories: 35, protein: 2, carbs: 8, fat: 0 },
  { name: "Carrots", servingSize: "1 cup", category: "PRODUCE", calories: 50, protein: 1, carbs: 12, fat: 0 },
  { name: "Bell Pepper", servingSize: "1 medium", category: "PRODUCE", calories: 25, protein: 1, carbs: 6, fat: 0 },

  // ── Healthy fats ───────────────────────────────────────
  { name: "Avocado", servingSize: "1/2 medium", category: "FAT", calories: 120, protein: 1, carbs: 6, fat: 11 },
  { name: "Almonds", servingSize: "1 oz (23 nuts)", category: "FAT", calories: 165, protein: 6, carbs: 6, fat: 14 },
  { name: "Natural Peanut Butter", servingSize: "2 tbsp", category: "FAT", calories: 190, protein: 8, carbs: 7, fat: 16 },
  { name: "Olive Oil", servingSize: "1 tbsp", category: "FAT", calories: 120, protein: 0, carbs: 0, fat: 14 },
  { name: "Walnuts", servingSize: "1 oz", category: "FAT", calories: 185, protein: 4, carbs: 4, fat: 18 },
];
