import { api } from "./api";
import { useAuthStore } from "../stores/auth.store";

const authHeaders = () => {
  const accessToken = useAuthStore.getState().accessToken;
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
};

export type SetType = "WARMUP" | "WORKING" | "DROP" | "FAILURE";

export type ExerciseTemplate = {
  id: string;
  exerciseName: string;
  muscleGroup: string;
  sets: number;
  repRangeMin: number;
  repRangeMax: number;
  restSeconds: number;
  notes: string | null;
  order: number;
};

export type WorkoutTemplate = {
  id: string;
  name: string;
  dayOfWeek: number | null;
  order: number;
  exercises: ExerciseTemplate[];
};

export type Program = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isAiGenerated: boolean;
  createdAt: string;
  workoutTemplates: WorkoutTemplate[];
};

export type SetLog = {
  id: string;
  setNumber: number;
  weight: number;
  reps: number;
  rpe: number | null;
  setType: SetType;
  isPersonalRecord: boolean;
};

export type ExerciseLog = {
  id: string;
  exerciseName: string;
  muscleGroup: string;
  order: number;
  sets: SetLog[];
};

export type WorkoutSession = {
  id: string;
  date: string;
  startedAt: string;
  completedAt: string | null;
  notes: string | null;
  workoutTemplate: WorkoutTemplate | null;
  exerciseLogs: ExerciseLog[];
};

export type NewExercise = {
  exerciseName: string;
  muscleGroup: string;
  sets: number;
  repRangeMin: number;
  repRangeMax: number;
};

export type NewProgram = {
  name: string;
  description?: string;
  workouts: { name: string; exercises: NewExercise[] }[];
};

export const listPrograms = async (): Promise<Program[]> => {
  const { data } = await api.get<{ programs: Program[] }>("/api/training/programs", {
    headers: authHeaders(),
  });
  return data.programs;
};

export const createProgram = async (payload: NewProgram): Promise<Program> => {
  const { data } = await api.post<{ program: Program }>("/api/training/programs", payload, {
    headers: authHeaders(),
  });
  return data.program;
};

export const deleteProgram = async (id: string): Promise<void> => {
  await api.delete(`/api/training/programs/${id}`, { headers: authHeaders() });
};

export const listSessions = async (): Promise<WorkoutSession[]> => {
  const { data } = await api.get<{ sessions: WorkoutSession[] }>("/api/training/sessions", {
    headers: authHeaders(),
  });
  return data.sessions;
};

export const getSession = async (id: string): Promise<WorkoutSession> => {
  const { data } = await api.get<{ session: WorkoutSession }>(`/api/training/sessions/${id}`, {
    headers: authHeaders(),
  });
  return data.session;
};

export const startSession = async (workoutTemplateId?: string): Promise<WorkoutSession> => {
  const { data } = await api.post<{ session: WorkoutSession }>(
    "/api/training/sessions",
    workoutTemplateId ? { workoutTemplateId } : {},
    { headers: authHeaders() },
  );
  return data.session;
};

export const completeSession = async (id: string, notes?: string): Promise<WorkoutSession> => {
  const { data } = await api.put<{ session: WorkoutSession }>(
    `/api/training/sessions/${id}`,
    notes ? { notes } : {},
    { headers: authHeaders() },
  );
  return data.session;
};

export const addExerciseLog = async (
  sessionId: string,
  exerciseName: string,
  muscleGroup: string,
): Promise<ExerciseLog> => {
  const { data } = await api.post<{ exerciseLog: ExerciseLog }>(
    `/api/training/sessions/${sessionId}/exercises`,
    { exerciseName, muscleGroup },
    { headers: authHeaders() },
  );
  return data.exerciseLog;
};

export const logSet = async (
  sessionId: string,
  exerciseLogId: string,
  payload: { weight: number; reps: number; rpe?: number; setType?: SetType },
): Promise<SetLog> => {
  const { data } = await api.post<{ set: SetLog }>(
    `/api/training/sessions/${sessionId}/exercises/${exerciseLogId}/sets`,
    payload,
    { headers: authHeaders() },
  );
  return data.set;
};

export type ExerciseHistoryEntry = {
  sessionDate: string;
  sets: {
    setNumber: number;
    weight: number;
    reps: number;
    rpe: number | null;
    setType: SetType;
    isPersonalRecord: boolean;
  }[];
};

/** Last 30 sessions for an exercise, newest first. */
export const getExerciseHistory = async (
  exerciseName: string,
): Promise<ExerciseHistoryEntry[]> => {
  const { data } = await api.get<{ history: ExerciseHistoryEntry[] }>(
    `/api/training/exercise-history/${encodeURIComponent(exerciseName)}`,
    { headers: authHeaders() },
  );
  return data.history;
};

export type PersonalRecord = {
  exerciseName: string;
  muscleGroup: string;
  weight: number;
  reps: number;
  date: string;
};

export const getPersonalRecords = async (): Promise<PersonalRecord[]> => {
  const { data } = await api.get<{ prs: PersonalRecord[] }>("/api/training/prs", {
    headers: authHeaders(),
  });
  return data.prs;
};
