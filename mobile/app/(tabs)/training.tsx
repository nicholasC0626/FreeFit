import { useCallback, useMemo, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import ErrorBanner from "../../components/ErrorBanner";
import { useTheme, type Theme } from "../../constants/theme";
import {
  deleteProgram,
  listPrograms,
  listSessions,
  startSession,
  type Program,
  type WorkoutSession,
} from "../../services/training.service";
import { getApiErrorMessage } from "../../utils/api-error";

const confirmDelete = (programName: string, onConfirm: () => void) => {
  if (Platform.OS === "web") {
    // eslint-disable-next-line no-alert
    if (window.confirm(`Delete program "${programName}"?`)) {
      onConfirm();
    }
    return;
  }
  Alert.alert("Delete program", `Delete "${programName}"? This cannot be undone.`, [
    { text: "Cancel", style: "cancel" },
    { text: "Delete", style: "destructive", onPress: onConfirm },
  ]);
};

export default function TrainingScreen() {
  const router = useRouter();
  const t = useTheme();
  const styles = useMemo(() => createStyles(t), [t]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startingTemplateId, setStartingTemplateId] = useState<string | null>(null);

  const loadData = useCallback(async (refreshing = false) => {
    if (refreshing) {
      setIsRefreshing(true);
    }
    setError(null);
    try {
      const [programsData, sessionsData] = await Promise.all([listPrograms(), listSessions()]);
      setPrograms(programsData);
      setSessions(sessionsData);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load training data."));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const activeSession = sessions.find((session) => !session.completedAt) ?? null;

  const handleStartWorkout = async (workoutTemplateId?: string) => {
    if (activeSession) {
      router.navigate({ pathname: "/training/active-workout", params: { id: activeSession.id } });
      return;
    }
    setStartingTemplateId(workoutTemplateId ?? "blank");
    setError(null);
    try {
      const session = await startSession(workoutTemplateId);
      router.navigate({ pathname: "/training/active-workout", params: { id: session.id } });
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not start the workout."));
    } finally {
      setStartingTemplateId(null);
    }
  };

  const handleDeleteProgram = (program: Program) => {
    confirmDelete(program.name, () => {
      void (async () => {
        try {
          await deleteProgram(program.id);
          void loadData();
        } catch (err) {
          setError(getApiErrorMessage(err, "Could not delete the program."));
        }
      })();
    });
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={t.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={() => void loadData(true)} />
      }
    >
      <View style={styles.titleRow}>
        <Text style={styles.title}>Training</Text>
        <Pressable onPress={() => router.navigate("/training/progress")}>
          <Text style={styles.linkText}>Progress charts</Text>
        </Pressable>
      </View>

      {error ? <ErrorBanner message={error} onRetry={() => void loadData()} /> : null}

      {activeSession ? (
        <Pressable
          style={styles.activeBanner}
          onPress={() =>
            router.navigate({ pathname: "/training/active-workout", params: { id: activeSession.id } })
          }
        >
          <Text style={styles.activeBannerTitle}>Workout in progress</Text>
          <Text style={styles.activeBannerSub}>
            {activeSession.workoutTemplate?.name ?? "Custom workout"} — tap to resume
          </Text>
        </Pressable>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Programs</Text>
        <Pressable onPress={() => router.navigate("/training/program-editor")}>
          <Text style={styles.linkText}>+ New program</Text>
        </Pressable>
      </View>

      {programs.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            No programs yet. Create one to plan your workouts, or start a blank session below.
          </Text>
        </View>
      ) : (
        programs.map((program) => (
          <View key={program.id} style={styles.programCard}>
            <View style={styles.programHeader}>
              <View style={styles.programInfo}>
                <Text style={styles.programName}>{program.name}</Text>
                {program.description ? (
                  <Text style={styles.programDescription}>{program.description}</Text>
                ) : null}
              </View>
              <Pressable onPress={() => handleDeleteProgram(program)} hitSlop={8}>
                <Text style={styles.deleteText}>Delete</Text>
              </Pressable>
            </View>
            {program.workoutTemplates.map((workout) => (
              <View key={workout.id} style={styles.workoutRow}>
                <View style={styles.workoutInfo}>
                  <Text style={styles.workoutName}>{workout.name}</Text>
                  <Text style={styles.workoutMeta}>
                    {workout.exercises.length}{" "}
                    {workout.exercises.length === 1 ? "exercise" : "exercises"}
                  </Text>
                </View>
                <Pressable
                  style={styles.startButton}
                  onPress={() => void handleStartWorkout(workout.id)}
                  disabled={startingTemplateId !== null}
                >
                  {startingTemplateId === workout.id ? (
                    <ActivityIndicator color={t.onAccent} size="small" />
                  ) : (
                    <Text style={styles.startButtonText}>Start</Text>
                  )}
                </Pressable>
              </View>
            ))}
          </View>
        ))
      )}

      <Pressable
        style={styles.blankButton}
        onPress={() => void handleStartWorkout()}
        disabled={startingTemplateId !== null}
      >
        {startingTemplateId === "blank" ? (
          <ActivityIndicator color={t.primary} size="small" />
        ) : (
          <Text style={styles.blankButtonText}>Start blank workout</Text>
        )}
      </Pressable>

      <Text style={[styles.sectionTitle, styles.historyTitle]}>Recent workouts</Text>
      {sessions.filter((session) => session.completedAt).length === 0 ? (
        <Text style={styles.emptyText}>No completed workouts yet.</Text>
      ) : (
        sessions
          .filter((session) => session.completedAt)
          .slice(0, 10)
          .map((session) => {
            const totalSets = session.exerciseLogs.reduce(
              (total, log) => total + log.sets.length,
              0,
            );
            return (
              <View key={session.id} style={styles.sessionRow}>
                <View>
                  <Text style={styles.workoutName}>
                    {session.workoutTemplate?.name ?? "Custom workout"}
                  </Text>
                  <Text style={styles.workoutMeta}>
                    {session.date.slice(0, 10)} — {session.exerciseLogs.length} exercises,{" "}
                    {totalSets} sets
                  </Text>
                </View>
              </View>
            );
          })
      )}
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
    titleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    title: {
      fontSize: 26,
      fontWeight: "700",
      color: t.text,
    },
    errorText: {
      color: t.danger,
      marginBottom: 12,
    },
    activeBanner: {
      backgroundColor: t.successBg,
      borderRadius: 14,
      padding: 16,
      marginBottom: 16,
    },
    activeBannerTitle: {
      color: t.successText,
      fontWeight: "700",
      fontSize: 15,
    },
    activeBannerSub: {
      color: t.successMuted,
      fontSize: 13,
      marginTop: 2,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: t.text,
    },
    historyTitle: {
      marginTop: 24,
      marginBottom: 10,
    },
    linkText: {
      color: t.primary,
      fontWeight: "700",
    },
    emptyCard: {
      backgroundColor: t.card,
      borderRadius: 14,
      padding: 16,
    },
    emptyText: {
      color: t.textMuted,
    },
    programCard: {
      backgroundColor: t.card,
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
    },
    programHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    programInfo: {
      flex: 1,
      paddingRight: 8,
    },
    programName: {
      fontSize: 16,
      fontWeight: "700",
      color: t.text,
    },
    programDescription: {
      color: t.textMuted,
      fontSize: 13,
      marginTop: 2,
    },
    deleteText: {
      color: t.danger,
      fontWeight: "600",
      fontSize: 13,
    },
    workoutRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.border,
    },
    workoutInfo: {
      flex: 1,
    },
    workoutName: {
      fontWeight: "600",
      color: t.text,
    },
    workoutMeta: {
      color: t.textMuted,
      fontSize: 12,
      marginTop: 2,
    },
    startButton: {
      backgroundColor: t.cta,
      borderRadius: 10,
      paddingHorizontal: 18,
      paddingVertical: 8,
    },
    startButtonText: {
      color: t.onAccent,
      fontWeight: "700",
    },
    blankButton: {
      borderWidth: 1,
      borderColor: t.primary,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: "center",
      marginTop: 4,
    },
    blankButtonText: {
      color: t.primary,
      fontWeight: "700",
    },
    sessionRow: {
      backgroundColor: t.card,
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
    },
  });
