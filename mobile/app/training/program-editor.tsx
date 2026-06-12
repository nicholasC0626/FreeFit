import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useTheme, type Theme } from "../../constants/theme";
import { createProgram, type NewExercise } from "../../services/training.service";
import { getApiErrorMessage } from "../../utils/api-error";

type ExerciseDraft = {
  exerciseName: string;
  muscleGroup: string;
  sets: string;
  repRangeMin: string;
  repRangeMax: string;
};

type WorkoutDraft = {
  name: string;
  exercises: ExerciseDraft[];
};

const emptyExercise = (): ExerciseDraft => ({
  exerciseName: "",
  muscleGroup: "",
  sets: "3",
  repRangeMin: "8",
  repRangeMax: "12",
});

const emptyWorkout = (): WorkoutDraft => ({
  name: "",
  exercises: [emptyExercise()],
});

const parsePositiveInt = (value: string): number | null => {
  const parsed = Number(value.trim());
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

export default function ProgramEditorScreen() {
  const router = useRouter();
  const t = useTheme();
  const styles = useMemo(() => createStyles(t), [t]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [workouts, setWorkouts] = useState<WorkoutDraft[]>([emptyWorkout()]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const updateWorkout = (index: number, patch: Partial<WorkoutDraft>) => {
    setWorkouts((prev) => prev.map((w, i) => (i === index ? { ...w, ...patch } : w)));
  };

  const updateExercise = (workoutIndex: number, exerciseIndex: number, patch: Partial<ExerciseDraft>) => {
    setWorkouts((prev) =>
      prev.map((workout, wi) =>
        wi === workoutIndex
          ? {
              ...workout,
              exercises: workout.exercises.map((exercise, ei) =>
                ei === exerciseIndex ? { ...exercise, ...patch } : exercise,
              ),
            }
          : workout,
      ),
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Program name is required.");
      return;
    }

    const payloadWorkouts: { name: string; exercises: NewExercise[] }[] = [];
    for (let wi = 0; wi < workouts.length; wi += 1) {
      const workout = workouts[wi];
      if (!workout.name.trim()) {
        setError(`Workout ${wi + 1} needs a name (e.g. Push Day).`);
        return;
      }
      const exercises: NewExercise[] = [];
      for (let ei = 0; ei < workout.exercises.length; ei += 1) {
        const exercise = workout.exercises[ei];
        if (!exercise.exerciseName.trim() || !exercise.muscleGroup.trim()) {
          setError(`Exercise ${ei + 1} in "${workout.name}" needs a name and muscle group.`);
          return;
        }
        const sets = parsePositiveInt(exercise.sets);
        const repMin = parsePositiveInt(exercise.repRangeMin);
        const repMax = parsePositiveInt(exercise.repRangeMax);
        if (!sets || !repMin || !repMax || repMin > repMax) {
          setError(`Check sets/reps for "${exercise.exerciseName}" (min reps must be <= max).`);
          return;
        }
        exercises.push({
          exerciseName: exercise.exerciseName.trim(),
          muscleGroup: exercise.muscleGroup.trim(),
          sets,
          repRangeMin: repMin,
          repRangeMax: repMax,
        });
      }
      payloadWorkouts.push({ name: workout.name.trim(), exercises });
    }

    setIsSaving(true);
    setError(null);
    try {
      await createProgram({
        name: name.trim(),
        ...(description.trim() ? { description: description.trim() } : {}),
        workouts: payloadWorkouts,
      });
      router.back();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not save the program."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Text style={styles.label}>Program name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g. Push Pull Legs"
        placeholderTextColor={t.textFaint}
        editable={!isSaving}
      />

      <Text style={styles.label}>Description (optional)</Text>
      <TextInput
        style={styles.input}
        value={description}
        onChangeText={setDescription}
        placeholder="e.g. 3-day hypertrophy split"
        placeholderTextColor={t.textFaint}
        editable={!isSaving}
      />

      {workouts.map((workout, workoutIndex) => (
        <View key={workoutIndex} style={styles.workoutCard}>
          <View style={styles.workoutHeader}>
            <Text style={styles.workoutTitle}>Workout {workoutIndex + 1}</Text>
            {workouts.length > 1 ? (
              <Pressable
                onPress={() => setWorkouts((prev) => prev.filter((_, i) => i !== workoutIndex))}
                hitSlop={8}
              >
                <Text style={styles.removeText}>Remove</Text>
              </Pressable>
            ) : null}
          </View>

          <TextInput
            style={styles.input}
            value={workout.name}
            onChangeText={(text) => updateWorkout(workoutIndex, { name: text })}
            placeholder="Workout name (e.g. Push Day)"
            placeholderTextColor={t.textFaint}
            editable={!isSaving}
          />

          {workout.exercises.map((exercise, exerciseIndex) => (
            <View key={exerciseIndex} style={styles.exerciseCard}>
              <View style={styles.workoutHeader}>
                <Text style={styles.exerciseTitle}>Exercise {exerciseIndex + 1}</Text>
                {workout.exercises.length > 1 ? (
                  <Pressable
                    onPress={() =>
                      updateWorkout(workoutIndex, {
                        exercises: workout.exercises.filter((_, i) => i !== exerciseIndex),
                      })
                    }
                    hitSlop={8}
                  >
                    <Text style={styles.removeText}>Remove</Text>
                  </Pressable>
                ) : null}
              </View>
              <TextInput
                style={styles.input}
                value={exercise.exerciseName}
                onChangeText={(text) =>
                  updateExercise(workoutIndex, exerciseIndex, { exerciseName: text })
                }
                placeholder="Exercise (e.g. Bench Press)"
                placeholderTextColor={t.textFaint}
                editable={!isSaving}
              />
              <TextInput
                style={styles.input}
                value={exercise.muscleGroup}
                onChangeText={(text) =>
                  updateExercise(workoutIndex, exerciseIndex, { muscleGroup: text })
                }
                placeholder="Muscle group (e.g. Chest)"
                placeholderTextColor={t.textFaint}
                editable={!isSaving}
              />
              <View style={styles.row}>
                <View style={styles.rowItem}>
                  <Text style={styles.smallLabel}>Sets</Text>
                  <TextInput
                    style={styles.input}
                    value={exercise.sets}
                    onChangeText={(text) => updateExercise(workoutIndex, exerciseIndex, { sets: text })}
                    keyboardType="number-pad"
                    editable={!isSaving}
                  />
                </View>
                <View style={styles.rowItem}>
                  <Text style={styles.smallLabel}>Min reps</Text>
                  <TextInput
                    style={styles.input}
                    value={exercise.repRangeMin}
                    onChangeText={(text) =>
                      updateExercise(workoutIndex, exerciseIndex, { repRangeMin: text })
                    }
                    keyboardType="number-pad"
                    editable={!isSaving}
                  />
                </View>
                <View style={styles.rowItem}>
                  <Text style={styles.smallLabel}>Max reps</Text>
                  <TextInput
                    style={styles.input}
                    value={exercise.repRangeMax}
                    onChangeText={(text) =>
                      updateExercise(workoutIndex, exerciseIndex, { repRangeMax: text })
                    }
                    keyboardType="number-pad"
                    editable={!isSaving}
                  />
                </View>
              </View>
            </View>
          ))}

          <Pressable
            style={styles.secondaryButton}
            onPress={() =>
              updateWorkout(workoutIndex, { exercises: [...workout.exercises, emptyExercise()] })
            }
            disabled={isSaving}
          >
            <Text style={styles.secondaryButtonText}>+ Add exercise</Text>
          </Pressable>
        </View>
      ))}

      <Pressable
        style={styles.secondaryButton}
        onPress={() => setWorkouts((prev) => [...prev, emptyWorkout()])}
        disabled={isSaving}
      >
        <Text style={styles.secondaryButtonText}>+ Add workout day</Text>
      </Pressable>

      <Pressable
        style={[styles.saveButton, isSaving && styles.buttonDisabled]}
        onPress={() => void handleSave()}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator color={t.onAccent} />
        ) : (
          <Text style={styles.saveButtonText}>Save program</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    container: {
      padding: 20,
      paddingBottom: 40,
    },
    errorText: {
      color: t.danger,
      marginBottom: 12,
    },
    label: {
      fontWeight: "600",
      fontSize: 13,
      marginBottom: 4,
      marginTop: 8,
      color: t.text,
    },
    smallLabel: {
      fontWeight: "600",
      fontSize: 12,
      marginBottom: 4,
      color: t.textMuted,
    },
    input: {
      borderWidth: 1,
      borderColor: t.inputBorder,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 8,
      backgroundColor: t.background,
      color: t.text,
    },
    workoutCard: {
      backgroundColor: t.card,
      borderRadius: 14,
      padding: 14,
      marginTop: 16,
    },
    workoutHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    workoutTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: t.text,
    },
    exerciseTitle: {
      fontWeight: "700",
      fontSize: 13,
      color: t.textSecondary,
    },
    exerciseCard: {
      backgroundColor: t.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.border,
      padding: 12,
      marginBottom: 8,
    },
    removeText: {
      color: t.danger,
      fontWeight: "600",
      fontSize: 12,
    },
    row: {
      flexDirection: "row",
      gap: 10,
    },
    rowItem: {
      flex: 1,
    },
    secondaryButton: {
      borderWidth: 1,
      borderColor: t.primary,
      borderRadius: 12,
      paddingVertical: 10,
      alignItems: "center",
      marginTop: 8,
    },
    secondaryButtonText: {
      color: t.primary,
      fontWeight: "700",
    },
    saveButton: {
      backgroundColor: t.cta,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 20,
    },
    saveButtonText: {
      color: t.onAccent,
      fontWeight: "700",
    },
    buttonDisabled: {
      opacity: 0.6,
    },
  });
