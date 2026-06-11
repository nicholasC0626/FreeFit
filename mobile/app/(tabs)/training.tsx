import { useCallback, useState } from "react";
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
      router.push({ pathname: "/training/active-workout", params: { id: activeSession.id } });
      return;
    }
    setStartingTemplateId(workoutTemplateId ?? "blank");
    setError(null);
    try {
      const session = await startSession(workoutTemplateId);
      router.push({ pathname: "/training/active-workout", params: { id: session.id } });
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
        <ActivityIndicator size="large" />
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
      <Text style={styles.title}>Training</Text>

      {error ? <ErrorBanner message={error} onRetry={() => void loadData()} /> : null}

      {activeSession ? (
        <Pressable
          style={styles.activeBanner}
          onPress={() =>
            router.push({ pathname: "/training/active-workout", params: { id: activeSession.id } })
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
        <Pressable onPress={() => router.push("/training/program-editor")}>
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
                    <ActivityIndicator color="#ffffff" size="small" />
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
          <ActivityIndicator color="#4f46e5" size="small" />
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

const styles = StyleSheet.create({
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
  },
  errorText: {
    color: "#dc2626",
    marginBottom: 12,
  },
  activeBanner: {
    backgroundColor: "#065f46",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  activeBannerTitle: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 15,
  },
  activeBannerSub: {
    color: "#a7f3d0",
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
  },
  historyTitle: {
    marginTop: 24,
    marginBottom: 10,
  },
  linkText: {
    color: "#4f46e5",
    fontWeight: "700",
  },
  emptyCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 14,
    padding: 16,
  },
  emptyText: {
    color: "#6b7280",
  },
  programCard: {
    backgroundColor: "#f9fafb",
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
  },
  programDescription: {
    color: "#6b7280",
    fontSize: 13,
    marginTop: 2,
  },
  deleteText: {
    color: "#dc2626",
    fontWeight: "600",
    fontSize: 13,
  },
  workoutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontWeight: "600",
  },
  workoutMeta: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 2,
  },
  startButton: {
    backgroundColor: "#111827",
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  startButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  blankButton: {
    borderWidth: 1,
    borderColor: "#4f46e5",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  blankButtonText: {
    color: "#4f46e5",
    fontWeight: "700",
  },
  sessionRow: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
});
