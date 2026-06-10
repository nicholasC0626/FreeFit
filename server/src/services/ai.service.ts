import { env } from "../config/env";
import { prisma } from "../config/database";
import { AppError } from "../middleware/error.middleware";
import { createProgram } from "./training.service";
import type { ChatInput, GenerateProgramInput } from "../validators/ai.validator";
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

const callGemini = async (
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
