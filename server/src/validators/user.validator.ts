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

export const pushTokenSchema = z.object({
  expoPushToken: z.string().trim().min(1, "expoPushToken is required").max(200),
});

const reminderTime = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be in HH:MM format");

export const notificationPrefsSchema = z.object({
  workoutReminders: z.boolean().optional(),
  nutritionReminders: z.boolean().optional(),
  morningReminderTime: reminderTime.optional(),
  eveningReminderTime: reminderTime.optional(),
});

export type PushTokenInput = z.infer<typeof pushTokenSchema>;
export type NotificationPrefsInput = z.infer<typeof notificationPrefsSchema>;
