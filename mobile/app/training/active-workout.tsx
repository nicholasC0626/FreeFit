import { useCallback, useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  addExerciseLog,
  completeSession,
  getSession,
  logSet,
  type WorkoutSession,
} from "../../services/training.service";
import { getApiErrorMessage } from "../../utils/api-error";

type SetDraft = {
  weight: string;
  reps: string;
};

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [setDrafts, setSetDrafts] = useState<Record<string, SetDraft>>({});
  const [loggingExerciseId, setLoggingExerciseId] = useState<string | null>(null);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [newMuscleGroup, setNewMuscleGroup] = useState("");
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  const loadSession = useCallback(async () => {
    if (!id) {
      return;
    }
    try {
      const data = await getSession(id);
      setSession(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load the workout."));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  const handleAddExercise = async (exerciseName: string, muscleGroup: string) => {
    if (!session) {
      return;
    }
    if (!exerciseName.trim() || !muscleGroup.trim()) {
      setError("Exercise name and muscle group are required.");
      return;
    }
    setIsAddingExercise(true);
    setError(null);
    try {
      await addExerciseLog(session.id, exerciseName.trim(), muscleGroup.trim());
      setNewExerciseName("");
      setNewMuscleGroup("");
      await loadSession();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not add the exercise."));
    } finally {
      setIsAddingExercise(false);
    }
  };

  const handleLogSet = async (exerciseLogId: string) => {
    if (!session) {
      return;
    }
    const draft = setDrafts[exerciseLogId] ?? { weight: "", reps: "" };
    const weight = Number(draft.weight.trim());
    const reps = Number(draft.reps.trim());
    if (!Number.isFinite(weight) || weight < 0 || !Number.isInteger(reps) || reps <= 0) {
      setError("Enter a valid weight (0+) and reps (1+).");
      return;
    }
    setLoggingExerciseId(exerciseLogId);
    setError(null);
    try {
      const loggedSet = await logSet(session.id, exerciseLogId, { weight, reps });
      if (loggedSet.isPersonalRecord && Platform.OS !== "web") {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
      setSetDrafts((prev) => ({ ...prev, [exerciseLogId]: { weight: draft.weight, reps: "" } }));
      await loadSession();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not log the set."));
    } finally {
      setLoggingExerciseId(null);
    }
  };

  const handleFinish = async () => {
    if (!session) {
      return;
    }
    setIsFinishing(true);
    setError(null);
    try {
      await completeSession(session.id);
      router.back();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not finish the workout."));
      setIsFinishing(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? "Workout not found."}</Text>
      </View>
    );
  }

  const plannedExercises = session.workoutTemplate?.exercises ?? [];
  const loggedNames = new Set(
    session.exerciseLogs.map((log) => log.exerciseName.toLowerCase()),
  );
  const remainingPlanned = plannedExercises.filter(
    (exercise) => !loggedNames.has(exercise.exerciseName.toLowerCase()),
  );

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{session.workoutTemplate?.name ?? "Custom workout"}</Text>
      <Text style={styles.subtitle}>
        Started {new Date(session.startedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
      </Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {session.exerciseLogs.map((log) => {
        const draft = setDrafts[log.id] ?? { weight: "", reps: "" };
        return (
          <View key={log.id} style={styles.exerciseCard}>
            <Text style={styles.exerciseName}>{log.exerciseName}</Text>
            <Text style={styles.exerciseMeta}>{log.muscleGroup}</Text>

            {log.sets.map((set) => (
              <View key={set.id} style={styles.setRow}>
                <Text style={styles.setText}>
                  Set {set.setNumber}: {set.weight} lb x {set.reps}
                </Text>
                {set.isPersonalRecord ? <Text style={styles.prBadge}>PR!</Text> : null}
              </View>
            ))}

            <View style={styles.logRow}>
              <TextInput
                style={[styles.input, styles.logInput]}
                value={draft.weight}
                onChangeText={(text) =>
                  setSetDrafts((prev) => ({ ...prev, [log.id]: { ...draft, weight: text } }))
                }
                placeholder="Weight"
                keyboardType="decimal-pad"
              />
              <TextInput
                style={[styles.input, styles.logInput]}
                value={draft.reps}
                onChangeText={(text) =>
                  setSetDrafts((prev) => ({ ...prev, [log.id]: { ...draft, reps: text } }))
                }
                placeholder="Reps"
                keyboardType="number-pad"
              />
              <Pressable
                style={styles.logButton}
                onPress={() => void handleLogSet(log.id)}
                disabled={loggingExerciseId !== null}
              >
                {loggingExerciseId === log.id ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.logButtonText}>Log set</Text>
                )}
              </Pressable>
            </View>
          </View>
        );
      })}

      {remainingPlanned.length > 0 ? (
        <View style={styles.plannedCard}>
          <Text style={styles.sectionTitle}>Up next (from template)</Text>
          {remainingPlanned.map((exercise) => (
            <View key={exercise.id} style={styles.plannedRow}>
              <View style={styles.plannedInfo}>
                <Text style={styles.setText}>{exercise.exerciseName}</Text>
                <Text style={styles.exerciseMeta}>
                  {exercise.sets} x {exercise.repRangeMin}-{exercise.repRangeMax} reps
                </Text>
              </View>
              <Pressable
                style={styles.smallButton}
                onPress={() => void handleAddExercise(exercise.exerciseName, exercise.muscleGroup)}
                disabled={isAddingExercise}
              >
                <Text style={styles.smallButtonText}>Begin</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.plannedCard}>
        <Text style={styles.sectionTitle}>Add another exercise</Text>
        <TextInput
          style={styles.input}
          value={newExerciseName}
          onChangeText={setNewExerciseName}
          placeholder="Exercise (e.g. Lateral Raise)"
        />
        <TextInput
          style={styles.input}
          value={newMuscleGroup}
          onChangeText={setNewMuscleGroup}
          placeholder="Muscle group (e.g. Shoulders)"
        />
        <Pressable
          style={styles.smallButton}
          onPress={() => void handleAddExercise(newExerciseName, newMuscleGroup)}
          disabled={isAddingExercise}
        >
          {isAddingExercise ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.smallButtonText}>Add exercise</Text>
          )}
        </Pressable>
      </View>

      <Pressable
        style={[styles.finishButton, isFinishing && styles.buttonDisabled]}
        onPress={() => void handleFinish()}
        disabled={isFinishing}
      >
        {isFinishing ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.finishButtonText}>Finish workout</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    color: "#6b7280",
    marginBottom: 16,
  },
  errorText: {
    color: "#dc2626",
    marginBottom: 12,
  },
  exerciseCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "700",
  },
  exerciseMeta: {
    color: "#6b7280",
    fontSize: 12,
    marginBottom: 8,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  setText: {
    fontWeight: "600",
  },
  prBadge: {
    marginLeft: 8,
    backgroundColor: "#fbbf24",
    color: "#78350f",
    fontWeight: "800",
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: "hidden",
  },
  logRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
    alignItems: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
    marginBottom: 8,
  },
  logInput: {
    flex: 1,
    marginBottom: 0,
  },
  logButton: {
    backgroundColor: "#111827",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  logButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
  },
  plannedCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: "700",
    marginBottom: 10,
  },
  plannedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
  },
  plannedInfo: {
    flex: 1,
  },
  smallButton: {
    backgroundColor: "#4f46e5",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
  },
  smallButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
  },
  finishButton: {
    backgroundColor: "#065f46",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  finishButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
