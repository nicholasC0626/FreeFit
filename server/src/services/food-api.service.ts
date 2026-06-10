import { env } from "../config/env";
import { AppError } from "../middleware/error.middleware";

const USDA_SEARCH_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";

type UsdaNutrient = {
  nutrientNumber?: string;
  nutrientName?: string;
  value?: number;
  unitName?: string;
};

type UsdaFood = {
  fdcId: number;
  description: string;
  dataType?: string;
  brandName?: string;
  brandOwner?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  householdServingFullText?: string;
  foodNutrients?: UsdaNutrient[];
};

type UsdaSearchResponse = {
  foods?: UsdaFood[];
};

export type FoodSearchResult = {
  fdcId: number;
  description: string;
  brand: string | null;
  dataType: string | null;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number | null;
  sugar: number | null;
  sodium: number | null;
};

// USDA nutrient numbers
const NUTRIENT = {
  calories: "208",
  protein: "203",
  fat: "204",
  carbs: "205",
  fiber: "291",
  sugar: "269",
  sodium: "307",
} as const;

const getNutrient = (food: UsdaFood, nutrientNumber: string): number | null => {
  const match = food.foodNutrients?.find((n) => n.nutrientNumber === nutrientNumber);
  return typeof match?.value === "number" ? match.value : null;
};

const round1 = (value: number): number => Math.round(value * 10) / 10;

const mapFood = (food: UsdaFood): FoodSearchResult | null => {
  const caloriesPer100 = getNutrient(food, NUTRIENT.calories);
  if (caloriesPer100 === null) {
    return null;
  }

  // USDA search nutrients are per 100g. Scale to the labeled serving when present.
  const hasServing =
    typeof food.servingSize === "number" &&
    food.servingSize > 0 &&
    (food.servingSizeUnit?.toLowerCase() === "g" || food.servingSizeUnit?.toLowerCase() === "ml");
  const scale = hasServing ? (food.servingSize as number) / 100 : 1;

  const servingSize = hasServing
    ? food.householdServingFullText?.trim() ||
      `${food.servingSize}${food.servingSizeUnit?.toLowerCase()}`
    : "100 g";

  const scaled = (per100: number | null): number | null =>
    per100 === null ? null : round1(per100 * scale);

  return {
    fdcId: food.fdcId,
    description: food.description,
    brand: food.brandName?.trim() || food.brandOwner?.trim() || null,
    dataType: food.dataType ?? null,
    servingSize,
    calories: Math.round(caloriesPer100 * scale),
    protein: scaled(getNutrient(food, NUTRIENT.protein)) ?? 0,
    carbs: scaled(getNutrient(food, NUTRIENT.carbs)) ?? 0,
    fat: scaled(getNutrient(food, NUTRIENT.fat)) ?? 0,
    fiber: scaled(getNutrient(food, NUTRIENT.fiber)),
    sugar: scaled(getNutrient(food, NUTRIENT.sugar)),
    sodium: scaled(getNutrient(food, NUTRIENT.sodium)),
  };
};

export const searchFoods = async (query: string): Promise<FoodSearchResult[]> => {
  if (!env.USDA_API_KEY) {
    throw new AppError(503, "Food search is not configured (missing USDA_API_KEY)");
  }

  const params = new URLSearchParams({
    api_key: env.USDA_API_KEY,
    query,
    pageSize: "25",
    dataType: "Branded,Foundation,SR Legacy",
  });

  const response = await fetch(`${USDA_SEARCH_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new AppError(502, `Food database request failed (${response.status})`);
  }

  const data = (await response.json()) as UsdaSearchResponse;

  return (data.foods ?? [])
    .map(mapFood)
    .filter((food): food is FoodSearchResult => food !== null);
};
