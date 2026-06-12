import { create } from "zustand";

import { safeStorage } from "../utils/safe-storage";

export type ThemePreference = "system" | "light" | "dark";

type ThemeState = {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  hydrate: () => Promise<void>;
};

const PREFERENCE_KEY = "theme.preference";

const isPreference = (value: string | null): value is ThemePreference =>
  value === "system" || value === "light" || value === "dark";

export const useThemeStore = create<ThemeState>((set) => ({
  preference: "system",

  setPreference: (preference) => {
    void safeStorage.setItem(PREFERENCE_KEY, preference);
    set({ preference });
  },

  hydrate: async () => {
    const stored = await safeStorage.getItem(PREFERENCE_KEY);
    if (isPreference(stored)) {
      set({ preference: stored });
    }
  },
}));
