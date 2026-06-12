import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useTheme, type Theme } from "../../constants/theme";
import { suggestAiExercises, type ExerciseSuggestion } from "../../services/ai.service";
import { getApiErrorMessage } from "../../utils/api-error";

const MUSCLE_GROUPS = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Quads",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Abs",
];

export default function ExerciseSuggestScreen() {
  const t = useTheme();
  const styles = useMemo(() => createStyles(t), [t]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<ExerciseSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (muscleGroup: string) => {
    if (isLoading) {
      return;
    }
    setSelectedGroup(muscleGroup);
    setSuggestions([]);
    setError(null);
    setIsLoading(true);
    try {
      const result = await suggestAiExercises(muscleGroup);
      setSuggestions(result);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not get exercise suggestions."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Pick a muscle group</Text>
      <Text style={styles.subheading}>
        The AI coach ranks the 5 best exercises for it. Suggestions may take 30–60 seconds.
      </Text>

      <View style={styles.chipRow}>
        {MUSCLE_GROUPS.map((group) => (
          <Pressable
            key={group}
            style={[styles.chip, selectedGroup === group && styles.chipSelected]}
            onPress={() => void handleSelect(group)}
            disabled={isLoading}
          >
            <Text
              style={[styles.chipText, selectedGroup === group && styles.chipTextSelected]}
            >
              {group}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={t.primary} />
          <Text style={styles.loadingText}>Ranking the best {selectedGroup} exercises…</Text>
        </View>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {suggestions.map((suggestion, index) => (
        <View key={suggestion.exerciseName} style={styles.suggestionCard}>
          <Text style={styles.suggestionName}>
            {index + 1}. {suggestion.exerciseName}
          </Text>
          <Text style={styles.suggestionSetsReps}>{suggestion.setsReps}</Text>
          <Text style={styles.suggestionLabel}>Cues</Text>
          <Text style={styles.suggestionBody}>{suggestion.coachingCues}</Text>
          <Text style={styles.suggestionLabel}>Watch out for</Text>
          <Text style={styles.suggestionBody}>{suggestion.commonMistakes}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    container: {
      padding: 20,
      paddingBottom: 40,
    },
    heading: {
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 4,
      color: t.text,
    },
    subheading: {
      fontSize: 13,
      color: t.textMuted,
      marginBottom: 16,
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
    loadingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 8,
    },
    loadingText: {
      color: t.textMuted,
      fontSize: 13,
    },
    errorText: {
      color: t.danger,
      marginTop: 8,
    },
    suggestionCard: {
      backgroundColor: t.card,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 12,
      padding: 16,
      marginTop: 12,
    },
    suggestionName: {
      fontSize: 16,
      fontWeight: "700",
      color: t.text,
    },
    suggestionSetsReps: {
      fontSize: 13,
      color: t.primary,
      fontWeight: "600",
      marginTop: 2,
    },
    suggestionLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: t.textMuted,
      textTransform: "uppercase",
      marginTop: 10,
    },
    suggestionBody: {
      fontSize: 14,
      lineHeight: 20,
      color: t.text,
      marginTop: 2,
    },
  });
