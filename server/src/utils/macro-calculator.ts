type Sex = "MALE" | "FEMALE";
type ActivityLevel =
  | "SEDENTARY"
  | "LIGHTLY_ACTIVE"
  | "MODERATELY_ACTIVE"
  | "VERY_ACTIVE"
  | "EXTREMELY_ACTIVE";
type FitnessGoal = "LOSE_FAT" | "MAINTAIN" | "BUILD_MUSCLE";

export type TdeeInput = {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: Sex;
  activityLevel: ActivityLevel;
};

export type MacroInput = {
  weightKg: number;
  tdee: number;
  goal: FitnessGoal;
};

export type MacroTargets = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  SEDENTARY: 1.2,
  LIGHTLY_ACTIVE: 1.375,
  MODERATELY_ACTIVE: 1.55,
  VERY_ACTIVE: 1.725,
  EXTREMELY_ACTIVE: 1.9,
};

const GOAL_CALORIE_ADJUSTMENT: Record<FitnessGoal, number> = {
  LOSE_FAT: -500,
  MAINTAIN: 0,
  BUILD_MUSCLE: 300,
};

const KG_TO_LBS = 2.20462;

const round = (value: number): number => Math.round(value);

export const calculateBmr = ({ weightKg, heightCm, age, sex }: Omit<TdeeInput, "activityLevel">): number => {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "MALE" ? base - 5 : base - 161;
};

export const calculateTdee = (input: TdeeInput): number => {
  const bmr = calculateBmr(input);
  return bmr * ACTIVITY_MULTIPLIERS[input.activityLevel];
};

export const calculateMacros = ({ weightKg, tdee, goal }: MacroInput): MacroTargets => {
  const calories = Math.max(1200, round(tdee + GOAL_CALORIE_ADJUSTMENT[goal]));

  // 1g protein per lb bodyweight
  const protein = round(weightKg * KG_TO_LBS);

  // Goal-based fat ratio in calorie percentage
  const fatRatio = goal === "LOSE_FAT" ? 0.25 : 0.28;
  const fat = round((calories * fatRatio) / 9);

  const proteinCalories = protein * 4;
  const fatCalories = fat * 9;
  const carbCalories = Math.max(0, calories - proteinCalories - fatCalories);
  const carbs = round(carbCalories / 4);

  return {
    calories,
    protein,
    carbs,
    fat,
  };
};
