import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import ErrorBanner from "../../components/ErrorBanner";
import { useTheme, type Theme } from "../../constants/theme";
import { reviewAiProgram } from "../../services/ai.service";
import { listPrograms, type Program } from "../../services/training.service";
import { getApiErrorMessage } from "../../utils/api-error";

export default function ProgramReviewScreen() {
  const t = useTheme();
  const styles = useMemo(() => createStyles(t), [t]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [review, setReview] = useState<{ programName: string; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPrograms = () => {
    setIsLoadingPrograms(true);
    listPrograms()
      .then(setPrograms)
      .catch((err) => setError(getApiErrorMessage(err, "Could not load your programs.")))
      .finally(() => setIsLoadingPrograms(false));
  };

  useEffect(() => {
    loadPrograms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReview = async (program: Program) => {
    if (reviewingId) {
      return;
    }
    setReviewingId(program.id);
    setReview(null);
    setError(null);
    try {
      const result = await reviewAiProgram(program.id);
      setReview({ programName: result.programName, text: result.review });
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not review this program."));
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Pick a program to review</Text>
      <Text style={styles.subheading}>
        The AI coach checks for redundancy, imbalances, missing muscle groups, volume issues, and
        exercise order. Reviews may take 30–60 seconds.
      </Text>

      {isLoadingPrograms ? (
        <ActivityIndicator style={styles.loader} color={t.primary} />
      ) : programs.length === 0 ? (
        <Text style={styles.emptyText}>
          You don't have any programs yet. Create one on the Training tab first.
        </Text>
      ) : (
        programs.map((program) => (
          <Pressable
            key={program.id}
            style={[styles.programCard, reviewingId === program.id && styles.programCardActive]}
            onPress={() => void handleReview(program)}
            disabled={reviewingId !== null}
          >
            <View style={styles.flex}>
              <Text style={styles.programName}>{program.name}</Text>
              <Text style={styles.programMeta}>
                {program.workoutTemplates.length} workout
                {program.workoutTemplates.length === 1 ? "" : "s"}
                {program.isAiGenerated ? " · AI generated" : ""}
              </Text>
            </View>
            {reviewingId === program.id ? (
              <ActivityIndicator size="small" color={t.primary} />
            ) : (
              <Text style={styles.reviewLink}>Review</Text>
            )}
          </Pressable>
        ))
      )}

      {error ? (
        <ErrorBanner
          message={error}
          onRetry={programs.length === 0 ? loadPrograms : undefined}
        />
      ) : null}

      {review ? (
        <View style={styles.reviewCard}>
          <Text style={styles.reviewTitle}>Review: {review.programName}</Text>
          <Text style={styles.reviewBody}>{review.text}</Text>
        </View>
      ) : null}
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
    loader: {
      marginTop: 24,
    },
    emptyText: {
      color: t.textMuted,
      fontSize: 14,
      marginTop: 12,
    },
    programCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: t.chip,
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
    },
    programCardActive: {
      backgroundColor: t.primaryTint,
    },
    programName: {
      fontSize: 15,
      fontWeight: "600",
      color: t.text,
    },
    programMeta: {
      fontSize: 12,
      color: t.textMuted,
      marginTop: 2,
    },
    reviewLink: {
      color: t.primary,
      fontWeight: "700",
      fontSize: 14,
    },
    errorText: {
      color: t.danger,
      marginTop: 8,
    },
    reviewCard: {
      backgroundColor: t.card,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 12,
      padding: 16,
      marginTop: 16,
    },
    reviewTitle: {
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 8,
      color: t.text,
    },
    reviewBody: {
      fontSize: 14,
      lineHeight: 21,
      color: t.text,
    },
  });
