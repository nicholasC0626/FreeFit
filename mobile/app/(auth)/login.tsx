import { Link, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useTheme, type Theme } from "../../constants/theme";
import { login } from "../../services/auth.service";
import { getApiErrorMessage } from "../../utils/api-error";
import { validateEmail } from "../../utils/auth-validation";

export default function LoginScreen() {
  const router = useRouter();
  const t = useTheme();
  const styles = useMemo(() => createStyles(t), [t]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (): Promise<void> => {
    setErrorMessage(null);
    const emailError = validateEmail(email);
    if (emailError) {
      setErrorMessage(emailError);
      return;
    }
    if (!password) {
      setErrorMessage("Password is required");
      return;
    }

    setIsSubmitting(true);
    try {
      await login({
        email: email.trim().toLowerCase(),
        password,
      });
      router.replace("/(tabs)/nutrition");
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Login failed. Check your email and password."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
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
        placeholder="Password"
        placeholderTextColor={t.textFaint}
        secureTextEntry
        style={styles.input}
        value={password}
      />
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <Pressable disabled={isSubmitting} onPress={handleLogin} style={styles.button}>
        {isSubmitting ? (
          <ActivityIndicator color={t.onAccent} />
        ) : (
          <Text style={styles.buttonText}>Sign In</Text>
        )}
      </Pressable>

      <Link href="/(auth)/register" style={styles.link}>
        Create an account
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
