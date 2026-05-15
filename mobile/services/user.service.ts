import { api } from "./api";
import { useAuthStore } from "../stores/auth.store";

export type UserProfilePayload = {
  heightCm: number;
  weightKg: number;
  age: number;
  sex: "MALE" | "FEMALE";
  activityLevel:
    | "SEDENTARY"
    | "LIGHTLY_ACTIVE"
    | "MODERATELY_ACTIVE"
    | "VERY_ACTIVE"
    | "EXTREMELY_ACTIVE";
  goal: "LOSE_FAT" | "MAINTAIN" | "BUILD_MUSCLE";
  experienceLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  preferredUnit: "METRIC" | "IMPERIAL";
  gymDaysPerWeek: number;
};

export type UserProfileResponse = UserProfilePayload & {
  id: string;
  userId: string;
  calorieTarget: number;
  proteinTarget: number;
  carbTarget: number;
  fatTarget: number;
  updatedAt: string;
};

export const getProfile = async (): Promise<UserProfileResponse> => {
  const accessToken = useAuthStore.getState().accessToken;
  const { data } = await api.get<UserProfileResponse>("/api/user/profile", {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
  useAuthStore.getState().setHasProfile(true);
  return data;
};

export const upsertProfile = async (payload: UserProfilePayload): Promise<UserProfileResponse> => {
  const accessToken = useAuthStore.getState().accessToken;
  const { data } = await api.put<UserProfileResponse>("/api/user/profile", payload, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
  useAuthStore.getState().setHasProfile(true);
  return data;
};
