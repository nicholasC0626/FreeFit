import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import ErrorBanner from "../../components/ErrorBanner";
import { reviewAiProgram } from "../../services/ai.service";
import { listPrograms, type Program } from "../../services/training.service";
import { getApiErrorMessage } from "../../utils/api-error";

export default function ProgramReviewScreen() {
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
        <ActivityIndicator style={styles.loader} color="#4f46e5" />
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
              <ActivityIndicator size="small" color="#4f46e5" />
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

const styles = StyleSheet.create({
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
  },
  subheading: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 16,
  },
  loader: {
    marginTop: 24,
  },
  emptyText: {
    color: "#6b7280",
    fontSize: 14,
    marginTop: 12,
  },
  programCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  programCardActive: {
    backgroundColor: "#e0e7ff",
  },
  programName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  programMeta: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  reviewLink: {
    color: "#4f46e5",
    fontWeight: "700",
    fontSize: 14,
  },
  errorText: {
    color: "#dc2626",
    marginTop: 8,
  },
  reviewCard: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  reviewBody: {
    fontSize: 14,
    lineHeight: 21,
    color: "#111827",
  },
});
