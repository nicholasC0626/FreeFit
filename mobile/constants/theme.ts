import { useColorScheme } from "../components/useColorScheme";

/**
 * Semantic color tokens. Every screen builds its styles from these via
 * useTheme(), so the whole app adapts to the phone's light/dark setting.
 */
export type Theme = {
  /** Screen background. */
  background: string;
  /** Raised surfaces: cards, sheets. */
  card: string;
  /** Subtle fills: chips, pills, assistant bubbles. */
  chip: string;
  /** Hairlines, card borders, progress tracks. */
  border: string;
  /** Form input borders. */
  inputBorder: string;
  /** Primary copy. */
  text: string;
  /** Slightly de-emphasized copy. */
  textSecondary: string;
  /** Captions, metadata. */
  textMuted: string;
  /** Placeholders, disabled hints. */
  textFaint: string;
  /** Brand color for text, borders, outlined buttons. */
  primary: string;
  /** Brand color for filled elements with onAccent text (same in both modes). */
  primarySolid: string;
  /** Soft brand-tinted fill behind primary-colored text. */
  primaryTint: string;
  /** Text/icons on primarySolid or cta fills. */
  onAccent: string;
  /** High-emphasis filled buttons (and the user chat bubble). */
  cta: string;
  /** Inverse hero card (calorie summary). */
  hero: string;
  heroText: string;
  heroMuted: string;
  heroFaint: string;
  danger: string;
  /** Soft danger fill + border for error banners. */
  dangerBg: string;
  dangerBorder: string;
  /** Filled danger buttons with onAccent text (same in both modes). */
  dangerSolid: string;
  warn: string;
  link: string;
  /** "Workout in progress" banner. */
  successBg: string;
  successText: string;
  successMuted: string;
};

export const lightTheme: Theme = {
  background: "#ffffff",
  card: "#f9fafb",
  chip: "#f3f4f6",
  border: "#e5e7eb",
  inputBorder: "#d1d5db",
  text: "#111827",
  textSecondary: "#374151",
  textMuted: "#6b7280",
  textFaint: "#9ca3af",
  primary: "#4f46e5",
  primarySolid: "#4f46e5",
  primaryTint: "#eef2ff",
  onAccent: "#ffffff",
  cta: "#111827",
  hero: "#111827",
  heroText: "#ffffff",
  heroMuted: "#9ca3af",
  heroFaint: "#6b7280",
  danger: "#dc2626",
  dangerBg: "#fef2f2",
  dangerBorder: "#fecaca",
  dangerSolid: "#dc2626",
  warn: "#b45309",
  link: "#2563eb",
  successBg: "#065f46",
  successText: "#ffffff",
  successMuted: "#a7f3d0",
};

export const darkTheme: Theme = {
  background: "#111827",
  card: "#1f2937",
  chip: "#374151",
  border: "#374151",
  inputBorder: "#4b5563",
  text: "#f3f4f6",
  textSecondary: "#d1d5db",
  textMuted: "#9ca3af",
  textFaint: "#6b7280",
  primary: "#a5b4fc",
  primarySolid: "#4f46e5",
  primaryTint: "#312e81",
  onAccent: "#ffffff",
  cta: "#4f46e5",
  hero: "#1f2937",
  heroText: "#ffffff",
  heroMuted: "#9ca3af",
  heroFaint: "#6b7280",
  danger: "#f87171",
  dangerBg: "#450a0a",
  dangerBorder: "#7f1d1d",
  dangerSolid: "#dc2626",
  warn: "#fbbf24",
  link: "#60a5fa",
  successBg: "#065f46",
  successText: "#ffffff",
  successMuted: "#a7f3d0",
};

export const useTheme = (): Theme =>
  useColorScheme() === "dark" ? darkTheme : lightTheme;
