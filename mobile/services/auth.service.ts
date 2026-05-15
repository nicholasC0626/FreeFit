import { api } from "./api";
import { useAuthStore } from "../stores/auth.store";

export type RegisterPayload = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

type AuthResponse = {
  user: User;
  tokens: AuthTokens;
};

type RefreshResponse = AuthTokens;

export const register = async (payload: RegisterPayload): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>("/api/auth/register", payload);
  await useAuthStore.getState().setSession({
    user: data.user,
    accessToken: data.tokens.accessToken,
    refreshToken: data.tokens.refreshToken,
  });
  return data;
};

export const login = async (payload: LoginPayload): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>("/api/auth/login", payload);
  await useAuthStore.getState().setSession({
    user: data.user,
    accessToken: data.tokens.accessToken,
    refreshToken: data.tokens.refreshToken,
  });
  return data;
};

export const refreshSession = async (): Promise<RefreshResponse | null> => {
  const { refreshToken, user } = useAuthStore.getState();
  if (!refreshToken || !user) {
    return null;
  }

  try {
    const { data } = await api.post<RefreshResponse>("/api/auth/refresh", {
      refreshToken,
    });

    // Backend rotates both tokens on refresh.
    await useAuthStore.getState().setSession({
      user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });

    return data;
  } catch (error) {
    await useAuthStore.getState().clearSession();
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  try {
    await api.post("/api/auth/logout");
  } finally {
    await useAuthStore.getState().clearSession();
  }
};
