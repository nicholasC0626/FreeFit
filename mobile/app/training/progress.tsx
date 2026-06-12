import { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import ErrorBanner from "../../components/ErrorBanner";
import SessionLineChart, { type ChartPoint } from "../../components/charts/SessionLineChart";
import { useTheme, type Theme } from "../../constants/theme";
import {
  getExerciseHistory,
  getPersonalRecords,
  type ExerciseHistoryEntry,
  type PersonalRecord,
} from "../../services/training.service";
import { getApiErrorMessage } from "../../utils/api-error";

/** Epley estimated one-rep max. */
const estimate1RM = (weight: number, reps: number): number =>
  reps === 1 ? weight : weight * (1 + reps / 30);

const shortDate = (isoDate: string): string => {
  const [, month, day] = isoDate.split("-");
  return `${Number(month)}/${Number(day)}`;
};

type SessionStats = {
  oneRepMax: ChartPoint[];
  volume: ChartPoint[];
};

/** Per-session best estimated 1RM and total volume, oldest session first. */
const computeStats = (history: ExerciseHistoryEntry[]): SessionStats => {
  const oneRepMax: ChartPoint[] = [];
  const volume: ChartPoint[] = [];

  for (const entry of [...history].reverse()) {
    const label = shortDate(entry.sessionDate);
    const lifted = entry.sets.filter((set) => set.weight > 0 && set.reps > 0);
    if (lifted.length === 0) {
      continue;
    }

    oneRepMax.push({
      label,
      value: Math.max(...lifted.map((set) => estimate1RM(set.weight, set.reps))),
    });
    volume.push({
      label,
      value: lifted.reduce((total, set) => total + set.weight * set.reps, 0),
    });
  }

  return { oneRepMax, volume };
};

export default function ProgressScreen() {
  const t = useTheme();
  const styles = useMemo(() => createStyles(t), [t]);
  const [records, setRecords] = useState<PersonalRecord[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [history, setHistory] = useState<ExerciseHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async (exerciseName: string) => {
    setSelectedExercise(exerciseName);
    setIsLoadingHistory(true);
    setError(null);
    try {
      setHistory(await getExerciseHistory(exerciseName));
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load this exercise's history."));
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  const loadRecords = useCallback(async () => {
    setError(null);
    try {
      const prs = await getPersonalRecords();
      prs.sort((a, b) => a.exerciseName.localeCompare(b.exerciseName));
      setRecords(prs);
      if (prs.length > 0) {
        // Keep the current selection when refreshing, else default to the first exercise.
        const current = selectedExercise;
        const stillExists = current && prs.some((pr) => pr.exerciseName === current);
        await loadHistory(stillExists ? (current as string) : prs[0].exerciseName);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load your training progress."));
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadHistory]);

  useFocusEffect(
    useCallback(() => {
      void loadRecords();
    }, [loadRecords]),
  );

  const stats = useMemo(() => computeStats(history), [history]);
  const maxVolume = stats.volume.length > 0 ? Math.max(...stats.volume.map((p) => p.value)) : 0;

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={t.primary} />
      </View>
    );
  }

  if (records.length === 0) {
    return (
      <View style={styles.centered}>
        {error ? <ErrorBanner message={error} onRetry={() => void loadRecords()} /> : null}
        <Text style={styles.emptyTitle}>No progress to chart yet.</Text>
        <Text style={styles.emptyText}>
          Complete a few workouts with logged sets and your strength charts will show up here.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Pick an exercise</Text>
      <View style={styles.chipRow}>
        {records.map((pr) => (
          <Pressable
            key={pr.exerciseName}
            style={[styles.chip, selectedExercise === pr.exerciseName && styles.chipSelected]}
            onPress={() => void loadHistory(pr.exerciseName)}
            disabled={isLoadingHistory}
          >
            <Text
              style={[
                styles.chipText,
                selectedExercise === pr.exerciseName && styles.chipTextSelected,
              ]}
            >
              {pr.exerciseName}
            </Text>
          </Pressable>
        ))}
      </View>

      {error ? <ErrorBanner message={error} onRetry={() => void loadRecords()} /> : null}

      {isLoadingHistory ? (
        <ActivityIndicator style={styles.loader} color={t.primary} />
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Estimated 1RM</Text>
            <Text style={styles.cardSub}>
              Best set per session, estimated one-rep max (Epley formula).
            </Text>
            {stats.oneRepMax.length > 0 ? (
              <SessionLineChart points={stats.oneRepMax} valueSuffix=" lb" />
            ) : (
              <Text style={styles.emptyText}>No weighted sets logged for this exercise yet.</Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Volume per session</Text>
            <Text style={styles.cardSub}>Total weight x reps across all sets.</Text>
            {stats.volume.length > 0 ? (
              <>
                <View style={styles.barRow}>
                  {stats.volume.map((point, index) => (
                    <View key={index} style={styles.barColumn}>
                      <View
                        style={[
                          styles.bar,
                          { height: Math.max((point.value / maxVolume) * 120, 3) },
                        ]}
                      />
                    </View>
                  ))}
                </View>
                <View style={styles.barLabels}>
                  <Text style={styles.barLabel}>{stats.volume[0].label}</Text>
                  <Text style={styles.barLabel}>
                    peak {Math.round(maxVolume).toLocaleString()} lb
                  </Text>
                  <Text style={styles.barLabel}>
                    {stats.volume[stats.volume.length - 1].label}
                  </Text>
                </View>
              </>
            ) : (
              <Text style={styles.emptyText}>No weighted sets logged for this exercise yet.</Text>
            )}
          </View>
        </>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Personal records</Text>
        {records.map((pr) => (
          <View key={pr.exerciseName} style={styles.prRow}>
            <View style={styles.prInfo}>
              <Text style={styles.prName}>{pr.exerciseName}</Text>
              <Text style={styles.prMeta}>
                {pr.muscleGroup} · {pr.date}
              </Text>
            </View>
            <Text style={styles.prValue}>
              {pr.weight} lb x {pr.reps}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    },
    container: {
      padding: 20,
      paddingBottom: 40,
    },
    heading: {
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 10,
      color: t.text,
    },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 16,
    },
    chip: {
      backgroundColor: t.chip,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    chipSelected: {
      backgroundColor: t.primarySolid,
    },
    chipText: {
      color: t.textSecondary,
      fontWeight: "600",
      fontSize: 13,
    },
    chipTextSelected: {
      color: t.onAccent,
    },
    loader: {
      marginVertical: 32,
    },
    card: {
      backgroundColor: t.card,
      borderRadius: 14,
      padding: 16,
      marginBottom: 14,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: t.text,
    },
    cardSub: {
      fontSize: 12,
      color: t.textMuted,
      marginTop: 2,
      marginBottom: 12,
    },
    emptyTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: t.text,
      marginBottom: 6,
      textAlign: "center",
    },
    emptyText: {
      color: t.textMuted,
      fontSize: 13,
      textAlign: "center",
    },
    barRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 4,
      height: 120,
    },
    barColumn: {
      flex: 1,
      justifyContent: "flex-end",
    },
    bar: {
      backgroundColor: t.primarySolid,
      borderRadius: 3,
    },
    barLabels: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 6,
    },
    barLabel: {
      fontSize: 10,
      color: t.textMuted,
    },
    prRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.border,
      marginTop: 4,
    },
    prInfo: {
      flex: 1,
      paddingRight: 8,
    },
    prName: {
      fontWeight: "600",
      color: t.text,
    },
    prMeta: {
      fontSize: 12,
      color: t.textMuted,
      marginTop: 1,
    },
    prValue: {
      fontWeight: "700",
      color: t.primary,
    },
  });
