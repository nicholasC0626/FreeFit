import { z } from "zod";

const exerciseTemplateSchema = z.object({
  exerciseName: z.string().trim().min(1).max(100),
  muscleGroup: z.string().trim().min(1).max(50),
  sets: z.number().int().min(1).max(20),
  repRangeMin: z.number().int().min(1).max(100),
  repRangeMax: z.number().int().min(1).max(100),
  restSeconds: z.number().int().min(0).max(1800).optional(),
  notes: z.string().trim().max(500).optional(),
});

const workoutTemplateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  exercises: z.array(exerciseTemplateSchema).min(1).max(20),
});

export const createProgramSchema = z.object({
  name: z.string().trim().min(1, "Program name is required").max(100),
  description: z.string().trim().max(500).optional(),
  workouts: z.array(workoutTemplateSchema).min(1, "Add at least one workout").max(7),
});

export const updateProgramSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(500).optional(),
  isActive: z.boolean().optional(),
});

export const startSessionSchema = z.object({
  workoutTemplateId: z.string().trim().min(1).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const completeSessionSchema = z.object({
  notes: z.string().trim().max(500).optional(),
});

export const addExerciseLogSchema = z.object({
  exerciseName: z.string().trim().min(1).max(100),
  muscleGroup: z.string().trim().min(1).max(50),
});

export const logSetSchema = z.object({
  weight: z.number().min(0).max(2000),
  reps: z.number().int().min(0).max(200),
  rpe: z.number().min(1).max(10).optional(),
  setType: z.enum(["WARMUP", "WORKING", "DROP", "FAILURE"]).optional(),
});

export type CreateProgramInput = z.infer<typeof createProgramSchema>;
export type UpdateProgramInput = z.infer<typeof updateProgramSchema>;
export type StartSessionInput = z.infer<typeof startSessionSchema>;
export type CompleteSessionInput = z.infer<typeof completeSessionSchema>;
export type AddExerciseLogInput = z.infer<typeof addExerciseLogSchema>;
export type LogSetInput = z.infer<typeof logSetSchema>;
