import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import BarcodeScannerModal from "./BarcodeScannerModal";
import { useTheme, type Theme } from "../constants/theme";
import {
  createFoodLog,
  deleteFoodLog,
  searchFoods,
  updateFoodLog,
  type BarcodeFood,
  type FoodLog,
  type FoodSearchResult,
  type MealType,
} from "../services/nutrition.service";
import { getApiErrorMessage } from "../utils/api-error";

// expo-camera barcode scanning has no web implementation.
const CAN_SCAN = Platform.OS !== "web";

type Props = {
  visible: boolean;
  mealType: MealType;
  /** YYYY-MM-DD day to log new entries on. */
  date: string;
  /** When set, the modal edits this entry instead of creating one. */
  editingLog: FoodLog | null;
  onClose: () => void;
  onSaved: () => void;
};

const MEAL_LABELS: Record<MealType, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
  SNACK: "Snack",
};

const parseNumber = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

export default function FoodLogModal({
  visible,
  mealType,
  date,
  editingLog,
  onClose,
  onSaved,
}: Props) {
  const t = useTheme();
  const styles = useMemo(() => createStyles(t), [t]);
  const [foodName, setFoodName] = useState("");
  const [brand, setBrand] = useState("");
  const [servingSize, setServingSize] = useState("");
  const [servings, setServings] = useState("1");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [barcode, setBarcode] = useState<string | null>(null);
  const [scannerVisible, setScannerVisible] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }
    setError(null);
    if (editingLog) {
      setFoodName(editingLog.foodName);
      setBrand(editingLog.brand ?? "");
      setServingSize(editingLog.servingSize);
      setServings(String(editingLog.servings));
      setCalories(String(editingLog.calories));
      setProtein(String(editingLog.protein));
      setCarbs(String(editingLog.carbs));
      setFat(String(editingLog.fat));
    } else {
      setFoodName("");
      setBrand("");
      setServingSize("");
      setServings("1");
      setCalories("");
      setProtein("");
      setCarbs("");
      setFat("");
    }
    setSearchQuery("");
    setSearchResults([]);
    setSearchError(null);
    setBarcode(null);
    setScannerVisible(false);
  }, [visible, editingLog]);

  const handleSearch = async () => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchError("Type at least 2 characters to search.");
      return;
    }
    setIsSearching(true);
    setSearchError(null);
    try {
      const results = await searchFoods(query);
      setSearchResults(results);
      if (results.length === 0) {
        setSearchError("No foods found. Try a different search or enter values manually.");
      }
    } catch (err) {
      setSearchError(getApiErrorMessage(err, "Food search failed."));
    } finally {
      setIsSearching(false);
    }
  };

  const applySearchResult = (result: FoodSearchResult) => {
    setFoodName(result.description);
    setBrand(result.brand ?? "");
    setServingSize(result.servingSize);
    setServings("1");
    setCalories(String(result.calories));
    setProtein(String(result.protein));
    setCarbs(String(result.carbs));
    setFat(String(result.fat));
    setBarcode(null);
    setSearchResults([]);
    setSearchQuery("");
  };

  const applyBarcodeFood = (food: BarcodeFood) => {
    setFoodName(food.description);
    setBrand(food.brand ?? "");
    setServingSize(food.servingSize);
    setServings("1");
    setCalories(String(food.calories));
    setProtein(String(food.protein));
    setCarbs(String(food.carbs));
    setFat(String(food.fat));
    setBarcode(food.barcode);
    setSearchResults([]);
    setSearchQuery("");
    setScannerVisible(false);
  };

  const handleSave = async () => {
    const trimmedName = foodName.trim();
    const trimmedServingSize = servingSize.trim();
    const servingsNum = parseNumber(servings);
    const caloriesNum = parseNumber(calories);
    const proteinNum = parseNumber(protein);
    const carbsNum = parseNumber(carbs);
    const fatNum = parseNumber(fat);

    if (!trimmedName) {
      setError("Food name is required.");
      return;
    }
    if (!trimmedServingSize) {
      setError("Serving size is required (e.g. 1 cup, 100g).");
      return;
    }
    if (servingsNum === null || servingsNum <= 0) {
      setError("Servings must be a positive number.");
      return;
    }
    if (caloriesNum === null || proteinNum === null || carbsNum === null || fatNum === null) {
      setError("Calories, protein, carbs, and fat must be numbers (0 or more).");
      return;
    }

    const payload = {
      mealType,
      foodName: trimmedName,
      ...(brand.trim() ? { brand: brand.trim() } : {}),
      ...(barcode ? { barcode } : {}),
      servingSize: trimmedServingSize,
      servings: servingsNum,
      calories: Math.round(caloriesNum),
      protein: proteinNum,
      carbs: carbsNum,
      fat: fatNum,
    };

    setIsSaving(true);
    setError(null);
    try {
      if (editingLog) {
        await updateFoodLog(editingLog.id, payload);
      } else {
        await createFoodLog({ ...payload, date });
      }
      onSaved();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not save the food entry."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingLog) {
      return;
    }
    setIsDeleting(true);
    setError(null);
    try {
      await deleteFoodLog(editingLog.id);
      onSaved();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not delete the food entry."));
    } finally {
      setIsDeleting(false);
    }
  };

  const busy = isSaving || isDeleting;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.sheet}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>
              {editingLog ? "Edit" : "Add"} {MEAL_LABELS[mealType]}
            </Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {!editingLog ? (
              <View style={styles.searchSection}>
                <View style={styles.searchRow}>
                  <TextInput
                    style={[styles.input, styles.searchInput]}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search foods (e.g. chicken breast)"
                    placeholderTextColor={t.textFaint}
                    editable={!busy && !isSearching}
                    onSubmitEditing={() => void handleSearch()}
                    returnKeyType="search"
                  />
                  <Pressable
                    style={styles.searchButton}
                    onPress={() => void handleSearch()}
                    disabled={busy || isSearching}
                  >
                    {isSearching ? (
                      <ActivityIndicator color={t.onAccent} size="small" />
                    ) : (
                      <Text style={styles.searchButtonText}>Search</Text>
                    )}
                  </Pressable>
                </View>
                {CAN_SCAN ? (
                  <Pressable
                    style={styles.scanButton}
                    onPress={() => setScannerVisible(true)}
                    disabled={busy || isSearching}
                  >
                    <Text style={styles.scanButtonText}>Scan barcode</Text>
                  </Pressable>
                ) : null}
                {searchError ? <Text style={styles.searchErrorText}>{searchError}</Text> : null}
                {searchResults.slice(0, 10).map((result) => (
                  <Pressable
                    key={result.fdcId}
                    style={styles.searchResult}
                    onPress={() => applySearchResult(result)}
                  >
                    <View style={styles.searchResultInfo}>
                      <Text style={styles.searchResultName} numberOfLines={1}>
                        {result.description}
                      </Text>
                      <Text style={styles.searchResultMeta} numberOfLines={1}>
                        {result.brand ? `${result.brand} - ` : ""}
                        {result.servingSize}
                      </Text>
                    </View>
                    <Text style={styles.searchResultCalories}>{result.calories} cal</Text>
                  </Pressable>
                ))}
                <Text style={styles.orText}>Search and tap a result, or enter manually:</Text>
              </View>
            ) : null}

            <Text style={styles.label}>Food name</Text>
            <TextInput
              style={styles.input}
              value={foodName}
              onChangeText={setFoodName}
              placeholder="e.g. Grilled chicken"
              placeholderTextColor={t.textFaint}
              editable={!busy}
            />

            <Text style={styles.label}>Brand (optional)</Text>
            <TextInput
              style={styles.input}
              value={brand}
              onChangeText={setBrand}
              placeholder="e.g. Kirkland"
              placeholderTextColor={t.textFaint}
              editable={!busy}
            />

            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Serving size</Text>
                <TextInput
                  style={styles.input}
                  value={servingSize}
                  onChangeText={setServingSize}
                  placeholder="e.g. 1 cup"
                  placeholderTextColor={t.textFaint}
                  editable={!busy}
                />
              </View>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Servings</Text>
                <TextInput
                  style={styles.input}
                  value={servings}
                  onChangeText={setServings}
                  keyboardType="decimal-pad"
                  editable={!busy}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Calories</Text>
                <TextInput
                  style={styles.input}
                  value={calories}
                  onChangeText={setCalories}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={t.textFaint}
                  editable={!busy}
                />
              </View>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Protein (g)</Text>
                <TextInput
                  style={styles.input}
                  value={protein}
                  onChangeText={setProtein}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={t.textFaint}
                  editable={!busy}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Carbs (g)</Text>
                <TextInput
                  style={styles.input}
                  value={carbs}
                  onChangeText={setCarbs}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={t.textFaint}
                  editable={!busy}
                />
              </View>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Fat (g)</Text>
                <TextInput
                  style={styles.input}
                  value={fat}
                  onChangeText={setFat}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={t.textFaint}
                  editable={!busy}
                />
              </View>
            </View>

            <Pressable
              style={[styles.saveButton, busy && styles.buttonDisabled]}
              onPress={() => void handleSave()}
              disabled={busy}
            >
              {isSaving ? (
                <ActivityIndicator color={t.onAccent} />
              ) : (
                <Text style={styles.saveButtonText}>{editingLog ? "Save changes" : "Add food"}</Text>
              )}
            </Pressable>

            {editingLog ? (
              <Pressable
                style={[styles.deleteButton, busy && styles.buttonDisabled]}
                onPress={() => void handleDelete()}
                disabled={busy}
              >
                {isDeleting ? (
                  <ActivityIndicator color={t.danger} />
                ) : (
                  <Text style={styles.deleteButtonText}>Delete entry</Text>
                )}
              </Pressable>
            ) : null}

            <Pressable style={styles.cancelButton} onPress={onClose} disabled={busy}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </ScrollView>
        </View>

        {CAN_SCAN ? (
          <BarcodeScannerModal
            visible={scannerVisible}
            onClose={() => setScannerVisible(false)}
            onFound={applyBarcodeFood}
          />
        ) : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.4)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: t.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      maxHeight: "90%",
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 12,
      color: t.text,
    },
    errorText: {
      color: t.danger,
      marginBottom: 8,
    },
    label: {
      fontWeight: "600",
      fontSize: 13,
      marginBottom: 4,
      marginTop: 8,
      color: t.text,
    },
    input: {
      borderWidth: 1,
      borderColor: t.inputBorder,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: t.text,
    },
    row: {
      flexDirection: "row",
      gap: 12,
    },
    rowItem: {
      flex: 1,
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
    deleteButton: {
      borderWidth: 1,
      borderColor: t.danger,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 12,
    },
    deleteButtonText: {
      color: t.danger,
      fontWeight: "700",
    },
    cancelButton: {
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 4,
    },
    cancelButtonText: {
      color: t.textMuted,
      fontWeight: "600",
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    searchSection: {
      marginBottom: 4,
    },
    searchRow: {
      flexDirection: "row",
      gap: 8,
      alignItems: "center",
    },
    searchInput: {
      flex: 1,
    },
    searchButton: {
      backgroundColor: t.primarySolid,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 11,
    },
    searchButtonText: {
      color: t.onAccent,
      fontWeight: "700",
      fontSize: 13,
    },
    scanButton: {
      borderWidth: 1,
      borderColor: t.primary,
      borderRadius: 10,
      paddingVertical: 9,
      alignItems: "center",
      marginTop: 8,
    },
    scanButtonText: {
      color: t.primary,
      fontWeight: "700",
      fontSize: 13,
    },
    searchErrorText: {
      color: t.warn,
      fontSize: 12,
      marginTop: 6,
    },
    searchResult: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 8,
      paddingHorizontal: 10,
      backgroundColor: t.card,
      borderRadius: 10,
      marginTop: 6,
    },
    searchResultInfo: {
      flex: 1,
      paddingRight: 8,
    },
    searchResultName: {
      fontWeight: "600",
      fontSize: 13,
      color: t.text,
    },
    searchResultMeta: {
      color: t.textMuted,
      fontSize: 11,
      marginTop: 1,
    },
    searchResultCalories: {
      fontWeight: "700",
      fontSize: 13,
      color: t.primary,
    },
    orText: {
      color: t.textFaint,
      fontSize: 12,
      marginTop: 10,
    },
  });
