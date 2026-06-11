import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import ErrorBanner from "../../components/ErrorBanner";
import { getFastFoodOptions, type FastFoodItem } from "../../services/nutrition.service";
import { getApiErrorMessage } from "../../utils/api-error";

const CALORIE_FILTERS = [
  { label: "Any calories", value: undefined },
  { label: "Under 400", value: 400 },
  { label: "Under 600", value: 600 },
] as const;

const PROTEIN_FILTERS = [
  { label: "Any protein", value: undefined },
  { label: "25g+", value: 25 },
  { label: "35g+", value: 35 },
] as const;

export default function FastFoodScreen() {
  const [maxCalories, setMaxCalories] = useState<number | undefined>(undefined);
  const [minProtein, setMinProtein] = useState<number | undefined>(undefined);
  const [items, setItems] = useState<FastFoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filters: { maxCalories?: number; minProtein?: number } = {};
      if (maxCalories !== undefined) {
        filters.maxCalories = maxCalories;
      }
      if (minProtein !== undefined) {
        filters.minProtein = minProtein;
      }
      setItems(await getFastFoodOptions(filters));
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load fast food options."));
    } finally {
      setIsLoading(false);
    }
  }, [maxCalories, minProtein]);

  useEffect(() => {
    void load();
  }, [load]);

  const byRestaurant = new Map<string, FastFoodItem[]>();
  for (const item of items) {
    const list = byRestaurant.get(item.restaurant) ?? [];
    list.push(item);
    byRestaurant.set(item.restaurant, list);
  }

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Eating out?</Text>
      <Text style={styles.subheading}>
        Whole foods are still the best way to hit your macros — but when fast food is the only
        option, these picks keep you on track.
      </Text>

      <View style={styles.filterRow}>
        {CALORIE_FILTERS.map((filter) => (
          <Pressable
            key={filter.label}
            style={[styles.chip, maxCalories === filter.value && styles.chipSelected]}
            onPress={() => setMaxCalories(filter.value)}
          >
            <Text
              style={[styles.chipText, maxCalories === filter.value && styles.chipTextSelected]}
            >
              {filter.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.filterRow}>
        {PROTEIN_FILTERS.map((filter) => (
          <Pressable
            key={filter.label}
            style={[styles.chip, minProtein === filter.value && styles.chipSelected]}
            onPress={() => setMinProtein(filter.value)}
          >
            <Text
              style={[styles.chipText, minProtein === filter.value && styles.chipTextSelected]}
            >
              {filter.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {error ? <ErrorBanner message={error} onRetry={() => void load()} /> : null}

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color="#4f46e5" />
      ) : items.length === 0 ? (
        <Text style={styles.emptyText}>No menu items match those filters.</Text>
      ) : (
        Array.from(byRestaurant.entries()).map(([restaurant, restaurantItems]) => (
          <View key={restaurant} style={styles.restaurantCard}>
            <Text style={styles.restaurantName}>{restaurant}</Text>
            {restaurantItems.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={styles.flex}>
                  <Text style={styles.itemName}>{item.itemName}</Text>
                  <Text style={styles.itemMeta}>{item.servingSize}</Text>
                </View>
                <View style={styles.macroCol}>
                  <Text style={styles.itemCalories}>{item.calories} cal</Text>
                  <Text style={styles.itemMeta}>
                    P {Math.round(item.protein)} | C {Math.round(item.carbs)} | F{" "}
                    {Math.round(item.fat)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ))
      )}
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
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    backgroundColor: "#f3f4f6",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipSelected: {
    backgroundColor: "#4f46e5",
  },
  chipText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 12,
  },
  chipTextSelected: {
    color: "#ffffff",
  },
  loader: {
    marginTop: 24,
  },
  errorText: {
    color: "#dc2626",
    marginTop: 8,
  },
  emptyText: {
    color: "#6b7280",
    fontSize: 14,
    marginTop: 16,
  },
  restaurantCard: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
  },
  itemName: {
    fontWeight: "600",
    fontSize: 14,
  },
  itemMeta: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 2,
  },
  macroCol: {
    alignItems: "flex-end",
    paddingLeft: 8,
  },
  itemCalories: {
    fontWeight: "700",
  },
});
