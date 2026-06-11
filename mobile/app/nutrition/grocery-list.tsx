import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { generateGroceryList, type GroceryList } from "../../services/nutrition.service";
import { getApiErrorMessage } from "../../utils/api-error";

const DAY_OPTIONS = [3, 5, 7] as const;
const BUDGET_OPTIONS = [
  { label: "Budget", value: "LOW" },
  { label: "Standard", value: "MEDIUM" },
  { label: "Premium", value: "HIGH" },
] as const;

export default function GroceryListScreen() {
  const [days, setDays] = useState<number>(7);
  const [budget, setBudget] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [restrictions, setRestrictions] = useState("");
  const [groceryList, setGroceryList] = useState<GroceryList | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (isGenerating) {
      return;
    }
    setIsGenerating(true);
    setError(null);
    setGroceryList(null);
    try {
      const trimmed = restrictions.trim();
      setGroceryList(
        await generateGroceryList({
          days,
          budget,
          ...(trimmed ? { dietaryRestrictions: trimmed } : {}),
        }),
      );
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not generate a grocery list."));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Grocery haul</Text>
      <Text style={styles.subheading}>
        A whole-foods shopping list built around your macro targets. Generation may take 30–60
        seconds.
      </Text>

      <Text style={styles.fieldLabel}>Days to shop for</Text>
      <View style={styles.chipRow}>
        {DAY_OPTIONS.map((option) => (
          <Pressable
            key={option}
            style={[styles.chip, days === option && styles.chipSelected]}
            onPress={() => setDays(option)}
          >
            <Text style={[styles.chipText, days === option && styles.chipTextSelected]}>
              {option} days
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.fieldLabel}>Budget</Text>
      <View style={styles.chipRow}>
        {BUDGET_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            style={[styles.chip, budget === option.value && styles.chipSelected]}
            onPress={() => setBudget(option.value)}
          >
            <Text style={[styles.chipText, budget === option.value && styles.chipTextSelected]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.fieldLabel}>Dietary restrictions (optional)</Text>
      <TextInput
        style={styles.input}
        value={restrictions}
        onChangeText={setRestrictions}
        placeholder="e.g. no dairy, vegetarian"
      />

      <Pressable
        style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
        onPress={() => void handleGenerate()}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <ActivityIndicator color="#ffffff" size="small" />
        ) : (
          <Text style={styles.generateButtonText}>Generate grocery list</Text>
        )}
      </Pressable>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {groceryList?.sections.map((section) => (
        <View key={section.section} style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{section.section}</Text>
          {section.items.map((item) => (
            <View key={`${section.section}-${item.name}`} style={styles.itemRow}>
              <View style={styles.flex}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.note ? <Text style={styles.itemNote}>{item.note}</Text> : null}
              </View>
              <Text style={styles.itemQuantity}>{item.quantity}</Text>
            </View>
          ))}
        </View>
      ))}

      {groceryList?.tips?.length ? (
        <View style={styles.tipsCard}>
          <Text style={styles.sectionTitle}>Prep tips</Text>
          {groceryList.tips.map((tip) => (
            <Text key={tip} style={styles.tipText}>
              • {tip}
            </Text>
          ))}
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
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    backgroundColor: "#f3f4f6",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipSelected: {
    backgroundColor: "#4f46e5",
  },
  chipText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 13,
  },
  chipTextSelected: {
    color: "#ffffff",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  generateButton: {
    backgroundColor: "#4f46e5",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 15,
  },
  errorText: {
    color: "#dc2626",
    marginTop: 10,
  },
  sectionCard: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
  },
  itemName: {
    fontWeight: "600",
    fontSize: 14,
  },
  itemNote: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 2,
  },
  itemQuantity: {
    color: "#4f46e5",
    fontWeight: "700",
    fontSize: 13,
    paddingLeft: 8,
  },
  tipsCard: {
    backgroundColor: "#eef2ff",
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
  },
  tipText: {
    fontSize: 13,
    color: "#374151",
    marginTop: 4,
    lineHeight: 19,
  },
});
