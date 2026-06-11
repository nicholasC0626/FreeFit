import { z } from "zod";

import { env } from "../config/env";
import { prisma } from "../config/database";
import { AppError } from "../middleware/error.middleware";
import { createProgram } from "./training.service";
import type {
  ChatInput,
  GenerateProgramInput,
  ReviewProgramInput,
  SuggestExercisesInput,
} from "../validators/ai.validator";
import { createProgramSchema } from "../validators/training.validator";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

type GeminiContent = {
  role: "user" | "model";
  parts: { text: string }[];
};

type GeminiResponse = {
  candidates?: {
    content?: { parts?: { text?: string }[] };
  }[];
  error?: { message?: string };
};

export const callGemini = async (
  systemPrompt: string,
  contents: GeminiContent[],
  jsonMode = false,
): Promise<string> => {
  if (!env.GEMINI_API_KEY) {
    throw new AppError(503, "AI is not configured yet (missing GEMINI_API_KEY)");
  }

  const response = await fetch(`${GEMINI_BASE}/${env.GEMINI_MODEL}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
        ...(jsonMode ? { responseMimeType: "application/json" } : {}),
      },
    }),
  });

  const data = (await response.json()) as GeminiResponse;

  if (!response.ok) {
    const message = data.error?.message ?? `AI request failed (${response.status})`;
    throw new AppError(response.status === 429 ? 429 : 502, message);
  }

  const text = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new AppError(502, "AI returned an empty response");
  }

  return text;
};

const getProfileContext = async (userId: string): Promise<string> => {
  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  if (!profile) {
    return "The user has not completed their profile yet.";
  }
  return [
    `Age: ${profile.age}, Sex: ${profile.sex}`,
    `Height: ${profile.heightCm} cm, Weight: ${profile.weightKg} kg`,
    `Activity level: ${profile.activityLevel}, Goal: ${profile.goal}`,
    `Experience: ${profile.experienceLevel}, Gym days/week: ${profile.gymDaysPerWeek}`,
    `Daily targets: ${profile.calorieTarget} cal, ${profile.proteinTarget}g protein, ${profile.carbTarget}g carbs, ${profile.fatTarget}g fat`,
  ].join("\n");
};

export const chatWithTrainer = async (userId: string, input: ChatInput): Promise<string> => {
  const profileContext = await getProfileContext(userId);

  const systemPrompt = [
    "You are FreeFit's AI personal trainer: a friendly, evidence-based fitness and nutrition coach.",
    "Keep answers concise (under 200 words), practical, and encouraging.",
    "Never give medical advice; suggest seeing a professional for injuries or health conditions.",
    "",
    "User profile:",
    profileContext,
  ].join("\n");

  const contents: GeminiContent[] = input.messages.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  }));

  return callGemini(systemPrompt, contents);
};

export const generateProgram = async (userId: string, input: GenerateProgramInput) => {
  const profileContext = await getProfileContext(userId);

  const systemPrompt = [
    "You are an expert strength coach. Generate a lifting program as JSON only.",
    "The JSON must match this exact shape:",
    `{
  "name": "string (program name)",
  "description": "string (1-2 sentence overview)",
  "workouts": [
    {
      "name": "string (e.g. Push Day)",
      "exercises": [
        {
          "exerciseName": "string",
          "muscleGroup": "string (e.g. Chest)",
          "sets": number (1-20),
          "repRangeMin": number,
          "repRangeMax": number
        }
      ]
    }
  ]
}`,
    "Rules: one workout per training day, 4-7 exercises per workout, compound lifts first.",
    "Match the user's experience level and number of gym days. Output ONLY the JSON object.",
  ].join("\n");

  const userPrompt = [
    "User profile:",
    profileContext,
    input.daysPerWeek ? `Requested days per week: ${input.daysPerWeek}` : "",
    input.focus ? `Requested focus: ${input.focus}` : "",
    input.notes ? `Additional notes: ${input.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const raw = await callGemini(
    systemPrompt,
    [{ role: "user", parts: [{ text: userPrompt }] }],
    true,
  );

  // Strip markdown fences if the model added them despite JSON mode.
  const jsonText = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new AppError(502, "AI returned an invalid program. Please try again.");
  }

  const validated = createProgramSchema.safeParse(parsed);
  if (!validated.success) {
    throw new AppError(502, "AI returned a malformed program. Please try again.");
  }

  const program = await createProgram(userId, validated.data);

  return prisma.program.update({
    where: { id: program.id },
    data: { isAiGenerated: true },
    include: {
      workoutTemplates: {
        orderBy: { order: "asc" },
        include: { exercises: { orderBy: { order: "asc" } } },
      },
    },
  });
};

export const reviewProgram = async (
  userId: string,
  input: ReviewProgramInput,
): Promise<{ programName: string; review: string }> => {
  const program = await prisma.program.findUnique({
    where: { id: input.programId },
    include: {
      workoutTemplates: {
        orderBy: { order: "asc" },
        include: { exercises: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (!program || program.userId !== userId) {
    throw new AppError(404, "Program not found");
  }
  if (program.workoutTemplates.every((workout) => workout.exercises.length === 0)) {
    throw new AppError(400, "This program has no exercises to review yet");
  }

  const profileContext = await getProfileContext(userId);

  const programText = program.workoutTemplates
    .map((workout) => {
      const exerciseLines = workout.exercises.map(
        (exercise) =>
          `- ${exercise.exerciseName} (${exercise.muscleGroup}): ${exercise.sets} sets of ${exercise.repRangeMin}-${exercise.repRangeMax} reps, rest ${exercise.restSeconds}s`,
      );
      return [`${workout.name}:`, ...exerciseLines].join("\n");
    })
    .join("\n\n");

  const systemPrompt = [
    "You are an expert strength coach reviewing a user's lifting program.",
    "Analyze it for these issues, in this order:",
    "1. Redundancy: exercises that overlap with no added benefit",
    "2. Imbalance: push/pull ratio, quad/hamstring ratio",
    "3. Missing muscle groups: anything undertrained or skipped entirely",
    "4. Volume issues: under 10 or over 20 weekly hard sets per muscle group",
    "5. Exercise order: compounds should come before isolations",
    "For each issue found, name the exercises involved and give a concrete fix.",
    "If an area is fine, say so in one short sentence. End with a 1-2 sentence overall verdict.",
    "Keep the whole review under 350 words. Use plain text with simple numbered sections, no markdown tables.",
    "",
    "User profile:",
    profileContext,
  ].join("\n");

  const userPrompt = [`Program: ${program.name}`, "", programText].join("\n");

  const review = await callGemini(systemPrompt, [{ role: "user", parts: [{ text: userPrompt }] }]);

  return { programName: program.name, review };
};

const exerciseSuggestionSchema = z.object({
  exerciseName: z.string().min(1),
  setsReps: z.string().min(1),
  coachingCues: z.string().min(1),
  commonMistakes: z.string().min(1),
});

const suggestionsResponseSchema = z.object({
  suggestions: z.array(exerciseSuggestionSchema).min(1).max(8),
});

export type ExerciseSuggestion = z.infer<typeof exerciseSuggestionSchema>;

export const suggestExercises = async (
  userId: string,
  input: SuggestExercisesInput,
): Promise<ExerciseSuggestion[]> => {
  const profileContext = await getProfileContext(userId);

  const systemPrompt = [
    "You are an expert strength coach. Suggest the 5 best exercises for the requested muscle group as JSON only.",
    "Rank by EMG activation, strength curve match, stretch under load, and suitability for the user's experience level.",
    "The JSON must match this exact shape:",
    `{
  "suggestions": [
    {
      "exerciseName": "string",
      "setsReps": "string (e.g. 3 sets of 8-12)",
      "coachingCues": "string (1-2 key technique cues)",
      "commonMistakes": "string (the most common mistake and how to avoid it)"
    }
  ]
}`,
    "Output ONLY the JSON object.",
    "",
    "User profile:",
    profileContext,
  ].join("\n");

  const userPrompt = [
    `Muscle group: ${input.muscleGroup}`,
    input.equipment ? `Available equipment: ${input.equipment}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const raw = await callGemini(
    systemPrompt,
    [{ role: "user", parts: [{ text: userPrompt }] }],
    true,
  );

  const jsonText = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new AppError(502, "AI returned invalid suggestions. Please try again.");
  }

  const validated = suggestionsResponseSchema.safeParse(parsed);
  if (!validated.success) {
    throw new AppError(502, "AI returned malformed suggestions. Please try again.");
  }

  return validated.data.suggestions;
};
