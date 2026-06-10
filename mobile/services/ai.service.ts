import { api } from "./api";
import { useAuthStore } from "../stores/auth.store";
import type { Program } from "./training.service";

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
    { headers: authHeaders() },
  );
  return data.reply;
};

export const generateAiProgram = async (options?: {
  daysPerWeek?: number;
  focus?: string;
  notes?: string;
}): Promise<Program> => {
  const { data } = await api.post<{ program: Program }>(
    "/api/ai/generate-program",
    options ?? {},
    { headers: authHeaders() },
  );
  return data.program;
};
