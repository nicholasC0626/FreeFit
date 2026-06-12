import { create } from "zustand";

import { safeStorage } from "../utils/safe-storage";

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

type AuthState = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  hasProfile: boolean;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setHasProfile: (hasProfile: boolean) => void;
  setSession: (payload: { user: User; accessToken: string; refreshToken: string }) => Promise<void>;
  clearSession: () => Promise<void>;
  hydrate: () => Promise<void>;
  updateAccessToken: (accessToken: string) => Promise<void>;
};

const ACCESS_TOKEN_KEY = "auth.accessToken";
const REFRESH_TOKEN_KEY = "auth.refreshToken";
const USER_KEY = "auth.user";
const HAS_PROFILE_KEY = "auth.hasProfile";

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  hasProfile: false,
  isAuthenticated: false,
  isHydrated: false,

  setHasProfile: (hasProfile: boolean) => {
    void safeStorage.setItem(HAS_PROFILE_KEY, JSON.stringify(hasProfile));
    set({ hasProfile });
  },

  setSession: async ({ user, accessToken, refreshToken }) => {
    await Promise.all([
      safeStorage.setItem(ACCESS_TOKEN_KEY, accessToken),
      safeStorage.setItem(REFRESH_TOKEN_KEY, refreshToken),
      safeStorage.setItem(USER_KEY, JSON.stringify(user)),
      safeStorage.setItem(HAS_PROFILE_KEY, JSON.stringify(false)),
    ]);

    set({
      user,
      accessToken,
      refreshToken,
      hasProfile: false,
      isAuthenticated: true,
    });
  },

  clearSession: async () => {
    await Promise.all([
      safeStorage.removeItem(ACCESS_TOKEN_KEY),
      safeStorage.removeItem(REFRESH_TOKEN_KEY),
      safeStorage.removeItem(USER_KEY),
      safeStorage.removeItem(HAS_PROFILE_KEY),
    ]);

    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      hasProfile: false,
      isAuthenticated: false,
    });
  },

  hydrate: async () => {
    const [accessToken, refreshToken, rawUser, rawHasProfile] = await Promise.all([
      safeStorage.getItem(ACCESS_TOKEN_KEY),
      safeStorage.getItem(REFRESH_TOKEN_KEY),
      safeStorage.getItem(USER_KEY),
      safeStorage.getItem(HAS_PROFILE_KEY),
    ]);

    let user: User | null = null;
    if (rawUser) {
      try {
        user = JSON.parse(rawUser) as User;
      } catch {
        await safeStorage.removeItem(USER_KEY);
      }
    }

    const hasProfile = rawHasProfile === "true";
    const isAuthenticated = Boolean(accessToken && refreshToken && user);

    set({
      user: isAuthenticated ? user : null,
      accessToken: isAuthenticated ? accessToken : null,
      refreshToken: isAuthenticated ? refreshToken : null,
      hasProfile: isAuthenticated ? hasProfile : false,
      isAuthenticated,
      isHydrated: true,
    });
  },

  updateAccessToken: async (accessToken: string) => {
    await safeStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    const current = get();

    set({
      accessToken,
      isAuthenticated: Boolean(accessToken && current.refreshToken && current.user),
    });
  },
}));
