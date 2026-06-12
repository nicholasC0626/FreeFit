import { useColorScheme as useSystemColorScheme } from "react-native";

import { useThemeStore } from "../stores/theme.store";

/** The app-wide color scheme: the user's in-app preference, falling back to the phone setting. */
export function useColorScheme() {
  const system = useSystemColorScheme();
  const preference = useThemeStore((state) => state.preference);
  return preference === "system" ? system : preference;
}
