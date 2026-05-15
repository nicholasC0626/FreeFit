import { z } from "zod";

export const upsertProfileSchema = z.object({
  heightCm: z.number().min(80).max(280),
  weightKg: z.number().min(25).max(350),
  age: z.number().int().min(13).max(100),
  sex: z.enum(["MALE", "FEMALE"]),
  activityLevel: z.enum([
    "SEDENTARY",
    "LIGHTLY_ACTIVE",
    "MODERATELY_ACTIVE",
    "VERY_ACTIVE",
    "EXTREMELY_ACTIVE",
  ]),
  goal: z.enum(["LOSE_FAT", "MAINTAIN", "BUILD_MUSCLE"]),
  experienceLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  preferredUnit: z.enum(["METRIC", "IMPERIAL"]).default("IMPERIAL"),
  gymDaysPerWeek: z.number().int().min(1).max(7).default(4),
});

export type UpsertProfileInput = z.infer<typeof upsertProfileSchema>;
