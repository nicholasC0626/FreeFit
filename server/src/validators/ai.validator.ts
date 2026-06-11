import { z } from "zod";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(4000),
});

export const chatSchema = z.object({
  messages: z.array(messageSchema).min(1, "At least one message is required").max(40),
});

export const generateProgramSchema = z.object({
  daysPerWeek: z.number().int().min(1).max(7).optional(),
  focus: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const reviewProgramSchema = z.object({
  programId: z.string().trim().min(1, "programId is required"),
});

export const suggestExercisesSchema = z.object({
  muscleGroup: z.string().trim().min(1, "muscleGroup is required").max(50),
  equipment: z.string().trim().max(200).optional(),
});

export type ChatInput = z.infer<typeof chatSchema>;
export type GenerateProgramInput = z.infer<typeof generateProgramSchema>;
export type ReviewProgramInput = z.infer<typeof reviewProgramSchema>;
export type SuggestExercisesInput = z.infer<typeof suggestExercisesSchema>;
