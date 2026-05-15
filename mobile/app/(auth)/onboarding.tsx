import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { upsertProfile } from "../../services/user.service";
import { getApiErrorMessage } from "../../utils/api-error";

type Sex = "MALE" | "FEMALE";
type ActivityLevel =
  | "SEDENTARY"
  | "LIGHTLY_ACTIVE"
  | "MODERATELY_ACTIVE"
  | "VERY_ACTIVE"
  | "EXTREMELY_ACTIVE";
type Goal = "LOSE_FAT" | "MAINTAIN" | "BUILD_MUSCLE";
type ExperienceLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

const STEPS = [
  "Basics",
  "Body Metrics",
  "Activity & Goal",
  "Experience",
] as const;

const ftInToCm = (feet: number, inches: number): number => (feet * 12 + inches) * 2.54;
const lbToKg = (lb: number): number => lb / 2.20462;

export default function OnboardingScreen() {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [age, setAge] = useState("27");
  const [sex, setSex] = useState<Sex>("MALE");
  const [heightFt, setHeightFt] = useState("5");
  const [heightIn, setHeightIn] = useState("10");
  const [weightLb, setWeightLb] = useState("180");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("MODERATELY_ACTIVE");
  const [goal, setGoal] = useState<Goal>("MAINTAIN");
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("BEGINNER");
  const [gymDaysPerWeek, setGymDaysPerWeek] = useState("4");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLastStep = step === STEPS.length - 1;
  const progressLabel = useMemo(() => `Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`, [step]);

  const validateCurrentStep = (): string | null => {
    if (step === 0) {
      const ageValue = Number(age);
      if (!Number.isFinite(ageValue) || ageValue < 13 || ageValue > 100) {
        return "Age must be between 13 and 100";
      }
    }

    if (step === 1) {
      const feet = Number(heightFt);
      const inches = Number(heightIn);
      const pounds = Number(weightLb);

      if (!Number.isFinite(feet) || feet < 3 || feet > 8) {
        return "Height (feet) must be between 3 and 8";
      }
      if (!Number.isFinite(inches) || inches < 0 || inches > 11) {
        return "Height (inches) must be between 0 and 11";
      }
      if (!Number.isFinite(pounds) || pounds < 55 || pounds > 770) {
        return "Weight must be between 55 and 770 lbs";
      }
    }

    if (step === 3) {
      const gymDays = Number(gymDaysPerWeek);
      if (!Number.isFinite(gymDays) || gymDays < 1 || gymDays > 7) {
        return "Gym days per week must be between 1 and 7";
      }
    }

    return null;
  };

  const handleNext = async (): Promise<void> => {
    setErrorMessage(null);
    const validationError = validateCurrentStep();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    if (!isLastStep) {
      setStep((prev) => prev + 1);
      return;
    }

    setIsSubmitting(true);
    try {
      const heightCm = ftInToCm(Number(heightFt), Number(heightIn));
      const weightKg = lbToKg(Number(weightLb));

      await upsertProfile({
        age: Number(age),
        sex,
        heightCm,
        weightKg,
        activityLevel,
        goal,
        experienceLevel,
        preferredUnit: "IMPERIAL",
        gymDaysPerWeek: Number(gymDaysPerWeek),
      });

      router.replace("/(tabs)/nutrition");
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Failed to save onboarding profile."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = (): void => {
    setErrorMessage(null);
    setStep((prev) => Math.max(0, prev - 1));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Onboarding</Text>
      <Text style={styles.step}>{progressLabel}</Text>

      {step === 0 ? (
        <>
          <Text style={styles.label}>Age</Text>
          <TextInput
            keyboardType="number-pad"
            onChangeText={setAge}
            style={styles.input}
            value={age}
          />

          <Text style={styles.label}>Sex</Text>
          <View style={styles.row}>
            <ChoiceButton active={sex === "MALE"} label="Male" onPress={() => setSex("MALE")} />
            <ChoiceButton active={sex === "FEMALE"} label="Female" onPress={() => setSex("FEMALE")} />
          </View>
        </>
      ) : null}

      {step === 1 ? (
        <>
          <Text style={styles.label}>Height (imperial)</Text>
          <View style={styles.row}>
            <TextInput
              keyboardType="number-pad"
              onChangeText={setHeightFt}
              placeholder="ft"
              style={[styles.input, styles.halfInput]}
              value={heightFt}
            />
            <TextInput
              keyboardType="number-pad"
              onChangeText={setHeightIn}
              placeholder="in"
              style={[styles.input, styles.halfInput]}
              value={heightIn}
            />
          </View>

          <Text style={styles.label}>Weight (lb)</Text>
          <TextInput
            keyboardType="number-pad"
            onChangeText={setWeightLb}
            style={styles.input}
            value={weightLb}
          />
        </>
      ) : null}

      {step === 2 ? (
        <>
          <Text style={styles.label}>Activity level</Text>
          <ChoiceGrid
            activeValue={activityLevel}
            options={[
              { label: "Sedentary", value: "SEDENTARY" },
              { label: "Lightly active", value: "LIGHTLY_ACTIVE" },
              { label: "Moderately active", value: "MODERATELY_ACTIVE" },
              { label: "Very active", value: "VERY_ACTIVE" },
              { label: "Extremely active", value: "EXTREMELY_ACTIVE" },
            ]}
            onChange={(value) => setActivityLevel(value as ActivityLevel)}
          />

          <Text style={styles.label}>Goal</Text>
          <ChoiceGrid
            activeValue={goal}
            options={[
              { label: "Lose fat", value: "LOSE_FAT" },
              { label: "Maintain", value: "MAINTAIN" },
              { label: "Build muscle", value: "BUILD_MUSCLE" },
            ]}
            onChange={(value) => setGoal(value as Goal)}
          />
        </>
      ) : null}

      {step === 3 ? (
        <>
          <Text style={styles.label}>Experience level</Text>
          <ChoiceGrid
            activeValue={experienceLevel}
            options={[
              { label: "Beginner", value: "BEGINNER" },
              { label: "Intermediate", value: "INTERMEDIATE" },
              { label: "Advanced", value: "ADVANCED" },
            ]}
            onChange={(value) => setExperienceLevel(value as ExperienceLevel)}
          />

          <Text style={styles.label}>Gym days per week</Text>
          <TextInput
            keyboardType="number-pad"
            onChangeText={setGymDaysPerWeek}
            style={styles.input}
            value={gymDaysPerWeek}
          />
        </>
      ) : null}

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      <View style={styles.actions}>
        <Pressable disabled={step === 0 || isSubmitting} onPress={handleBack} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
        <Pressable disabled={isSubmitting} onPress={handleNext} style={styles.primaryButton}>
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>{isLastStep ? "Finish" : "Next"}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function ChoiceGrid({
  activeValue,
  options,
  onChange,
}: {
  activeValue: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.choiceGrid}>
      {options.map((option) => (
        <ChoiceButton
          active={activeValue === option.value}
          key={option.value}
          label={option.label}
          onPress={() => onChange(option.value)}
        />
      ))}
    </View>
  );
}

function ChoiceButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.choiceButton, active ? styles.choiceButtonActive : null]}>
      <Text style={[styles.choiceButtonText, active ? styles.choiceButtonTextActive : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  step: {
    color: "#6b7280",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  halfInput: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  choiceGrid: {
    gap: 8,
  },
  choiceButton: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  choiceButtonActive: {
    borderColor: "#111827",
    backgroundColor: "#111827",
  },
  choiceButtonText: {
    color: "#111827",
    fontWeight: "500",
  },
  choiceButtonTextActive: {
    color: "#ffffff",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#111827",
    fontWeight: "600",
  },
  primaryButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 10,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  error: {
    color: "#dc2626",
  },
});
