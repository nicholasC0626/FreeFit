import { api } from "./api";
import { useAuthStore } from "../stores/auth.store";
import type { Program } from "./training.service";

// Gemini chat round-trips run ~30-40s; program generation can take longer.
const AI_CHAT_TIMEOUT_MS = 90_000;
const AI_PROGRAM_TIMEOUT_MS = 120_000;

const authHeaders = () => {
  const accessToken = useAuthStore.getState().accessToken;
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export const sendChat = async (messages: ChatMessage[]): Promise<string> => {
  const { data } = await api.post<{ reply: string }>(
    "/api/ai/chat",
    { messages },
    { headers: authHeaders(), timeout: AI_CHAT_TIMEOUT_MS },
  );
  return data.reply;
};

export type ExerciseSuggestion = {
  exerciseName: string;
  setsReps: string;
  coachingCues: string;
  commonMistakes: string;
};

export const reviewAiProgram = async (
  programId: string,
): Promise<{ programName: string; review: string }> => {
  const { data } = await api.post<{ programName: string; review: string }>(
    "/api/ai/review-program",
    { programId },
    { headers: authHeaders(), timeout: AI_CHAT_TIMEOUT_MS },
  );
  return data;
};

export const suggestAiExercises = async (
  muscleGroup: string,
): Promise<ExerciseSuggestion[]> => {
  const { data } = await api.post<{ suggestions: ExerciseSuggestion[] }>(
    "/api/ai/suggest-exercises",
    { muscleGroup },
    { headers: authHeaders(), timeout: AI_CHAT_TIMEOUT_MS },
  );
  return data.suggestions;
};

export const generateAiProgram = async (options?: {
  daysPerWeek?: number;
  focus?: string;
  notes?: string;
}): Promise<Program> => {
  const { data } = await api.post<{ program: Program }>(
    "/api/ai/generate-program",
    options ?? {},
    { headers: authHeaders(), timeout: AI_PROGRAM_TIMEOUT_MS },
  );
  return data.program;
};
