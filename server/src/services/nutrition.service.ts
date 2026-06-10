import { prisma } from "../config/database";
import { AppError } from "../middleware/error.middleware";
import {
  toLogDate,
  type CreateFoodLogInput,
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
