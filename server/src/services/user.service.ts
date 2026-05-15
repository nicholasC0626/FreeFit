import { prisma } from "../config/database";
import { AppError } from "../middleware/error.middleware";
import { calculateMacros, calculateTdee } from "../utils/macro-calculator";
import type { UpsertProfileInput } from "../validators/user.validator";

const getSelect = {
  id: true,
  userId: true,
  heightCm: true,
  weightKg: true,
  age: true,
  sex: true,
  activityLevel: true,
  goal: true,
  experienceLevel: true,
  calorieTarget: true,
  proteinTarget: true,
  carbTarget: true,
  fatTarget: true,
  preferredUnit: true,
  gymDaysPerWeek: true,
  updatedAt: true,
} as const;

export const getUserProfile = async (userId: string) => {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: getSelect,
  });

  if (!profile) {
    throw new AppError(404, "Profile not found");
  }

  return profile;
};

export const upsertUserProfile = async (userId: string, input: UpsertProfileInput) => {
  const tdee = calculateTdee({
    weightKg: input.weightKg,
    heightCm: input.heightCm,
    age: input.age,
    sex: input.sex,
    activityLevel: input.activityLevel,
  });

  const macros = calculateMacros({
    weightKg: input.weightKg,
    tdee,
    goal: input.goal,
  });

  const profile = await prisma.userProfile.upsert({
    where: { userId },
    create: {
      userId,
      heightCm: input.heightCm,
      weightKg: input.weightKg,
      age: input.age,
      sex: input.sex,
      activityLevel: input.activityLevel,
      goal: input.goal,
      experienceLevel: input.experienceLevel,
      preferredUnit: input.preferredUnit,
      gymDaysPerWeek: input.gymDaysPerWeek,
      calorieTarget: macros.calories,
      proteinTarget: macros.protein,
      carbTarget: macros.carbs,
      fatTarget: macros.fat,
    },
    update: {
      heightCm: input.heightCm,
      weightKg: input.weightKg,
      age: input.age,
      sex: input.sex,
      activityLevel: input.activityLevel,
      goal: input.goal,
      experienceLevel: input.experienceLevel,
      preferredUnit: input.preferredUnit,
      gymDaysPerWeek: input.gymDaysPerWeek,
      calorieTarget: macros.calories,
      proteinTarget: macros.protein,
      carbTarget: macros.carbs,
      fatTarget: macros.fat,
    },
    select: getSelect,
  });

  return profile;
};
