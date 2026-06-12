import { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import ErrorBanner from "../../components/ErrorBanner";
import { useTheme, type Theme } from "../../constants/theme";
import { logout } from "../../services/auth.service";
import {
  getNotificationPrefs,
  updateNotificationPrefs,
  type NotificationPrefs,
} from "../../services/notification.service";
import { getProfile, type UserProfileResponse } from "../../services/user.service";
import { useAuthStore } from "../../stores/auth.store";
import { useThemeStore, type ThemePreference } from "../../stores/theme.store";
import { getApiErrorMessage } from "../../utils/api-error";

const ACTIVITY_LABELS: Record<string, string> = {
  SEDENTARY: "Sedentary",
  LIGHTLY_ACTIVE: "Lightly active",
  MODERATELY_ACTIVE: "Moderately active",
  VERY_ACTIVE: "Very active",
  EXTREMELY_ACTIVE: "Extremely active",
};

const GOAL_LABELS: Record<string, string> = {
  LOSE_FAT: "Lose fat",
  MAINTAIN: "Maintain",
  BUILD_MUSCLE: "Build muscle",
};

const EXPERIENCE_LABELS: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

const kgToLb = (kg: number): number => Math.round(kg * 2.20462 * 10) / 10;

const cmToFeetInches = (cm: number): string => {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}'${inches}"`;
};

const useStyles = () => {
  const t = useTheme();
  return useMemo(() => createStyles(t), [t]);
};

const APPEARANCE_OPTIONS: { label: string; value: ThemePreference }[] = [
  { label: "System", value: "system" },
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
];

function InfoRow({ label, value }: { label: string; value: string }) {
  const styles = useStyles();
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const t = useTheme();
  const styles = useStyles();
  const user = useAuthStore((state) => state.user);
  const themePreference = useThemeStore((state) => state.preference);
  const setThemePreference = useThemeStore((state) => state.setPreference);
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const loadProfile = useCallback(async () => {
    setError(null);
    try {
      const data = await getProfile();
      setProfile(data);
      setPrefs(await getNotificationPrefs());
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load your profile."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const togglePref = async (key: "workoutReminders" | "nutritionReminders", value: boolean) => {
    if (!prefs) {
      return;
    }
    const previous = prefs;
    setPrefs({ ...prefs, [key]: value });
    try {
      setPrefs(await updateNotificationPrefs({ [key]: value }));
    } catch (err) {
      setPrefs(previous);
      setError(getApiErrorMessage(err, "Could not update notification settings."));
    }
  };

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      // ProtectedRouteGuard redirects to login once the session clears.
    } catch {
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={t.primary} />
      </View>
    );
  }

  const isImperial = profile?.preferredUnit === "IMPERIAL";

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.card}>
        <Text style={styles.name}>
          {user ? `${user.firstName} ${user.lastName}` : "Account"}
        </Text>
        <Text style={styles.email}>{user?.email ?? ""}</Text>
      </View>

      {error ? <ErrorBanner message={error} onRetry={() => void loadProfile()} /> : null}

      {profile ? (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Daily targets</Text>
            <InfoRow label="Calories" value={`${profile.calorieTarget} cal`} />
            <InfoRow label="Protein" value={`${Math.round(profile.proteinTarget)} g`} />
            <InfoRow label="Carbs" value={`${Math.round(profile.carbTarget)} g`} />
            <InfoRow label="Fat" value={`${Math.round(profile.fatTarget)} g`} />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Stats</Text>
            <InfoRow
              label="Height"
              value={isImperial ? cmToFeetInches(profile.heightCm) : `${profile.heightCm} cm`}
            />
            <InfoRow
              label="Weight"
              value={isImperial ? `${kgToLb(profile.weightKg)} lb` : `${profile.weightKg} kg`}
            />
            <InfoRow label="Age" value={`${profile.age}`} />
            <InfoRow label="Sex" value={profile.sex === "MALE" ? "Male" : "Female"} />
            <InfoRow
              label="Activity"
              value={ACTIVITY_LABELS[profile.activityLevel] ?? profile.activityLevel}
            />
            <InfoRow label="Goal" value={GOAL_LABELS[profile.goal] ?? profile.goal} />
            <InfoRow
              label="Experience"
              value={EXPERIENCE_LABELS[profile.experienceLevel] ?? profile.experienceLevel}
            />
            <InfoRow label="Gym days / week" value={`${profile.gymDaysPerWeek}`} />
          </View>
        </>
      ) : null}

      {prefs ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notifications</Text>
          <View style={styles.switchRow}>
            <View style={styles.switchLabelGroup}>
              <Text style={styles.switchLabel}>Workout reminders</Text>
              <Text style={styles.switchSub}>
                {prefs.morningReminderTime} kickoff, follow-ups if you haven't trained
              </Text>
            </View>
            <Switch
              value={prefs.workoutReminders}
              onValueChange={(value) => void togglePref("workoutReminders", value)}
            />
          </View>
          <View style={styles.switchRow}>
            <View style={styles.switchLabelGroup}>
              <Text style={styles.switchLabel}>Nutrition reminders</Text>
              <Text style={styles.switchSub}>A nudge if you forget to log your meals</Text>
            </View>
            <Switch
              value={prefs.nutritionReminders}
              onValueChange={(value) => void togglePref("nutritionReminders", value)}
            />
          </View>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Appearance</Text>
        <View style={styles.appearanceRow}>
          {APPEARANCE_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={[
                styles.appearanceChip,
                themePreference === option.value && styles.appearanceChipSelected,
              ]}
              onPress={() => setThemePreference(option.value)}
            >
              <Text
                style={[
                  styles.appearanceChipText,
                  themePreference === option.value && styles.appearanceChipTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.appearanceHint}>
          System follows your phone's light/dark setting.
        </Text>
      </View>

      <Pressable
        style={[styles.logoutButton, isLoggingOut && styles.buttonDisabled]}
        onPress={() => void handleLogout()}
        disabled={isLoggingOut}
      >
        {isLoggingOut ? (
          <ActivityIndicator color={t.danger} />
        ) : (
          <Text style={styles.logoutText}>Log out</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    container: {
      padding: 20,
      paddingBottom: 40,
    },
    title: {
      fontSize: 26,
      fontWeight: "700",
      marginBottom: 16,
      color: t.text,
    },
    card: {
      backgroundColor: t.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    },
    name: {
      fontSize: 18,
      fontWeight: "700",
      color: t.text,
    },
    email: {
      color: t.textMuted,
      marginTop: 2,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 10,
      color: t.text,
    },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 6,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.border,
    },
    infoLabel: {
      color: t.textMuted,
    },
    infoValue: {
      fontWeight: "600",
      color: t.text,
    },
    errorText: {
      color: t.danger,
      marginBottom: 12,
    },
    switchRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.border,
    },
    switchLabelGroup: {
      flex: 1,
      paddingRight: 12,
    },
    switchLabel: {
      fontWeight: "600",
      color: t.text,
    },
    switchSub: {
      color: t.textMuted,
      fontSize: 12,
      marginTop: 2,
    },
    appearanceRow: {
      flexDirection: "row",
      gap: 8,
    },
    appearanceChip: {
      flex: 1,
      backgroundColor: t.chip,
      borderRadius: 10,
      paddingVertical: 9,
      alignItems: "center",
    },
    appearanceChipSelected: {
      backgroundColor: t.primarySolid,
    },
    appearanceChipText: {
      color: t.textSecondary,
      fontWeight: "600",
      fontSize: 13,
    },
    appearanceChipTextSelected: {
      color: t.onAccent,
    },
    appearanceHint: {
      color: t.textFaint,
      fontSize: 12,
      marginTop: 8,
    },
    logoutButton: {
      borderWidth: 1,
      borderColor: t.danger,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
    },
    logoutText: {
      color: t.danger,
      fontWeight: "700",
    },
    buttonDisabled: {
      opacity: 0.6,
    },
  });
