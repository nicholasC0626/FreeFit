import { z } from "zod";

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

export const dateQuerySchema = z.object({
  date: dateString.optional(),
});

export const searchQuerySchema = z.object({
  q: z.string().trim().min(2, "Search query must be at least 2 characters").max(100),
});

export const barcodeParamSchema = z.object({
  code: z.string().trim().regex(/^\d{6,14}$/, "Barcode must be 6-14 digits"),
});

export type DateQueryInput = z.infer<typeof dateQuerySchema>;

export const fastFoodQuerySchema = z.object({
  maxCalories: z.coerce.number().int().min(0).max(5000).optional(),
  minProtein: z.coerce.number().int().min(0).max(300).optional(),
  restaurant: z.string().trim().min(1).max(100).optional(),
});

export const groceryListSchema = z.object({
  days: z.number().int().min(1).max(14).optional(),
  budget: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  dietaryRestrictions: z.string().trim().max(300).optional(),
});

export type FastFoodQueryInput = z.infer<typeof fastFoodQuerySchema>;
export type GroceryListInput = z.infer<typeof groceryListSchema>;

export const createFoodLogSchema = z.object({
  date: dateString.optional(),
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
  foodName: z.string().trim().min(1, "Food name is required").max(200),
  brand: z.string().trim().max(200).optional(),
  barcode: z.string().trim().max(64).optional(),
  servingSize: z.string().trim().min(1, "Serving size is required").max(100),
  servings: z.number().positive().max(100),
  calories: z.number().int().min(0).max(20000),
  protein: z.number().min(0).max(2000),
  carbs: z.number().min(0).max(2000),
  fat: z.number().min(0).max(2000),
  fiber: z.number().min(0).max(2000).optional(),
  sugar: z.number().min(0).max(2000).optional(),
  sodium: z.number().min(0).max(100000).optional(),
});

export const updateFoodLogSchema = createFoodLogSchema.partial();

export type CreateFoodLogInput = z.infer<typeof createFoodLogSchema>;
export type UpdateFoodLogInput = z.infer<typeof updateFoodLogSchema>;

/** Returns a UTC midnight Date for a YYYY-MM-DD string, or today if omitted. */
export const toLogDate = (date?: string): Date => {
  if (date) {
    return new Date(`${date}T00:00:00.000Z`);
  }

  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
};
