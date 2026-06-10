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

export type DateQueryInput = z.infer<typeof dateQuerySchema>;

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
