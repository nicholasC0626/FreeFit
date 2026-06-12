import { Link, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useTheme, type Theme } from "../../constants/theme";
import { register } from "../../services/auth.service";
import { getApiErrorMessage } from "../../utils/api-error";
import { validateEmail, validateName, validatePassword } from "../../utils/auth-validation";

export default function RegisterScreen() {
  const router = useRouter();
  const t = useTheme();
  const styles = useMemo(() => createStyles(t), [t]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (): Promise<void> => {
    setErrorMessage(null);
    const firstNameError = validateName("First name", firstName);
    if (firstNameError) {
      setErrorMessage(firstNameError);
      return;
    }

    const lastNameError = validateName("Last name", lastName);
    if (lastNameError) {
      setErrorMessage(lastNameError);
      return;
    }

    const emailError = validateEmail(email);
    if (emailError) {
      setErrorMessage(emailError);
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setErrorMessage(passwordError);
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      router.replace("/(tabs)/nutrition");
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Registration failed. Check your inputs and try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create account</Text>
      <TextInput
        onChangeText={setFirstName}
        placeholder="First name"
        placeholderTextColor={t.textFaint}
        style={styles.input}
        value={firstName}
      />
      <TextInput
        onChangeText={setLastName}
        placeholder="Last name"
        placeholderTextColor={t.textFaint}
        style={styles.input}
        value={lastName}
      />
      <TextInput
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor={t.textFaint}
        style={styles.input}
        value={email}
      />
      <TextInput
        autoCapitalize="none"
        onChangeText={setPassword}
        placeholder="Password (8+ chars, upper/lower/number/symbol)"
        placeholderTextColor={t.textFaint}
        secureTextEntry
        style={styles.input}
        value={password}
      />
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <Pressable disabled={isSubmitting} onPress={handleRegister} style={styles.button}>
        {isSubmitting ? (
          <ActivityIndicator color={t.onAccent} />
        ) : (
          <Text style={styles.buttonText}>Create Account</Text>
        )}
      </Pressable>

      <Link href="/(auth)/login" style={styles.link}>
        Already have an account? Sign in
      </Link>
    </View>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: 20,
      gap: 12,
      backgroundColor: t.background,
    },
    title: {
      fontSize: 28,
      fontWeight: "700",
      marginBottom: 8,
      color: t.text,
    },
    input: {
      borderWidth: 1,
      borderColor: t.inputBorder,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      color: t.text,
    },
    button: {
      marginTop: 8,
      backgroundColor: t.cta,
      borderRadius: 10,
      minHeight: 46,
      alignItems: "center",
      justifyContent: "center",
    },
    buttonText: {
      color: t.onAccent,
      fontSize: 16,
      fontWeight: "600",
    },
    errorText: {
      color: t.danger,
    },
    link: {
      color: t.link,
      textAlign: "center",
      marginTop: 4,
    },
  });
