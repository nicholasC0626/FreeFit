import { api } from "./api";
import { useAuthStore } from "../stores/auth.store";

type MacroSet = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type DailySummary = {
  date: string;
  consumed: MacroSet;
  targets: MacroSet | null;
  remaining: MacroSet | null;
  entryCount: number;
};

const authHeaders = () => {
  const accessToken = useAuthStore.getState().accessToken;
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
};

export const getDailySummary = async (date?: string): Promise<DailySummary> => {
  const { data } = await api.get<DailySummary>("/api/nutrition/summary", {
    headers: authHeaders(),
    params: date ? { date } : undefined,
  });
  return data;
};

export type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";

export type FoodLog = {
  id: string;
  date: string;
  mealType: MealType;
  foodName: string;
  brand: string | null;
  servingSize: string;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number | null;
  sugar: number | null;
  sodium: number | null;
  createdAt: string;
};

export const getFoodLogs = async (date?: string): Promise<FoodLog[]> => {
  const { data } = await api.get<{ logs: FoodLog[] }>("/api/nutrition/log", {
    headers: authHeaders(),
    params: date ? { date } : undefined,
  });
  return data.logs;
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

export const searchFoods = async (query: string): Promise<FoodSearchResult[]> => {
  const { data } = await api.get<{ results: FoodSearchResult[] }>("/api/nutrition/search", {
    headers: authHeaders(),
    params: { q: query },
  });
  return data.results;
};

export type FoodLogPayload = {
  date?: string;
  mealType: MealType;
  foodName: string;
  brand?: string;
  servingSize: string;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export const createFoodLog = async (payload: FoodLogPayload): Promise<FoodLog> => {
  const { data } = await api.post<{ log: FoodLog }>("/api/nutrition/log", payload, {
    headers: authHeaders(),
  });
  return data.log;
};

export const updateFoodLog = async (
  id: string,
  payload: Partial<FoodLogPayload>,
): Promise<FoodLog> => {
  const { data } = await api.put<{ log: FoodLog }>(`/api/nutrition/log/${id}`, payload, {
    headers: authHeaders(),
  });
  return data.log;
};

export const deleteFoodLog = async (id: string): Promise<void> => {
  await api.delete(`/api/nutrition/log/${id}`, {
    headers: authHeaders(),
  });
};

export type FoodSuggestion = {
  name: string;
  servingSize: string;
  servings: number;
  category: "PROTEIN" | "CARB" | "FAT" | "DAIRY" | "PRODUCE";
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type SuggestionsResponse = {
  date: string;
  remaining: MacroSet | null;
  suggestions: FoodSuggestion[];
  message: string | null;
};

export const getFoodSuggestions = async (date?: string): Promise<SuggestionsResponse> => {
  const { data } = await api.get<SuggestionsResponse>("/api/nutrition/suggestions", {
    headers: authHeaders(),
    params: date ? { date } : undefined,
  });
  return data;
};

export type FastFoodItem = {
  id: string;
  restaurant: string;
  itemName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  category: string;
};

export const getFastFoodOptions = async (filters: {
  maxCalories?: number;
  minProtein?: number;
}): Promise<FastFoodItem[]> => {
  const { data } = await api.get<{ items: FastFoodItem[] }>("/api/nutrition/fast-food", {
    headers: authHeaders(),
    params: filters,
  });
  return data.items;
};

export type GroceryList = {
  sections: {
    section: string;
    items: { name: string; quantity: string; note?: string }[];
  }[];
  tips?: string[];
};

// Grocery generation goes through Gemini, so it needs the long AI timeout.
const GROCERY_TIMEOUT_MS = 90_000;

export const generateGroceryList = async (options: {
  days?: number;
  budget?: "LOW" | "MEDIUM" | "HIGH";
  dietaryRestrictions?: string;
}): Promise<GroceryList> => {
  const { data } = await api.post<{ groceryList: GroceryList }>(
    "/api/nutrition/grocery-list",
    options,
    { headers: authHeaders(), timeout: GROCERY_TIMEOUT_MS },
  );
  return data.groceryList;
};
