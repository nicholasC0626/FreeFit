import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import ErrorBanner from "../../components/ErrorBanner";
import {
  createFoodLog,
  getFoodSuggestions,
  type FoodSuggestion,
  type MealType,
  type SuggestionsResponse,
} from "../../services/nutrition.service";
import { getApiErrorMessage } from "../../utils/api-error";

const CATEGORY_LABELS: Record<FoodSuggestion["category"], string> = {
  PROTEIN: "Protein",
  CARB: "Carbs",
  FAT: "Healthy fat",
  DAIRY: "Dairy",
  PRODUCE: "Fruit & veg",
};

const mealTypeForNow = (): MealType => {
  const hour = new Date().getHours();
  if (hour < 11) return "BREAKFAST";
  if (hour < 16) return "LUNCH";
  if (hour < 21) return "DINNER";
  return "SNACK";
};

export default function MealPlanScreen() {
  const [data, setData] = useState<SuggestionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [addingName, setAddingName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refreshing = false) => {
    if (refreshing) {
      setIsRefreshing(true);
    }
    setError(null);
    try {
      const result = await getFoodSuggestions();
      setData(result);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load food suggestions."));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const handleAdd = async (suggestion: FoodSuggestion) => {
    if (addingName) {
      return;
    }
    setAddingName(suggestion.name);
    setError(null);
    try {
      await createFoodLog({
        mealType: mealTypeForNow(),
        foodName: suggestion.name,
        servingSize: suggestion.servingSize,
        servings: suggestion.servings,
        calories: suggestion.calories,
        protein: suggestion.protein,
        carbs: suggestion.carbs,
        fat: suggestion.fat,
      });
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not log this food."));
    } finally {
      setAddingName(null);
    }
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
      style={styles.flex}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={() => void load(true)} />
      }
    >
      <Text style={styles.heading}>What should I eat?</Text>
      <Text style={styles.subheading}>
        Whole-food picks sized to fit what you have left today. Tap "Add to log" to log one for
        your {mealTypeForNow().toLowerCase()}.
      </Text>

      {data?.remaining ? (
        <View style={styles.remainingCard}>
          <Text style={styles.remainingTitle}>Left today</Text>
          <View style={styles.remainingRow}>
            <Text style={styles.remainingItem}>
              {Math.max(Math.round(data.remaining.calories), 0)} cal
            </Text>
            <Text style={styles.remainingItem}>
              P {Math.max(Math.round(data.remaining.protein), 0)}g
            </Text>
            <Text style={styles.remainingItem}>
              C {Math.max(Math.round(data.remaining.carbs), 0)}g
            </Text>
            <Text style={styles.remainingItem}>
              F {Math.max(Math.round(data.remaining.fat), 0)}g
            </Text>
          </View>
        </View>
      ) : null}

      {error ? <ErrorBanner message={error} onRetry={() => void load()} /> : null}
      {data?.message ? <Text style={styles.messageText}>{data.message}</Text> : null}

      {data?.suggestions.map((suggestion) => (
        <View key={suggestion.name} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.flex}>
              <Text style={styles.foodName}>{suggestion.name}</Text>
              <Text style={styles.foodMeta}>
                {suggestion.servings} x {suggestion.servingSize} ·{" "}
                {CATEGORY_LABELS[suggestion.category]}
              </Text>
            </View>
            <View style={styles.macroCol}>
              <Text style={styles.foodCalories}>{suggestion.calories} cal</Text>
              <Text style={styles.foodMeta}>
                P {Math.round(suggestion.protein)} | C {Math.round(suggestion.carbs)} | F{" "}
                {Math.round(suggestion.fat)}
              </Text>
            </View>
          </View>
          <Pressable
            style={[styles.addButton, addingName !== null && styles.addButtonDisabled]}
            onPress={() => void handleAdd(suggestion)}
            disabled={addingName !== null}
          >
            {addingName === suggestion.name ? (
              <ActivityIndicator size="small" color="#4f46e5" />
            ) : (
              <Text style={styles.addButtonText}>+ Add to log</Text>
            )}
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
  remainingCard: {
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  remainingTitle: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  remainingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  remainingItem: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 15,
  },
  errorText: {
    color: "#dc2626",
    marginBottom: 8,
  },
  messageText: {
    color: "#6b7280",
    fontSize: 14,
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  foodName: {
    fontWeight: "600",
    fontSize: 15,
  },
  foodMeta: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 2,
  },
  macroCol: {
    alignItems: "flex-end",
    paddingLeft: 8,
  },
  foodCalories: {
    fontWeight: "700",
  },
  addButton: {
    marginTop: 10,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#eef2ff",
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: "#4f46e5",
    fontWeight: "700",
    fontSize: 13,
  },
});
