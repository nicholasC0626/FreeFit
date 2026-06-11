import { z } from "zod";

import { prisma } from "../config/database";
import { AppError } from "../middleware/error.middleware";
import { WHOLE_FOODS, type WholeFood } from "../constants/whole-foods";
import { callGemini } from "./ai.service";
import {
  toLogDate,
  type CreateFoodLogInput,
  type FastFoodQueryInput,
  type GroceryListInput,
  type UpdateFoodLogInput,
} from "../validators/nutrition.validator";

type DailySummary = {
  date: string;
  consumed: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  targets: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null;
  remaining: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null;
  entryCount: number;
};

const round1 = (value: number): number => Math.round(value * 10) / 10;

export const getDailySummary = async (userId: string, logDate: Date): Promise<DailySummary> => {
  const [aggregate, profile] = await Promise.all([
    prisma.foodLog.aggregate({
      where: { userId, date: logDate },
      _sum: {
        calories: true,
        protein: true,
        carbs: true,
        fat: true,
      },
      _count: { id: true },
    }),
    prisma.userProfile.findUnique({
      where: { userId },
      select: {
        calorieTarget: true,
        proteinTarget: true,
        carbTarget: true,
        fatTarget: true,
      },
    }),
  ]);

  const consumed = {
    calories: aggregate._sum.calories ?? 0,
    protein: round1(aggregate._sum.protein ?? 0),
    carbs: round1(aggregate._sum.carbs ?? 0),
    fat: round1(aggregate._sum.fat ?? 0),
  };

  const targets = profile
    ? {
        calories: profile.calorieTarget,
        protein: profile.proteinTarget,
        carbs: profile.carbTarget,
        fat: profile.fatTarget,
      }
    : null;

  const remaining = targets
    ? {
        calories: targets.calories - consumed.calories,
        protein: round1(targets.protein - consumed.protein),
        carbs: round1(targets.carbs - consumed.carbs),
        fat: round1(targets.fat - consumed.fat),
      }
    : null;

  return {
    date: logDate.toISOString().slice(0, 10),
    consumed,
    targets,
    remaining,
    entryCount: aggregate._count.id,
  };
};

export const getFoodLogs = async (userId: string, logDate: Date) => {
  return prisma.foodLog.findMany({
    where: { userId, date: logDate },
    orderBy: [{ mealType: "asc" }, { createdAt: "asc" }],
  });
};

/** Removes undefined values so optional fields satisfy exactOptionalPropertyTypes. */
const stripUndefined = <T extends Record<string, unknown>>(
  obj: T,
): { [K in keyof T]?: Exclude<T[K], undefined> } => {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined),
  ) as { [K in keyof T]?: Exclude<T[K], undefined> };
};

export const createFoodLog = async (userId: string, input: CreateFoodLogInput) => {
  return prisma.foodLog.create({
    data: {
      userId,
      date: toLogDate(input.date),
      mealType: input.mealType,
      foodName: input.foodName,
      servingSize: input.servingSize,
      servings: input.servings,
      calories: input.calories,
      protein: input.protein,
      carbs: input.carbs,
      fat: input.fat,
      brand: input.brand ?? null,
      barcode: input.barcode ?? null,
      fiber: input.fiber ?? null,
      sugar: input.sugar ?? null,
      sodium: input.sodium ?? null,
    },
  });
};

const assertOwnedFoodLog = async (userId: string, foodLogId: string) => {
  const existing = await prisma.foodLog.findUnique({
    where: { id: foodLogId },
    select: { userId: true },
  });

  if (!existing || existing.userId !== userId) {
    throw new AppError(404, "Food log entry not found");
  }
};

export const updateFoodLog = async (
  userId: string,
  foodLogId: string,
  input: UpdateFoodLogInput,
) => {
  await assertOwnedFoodLog(userId, foodLogId);

  const { date, ...rest } = input;

  return prisma.foodLog.update({
    where: { id: foodLogId },
    data: {
      ...stripUndefined(rest),
      ...(date ? { date: toLogDate(date) } : {}),
    },
  });
};

export const deleteFoodLog = async (userId: string, foodLogId: string) => {
  await assertOwnedFoodLog(userId, foodLogId);

  await prisma.foodLog.delete({ where: { id: foodLogId } });
};

// ─── Whole-food suggestions ──────────────────────────────

export type FoodSuggestion = {
  name: string;
  servingSize: string;
  servings: number;
  category: WholeFood["category"];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type SuggestionsResult = {
  date: string;
  remaining: { calories: number; protein: number; carbs: number; fat: number } | null;
  suggestions: FoodSuggestion[];
  message: string | null;
};

const SERVING_OPTIONS = [0.5, 1, 1.5, 2, 2.5, 3];

/**
 * Protein is weighted highest (hardest macro to hit), then calories.
 * Servings are sized to one meal (~45% of remaining calories, min 400),
 * not the whole day, so "3x steak" doesn't dominate a fresh morning.
 * Exported for unit tests.
 */
export const scoreServing = (
  food: WholeFood,
  servings: number,
  remaining: { calories: number; protein: number; carbs: number; fat: number },
  mealBudget: number,
): number => {
  const calories = food.calories * servings;
  if (calories > mealBudget * 1.05) {
    return -1;
  }

  const fill = (value: number, target: number): number =>
    target <= 0 ? (value > 0 ? -0.25 : 0) : Math.min(value / target, 1);

  return (
    fill(food.protein * servings, remaining.protein) * 3 +
    fill(calories, mealBudget) * 2 +
    fill(food.carbs * servings, remaining.carbs) * 1 +
    fill(food.fat * servings, remaining.fat) * 1
  );
};

export const getFoodSuggestions = async (
  userId: string,
  logDate: Date,
): Promise<SuggestionsResult> => {
  const summary = await getDailySummary(userId, logDate);

  if (!summary.remaining) {
    return {
      date: summary.date,
      remaining: null,
      suggestions: [],
      message: "Complete your profile to get macro targets and food suggestions.",
    };
  }

  const remaining = {
    calories: summary.remaining.calories,
    protein: Math.max(summary.remaining.protein, 0),
    carbs: Math.max(summary.remaining.carbs, 0),
    fat: Math.max(summary.remaining.fat, 0),
  };

  if (remaining.calories < 50) {
    return {
      date: summary.date,
      remaining: summary.remaining,
      suggestions: [],
      message: "You've hit your calorie target for today. Nice work!",
    };
  }

  const mealBudget = Math.min(remaining.calories, Math.max(400, remaining.calories * 0.45));

  const scored = WHOLE_FOODS.map((food) => {
    let bestServings = 0;
    let bestScore = -1;
    for (const servings of SERVING_OPTIONS) {
      const score = scoreServing(food, servings, remaining, mealBudget);
      if (score > bestScore) {
        bestScore = score;
        bestServings = servings;
      }
    }
    return { food, servings: bestServings, score: bestScore };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  const toSuggestion = (food: WholeFood, servings: number): FoodSuggestion => ({
    name: food.name,
    servingSize: food.servingSize,
    servings,
    category: food.category,
    calories: Math.round(food.calories * servings),
    protein: round1(food.protein * servings),
    carbs: round1(food.carbs * servings),
    fat: round1(food.fat * servings),
  });

  // Keep variety: at most 2 suggestions per category.
  const perCategory = new Map<string, number>();
  const suggestions: FoodSuggestion[] = [];
  for (const { food, servings } of scored) {
    const count = perCategory.get(food.category) ?? 0;
    if (count >= 2) {
      continue;
    }
    perCategory.set(food.category, count + 1);
    suggestions.push(toSuggestion(food, servings));
    if (suggestions.length >= 8) {
      break;
    }
  }

  // Always surface produce for micronutrients — macro scoring alone buries it.
  if (suggestions.length > 0 && !suggestions.some((s) => s.category === "PRODUCE")) {
    const bestProduce = scored.find((entry) => entry.food.category === "PRODUCE");
    if (bestProduce) {
      const produceSuggestion = toSuggestion(bestProduce.food, bestProduce.servings);
      if (suggestions.length >= 8) {
        suggestions[suggestions.length - 1] = produceSuggestion;
      } else {
        suggestions.push(produceSuggestion);
      }
    }
  }

  return {
    date: summary.date,
    remaining: summary.remaining,
    suggestions,
    message: suggestions.length === 0 ? "Not much room left today — a light snack at most." : null,
  };
};

// ─── Fast food options ───────────────────────────────────

export const getFastFoodOptions = async (input: FastFoodQueryInput) => {
  return prisma.fastFoodItem.findMany({
    where: {
      ...(input.maxCalories !== undefined ? { calories: { lte: input.maxCalories } } : {}),
      ...(input.minProtein !== undefined ? { protein: { gte: input.minProtein } } : {}),
      ...(input.restaurant
        ? { restaurant: { equals: input.restaurant, mode: "insensitive" } }
        : {}),
    },
    orderBy: [{ protein: "desc" }, { calories: "asc" }],
    take: 50,
  });
};

// ─── AI grocery list ─────────────────────────────────────

const groceryItemSchema = z.object({
  name: z.string().min(1),
  quantity: z.string().min(1),
  note: z.string().optional(),
});

const grocerySectionSchema = z.object({
  section: z.string().min(1),
  items: z.array(groceryItemSchema).min(1),
});

const groceryListResponseSchema = z.object({
  sections: z.array(grocerySectionSchema).min(1),
  tips: z.array(z.string()).optional(),
});

export type GroceryList = z.infer<typeof groceryListResponseSchema>;

export const generateGroceryList = async (
  userId: string,
  input: GroceryListInput,
): Promise<GroceryList> => {
  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  if (!profile) {
    throw new AppError(400, "Complete your profile first so we know your macro targets.");
  }

  const days = input.days ?? 7;
  const budget = input.budget ?? "MEDIUM";

  const systemPrompt = [
    "You are a nutrition coach building a grocery list. Output JSON only.",
    "STRONGLY prioritize whole, minimally processed foods: fresh meat, fish, eggs, dairy,",
    "fruits, vegetables, rice, oats, potatoes, and legumes. Whole foods are the foundation",
    "for hitting both macronutrient and micronutrient targets. Avoid packaged snacks,",
    "protein bars, and meal-replacement products entirely.",
    "The JSON must match this exact shape:",
    `{
  "sections": [
    {
      "section": "string (one of: Produce, Meat & Fish, Dairy & Eggs, Pantry, Frozen)",
      "items": [
        { "name": "string", "quantity": "string (e.g. 2 lbs)", "note": "string (optional, why/how to use)" }
      ]
    }
  ],
  "tips": ["string (1-3 short meal-prep tips)"]
}`,
    "Quantities must cover the requested number of days. Rotate protein and carb sources for variety.",
    "Output ONLY the JSON object.",
  ].join("\n");

  const userPrompt = [
    `Days to shop for: ${days}`,
    `Budget preference: ${budget}`,
    `Daily targets: ${profile.calorieTarget} cal, ${profile.proteinTarget}g protein, ${profile.carbTarget}g carbs, ${profile.fatTarget}g fat`,
    `Goal: ${profile.goal}`,
    input.dietaryRestrictions ? `Dietary restrictions: ${input.dietaryRestrictions}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const raw = await callGemini(
    systemPrompt,
    [{ role: "user", parts: [{ text: userPrompt }] }],
    true,
  );

  const jsonText = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new AppError(502, "AI returned an invalid grocery list. Please try again.");
  }

  const validated = groceryListResponseSchema.safeParse(parsed);
  if (!validated.success) {
    throw new AppError(502, "AI returned a malformed grocery list. Please try again.");
  }

  return validated.data;
};
