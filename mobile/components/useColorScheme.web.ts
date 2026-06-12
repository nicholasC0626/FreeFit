// NOTE: The default React Native styling doesn't support server rendering,
// so "system" resolves to light on web to keep the static render stable.
import { useThemeStore } from "../stores/theme.store";

export function useColorScheme() {
  const preference = useThemeStore((state) => state.preference);
  return preference === "system" ? "light" : preference;
}
