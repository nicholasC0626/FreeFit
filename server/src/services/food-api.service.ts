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

const OFF_PRODUCT_URL = "https://world.openfoodfacts.org/api/v2/product";

type OffProduct = {
  product_name?: string;
  brands?: string;
  serving_size?: string;
  nutriments?: Record<string, number | string | undefined>;
};

type OffProductResponse = {
  status?: number;
  product?: OffProduct;
};

export type BarcodeFoodResult = {
  barcode: string;
  description: string;
  brand: string | null;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number | null;
  sugar: number | null;
  sodium: number | null;
};

const offNutrient = (product: OffProduct, key: string): number | null => {
  const value = product.nutriments?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
};

export const mapOffProduct = (barcode: string, product: OffProduct): BarcodeFoodResult | null => {
  // Prefer per-serving values when the label declares a serving, else fall back to per 100g.
  const perServing = offNutrient(product, "energy-kcal_serving");
  const servingSize = product.serving_size?.trim();
  const useServing = perServing !== null && !!servingSize;

  const suffix = useServing ? "_serving" : "_100g";
  const calories = useServing ? perServing : offNutrient(product, "energy-kcal_100g");
  if (calories === null) {
    return null;
  }

  const nutrient = (name: string): number | null => {
    const value = offNutrient(product, `${name}${suffix}`);
    return value === null ? null : round1(value);
  };

  // Open Food Facts reports sodium in grams; the app stores milligrams (USDA convention).
  const sodiumGrams = offNutrient(product, `sodium${suffix}`);

  return {
    barcode,
    description: product.product_name?.trim() || "Unknown product",
    brand: product.brands?.trim().split(",")[0]?.trim() || null,
    servingSize: useServing ? (servingSize as string) : "100 g",
    calories: Math.round(calories),
    protein: nutrient("proteins") ?? 0,
    carbs: nutrient("carbohydrates") ?? 0,
    fat: nutrient("fat") ?? 0,
    fiber: nutrient("fiber"),
    sugar: nutrient("sugars"),
    sodium: sodiumGrams === null ? null : Math.round(sodiumGrams * 1000),
  };
};

export const lookupBarcode = async (barcode: string): Promise<BarcodeFoodResult> => {
  const response = await fetch(`${OFF_PRODUCT_URL}/${barcode}.json`, {
    headers: {
      // Open Food Facts asks API consumers to identify themselves.
      "User-Agent": "FreeFit/1.0 (lecruzer@gmail.com)",
    },
  });

  if (response.status === 404) {
    throw new AppError(404, "No product found for this barcode");
  }
  if (!response.ok) {
    throw new AppError(502, `Barcode lookup failed (${response.status})`);
  }

  const data = (await response.json()) as OffProductResponse;
  if (data.status !== 1 || !data.product) {
    throw new AppError(404, "No product found for this barcode");
  }

  const result = mapOffProduct(barcode, data.product);
  if (!result) {
    throw new AppError(404, "Product found but it has no nutrition data");
  }

  return result;
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
