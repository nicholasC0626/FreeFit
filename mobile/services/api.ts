import axios, { AxiosHeaders } from "axios";
import Constants from "expo-constants";

import { useAuthStore } from "../stores/auth.store";

const resolveApiBaseUrl = (): string => {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) {
    return fromEnv;
  }

  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(":")[0];

  if (host) {
    return `http://${host}:3000`;
  }

  // Fallback for local simulator usage.
  return "http://localhost:3000";
};

export const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;
  if (!accessToken) {
    return config;
  }

  const headers = AxiosHeaders.from(config.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  config.headers = headers;

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await useAuthStore.getState().clearSession();
    }

    return Promise.reject(error);
  },
);
