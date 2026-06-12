import { useCallback, useMemo, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
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
import FoodLogModal from "../../components/FoodLogModal";
import { useTheme, type Theme } from "../../constants/theme";
import {
  getDailySummary,
  getFoodLogs,
  type DailySummary,
  type FoodLog,
  type MealType,
} from "../../services/nutrition.service";
import { getApiErrorMessage } from "../../utils/api-error";

const MEAL_SECTIONS: { type: MealType; label: string }[] = [
  { type: "BREAKFAST", label: "Breakfast" },
  { type: "LUNCH", label: "Lunch" },
  { type: "DINNER", label: "Dinner" },
  { type: "SNACK", label: "Snacks" },
];

const todayString = (): string => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

const shiftDate = (date: string, days: number): string => {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
};

const formatDateLabel = (date: string): string => {
  if (date === todayString()) {
    return "Today";
  }
  if (date === shiftDate(todayString(), -1)) {
    return "Yesterday";
  }
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

const useStyles = () => {
  const t = useTheme();
  return useMemo(() => createStyles(t), [t]);
};

type MacroRowProps = {
  label: string;
  consumed: number;
  target: number | null;
  unit: string;
  color: string;
};

function MacroRow({ label, consumed, target, unit, color }: MacroRowProps) {
  const styles = useStyles();
  const progress = target && target > 0 ? Math.min(consumed / target, 1) : 0;

  return (
    <View style={styles.macroRow}>
      <View style={styles.macroHeader}>
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={styles.macroValue}>
          {Math.round(consumed)}
          {target !== null ? ` / ${Math.round(target)}` : ""} {unit}
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function FoodLogRow({ log, onPress }: { log: FoodLog; onPress: () => void }) {
  const styles = useStyles();
  return (
    <Pressable style={styles.foodRow} onPress={onPress}>
      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>{log.foodName}</Text>
        <Text style={styles.foodMeta}>
          {log.servings} x {log.servingSize}
          {log.brand ? ` - ${log.brand}` : ""}
        </Text>
      </View>
      <View style={styles.foodMacros}>
        <Text style={styles.foodCalories}>{log.calories} cal</Text>
        <Text style={styles.foodMeta}>
          P {Math.round(log.protein)} | C {Math.round(log.carbs)} | F {Math.round(log.fat)}
        </Text>
      </View>
    </Pressable>
  );
}

export default function NutritionScreen() {
  const router = useRouter();
  const t = useTheme();
  const styles = useStyles();
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalMeal, setModalMeal] = useState<MealType | null>(null);
  const [editingLog, setEditingLog] = useState<FoodLog | null>(null);
  const [selectedDate, setSelectedDate] = useState(todayString());

  const loadSummary = useCallback(
    async (refreshing = false) => {
      if (refreshing) {
        setIsRefreshing(true);
      }
      setError(null);
      try {
        const [summaryData, logsData] = await Promise.all([
          getDailySummary(selectedDate),
          getFoodLogs(selectedDate),
        ]);
        setSummary(summaryData);
        setLogs(logsData);
      } catch (err) {
        setError(getApiErrorMessage(err, "Could not load nutrition for this day."));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [selectedDate],
  );

  useFocusEffect(
    useCallback(() => {
      void loadSummary();
    }, [loadSummary]),
  );

  const closeModal = () => {
    setModalMeal(null);
    setEditingLog(null);
  };

  const handleSaved = () => {
    closeModal();
    void loadSummary();
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={t.primary} />
      </View>
    );
  }

  const remainingCalories = summary?.remaining?.calories ?? null;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={() => void loadSummary(true)} />
      }
    >
      <View style={styles.dateNav}>
        <Pressable style={styles.dateArrow} onPress={() => setSelectedDate(shiftDate(selectedDate, -1))}>
          <Text style={styles.dateArrowText}>{"<"}</Text>
        </Pressable>
        <View style={styles.dateCenter}>
          <Text style={styles.title}>{formatDateLabel(selectedDate)}</Text>
          <Text style={styles.dateText}>{selectedDate}</Text>
        </View>
        <Pressable
          style={[styles.dateArrow, selectedDate === todayString() && styles.dateArrowDisabled]}
          onPress={() => setSelectedDate(shiftDate(selectedDate, 1))}
          disabled={selectedDate === todayString()}
        >
          <Text style={styles.dateArrowText}>{">"}</Text>
        </Pressable>
      </View>

      {error ? <ErrorBanner message={error} onRetry={() => void loadSummary()} /> : null}

      {summary ? (
        <>
          <View style={styles.calorieCard}>
            <Text style={styles.calorieNumber}>
              {remainingCalories !== null ? Math.max(remainingCalories, 0) : summary.consumed.calories}
            </Text>
            <Text style={styles.calorieLabel}>
              {remainingCalories !== null ? "calories remaining" : "calories eaten"}
            </Text>
            <Text style={styles.calorieSub}>
              {summary.consumed.calories} eaten
              {summary.targets ? ` of ${summary.targets.calories} target` : ""}
            </Text>
          </View>

          <View style={styles.macroCard}>
            <Text style={styles.cardTitle}>Macros</Text>
            <MacroRow
              label="Protein"
              consumed={summary.consumed.protein}
              target={summary.targets?.protein ?? null}
              unit="g"
              color="#ef4444"
            />
            <MacroRow
              label="Carbs"
              consumed={summary.consumed.carbs}
              target={summary.targets?.carbs ?? null}
              unit="g"
              color="#f59e0b"
            />
            <MacroRow
              label="Fat"
              consumed={summary.consumed.fat}
              target={summary.targets?.fat ?? null}
              unit="g"
              color="#3b82f6"
            />
          </View>

          <View style={styles.toolRow}>
            <Pressable style={styles.toolButton} onPress={() => router.navigate("/nutrition/meal-plan")}>
              <Text style={styles.toolButtonText}>Meal ideas</Text>
            </Pressable>
            <Pressable style={styles.toolButton} onPress={() => router.navigate("/nutrition/fast-food")}>
              <Text style={styles.toolButtonText}>Fast food</Text>
            </Pressable>
            <Pressable style={styles.toolButton} onPress={() => router.navigate("/nutrition/grocery-list")}>
              <Text style={styles.toolButtonText}>Groceries</Text>
            </Pressable>
          </View>

          {MEAL_SECTIONS.map(({ type, label }) => {
            const mealLogs = logs.filter((log) => log.mealType === type);
            const mealCalories = mealLogs.reduce((total, log) => total + log.calories, 0);

            return (
              <View key={type} style={styles.mealCard}>
                <View style={styles.mealHeader}>
                  <Text style={styles.cardTitle}>{label}</Text>
                  <Text style={styles.mealCalories}>{mealCalories} cal</Text>
                </View>
                {mealLogs.length === 0 ? (
                  <Text style={styles.emptyMealText}>Nothing logged.</Text>
                ) : (
                  mealLogs.map((log) => (
                    <FoodLogRow
                      key={log.id}
                      log={log}
                      onPress={() => {
                        setEditingLog(log);
                        setModalMeal(log.mealType);
                      }}
                    />
                  ))
                )}
                <Pressable style={styles.addButton} onPress={() => setModalMeal(type)}>
                  <Text style={styles.addButtonText}>+ Add food</Text>
                </Pressable>
              </View>
            );
          })}
        </>
      ) : null}

      <FoodLogModal
        visible={modalMeal !== null}
        mealType={modalMeal ?? "SNACK"}
        date={selectedDate}
        editingLog={editingLog}
        onClose={closeModal}
        onSaved={handleSaved}
      />
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
      color: t.text,
    },
    dateText: {
      color: t.textMuted,
    },
    dateNav: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    dateCenter: {
      alignItems: "center",
    },
    dateArrow: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: t.chip,
      alignItems: "center",
      justifyContent: "center",
    },
    dateArrowDisabled: {
      opacity: 0.3,
    },
    dateArrowText: {
      fontSize: 18,
      fontWeight: "700",
      color: t.textSecondary,
    },
    errorText: {
      color: t.danger,
      marginBottom: 12,
    },
    calorieCard: {
      backgroundColor: t.hero,
      borderRadius: 16,
      padding: 24,
      alignItems: "center",
      marginBottom: 16,
    },
    calorieNumber: {
      color: t.heroText,
      fontSize: 44,
      fontWeight: "800",
    },
    calorieLabel: {
      color: t.heroMuted,
      fontSize: 14,
      marginTop: 2,
    },
    calorieSub: {
      color: t.heroFaint,
      fontSize: 13,
      marginTop: 8,
    },
    macroCard: {
      backgroundColor: t.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 12,
      color: t.text,
    },
    macroRow: {
      marginBottom: 12,
    },
    macroHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    macroLabel: {
      fontWeight: "600",
      color: t.text,
    },
    macroValue: {
      color: t.textMuted,
    },
    progressTrack: {
      height: 8,
      borderRadius: 4,
      backgroundColor: t.border,
      overflow: "hidden",
    },
    progressFill: {
      height: 8,
      borderRadius: 4,
    },
    toolRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 16,
    },
    toolButton: {
      flex: 1,
      borderWidth: 1,
      borderColor: t.primary,
      borderRadius: 10,
      paddingVertical: 9,
      alignItems: "center",
    },
    toolButtonText: {
      color: t.primary,
      fontWeight: "700",
      fontSize: 13,
    },
    mealCard: {
      backgroundColor: t.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
    },
    mealHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    mealCalories: {
      color: t.textMuted,
      fontWeight: "600",
    },
    emptyMealText: {
      color: t.textFaint,
      fontSize: 13,
    },
    foodRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.border,
    },
    foodInfo: {
      flex: 1,
      paddingRight: 8,
    },
    foodName: {
      fontWeight: "600",
      color: t.text,
    },
    foodMeta: {
      color: t.textMuted,
      fontSize: 12,
      marginTop: 2,
    },
    foodMacros: {
      alignItems: "flex-end",
    },
    foodCalories: {
      fontWeight: "600",
      color: t.text,
    },
    addButton: {
      marginTop: 10,
      paddingVertical: 8,
      alignItems: "center",
      borderRadius: 10,
      backgroundColor: t.primaryTint,
    },
    addButtonText: {
      color: t.primary,
      fontWeight: "700",
      fontSize: 13,
    },
  });
