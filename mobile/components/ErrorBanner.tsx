import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme, type Theme } from "../constants/theme";

type ErrorBannerProps = {
  message: string;
  onRetry?: () => void;
};

export default function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  const t = useTheme();
  const styles = useMemo(() => createStyles(t), [t]);

  return (
    <View style={styles.banner}>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <Pressable style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const createStyles = (t: Theme) =>
  StyleSheet.create({
    banner: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: t.dangerBg,
      borderWidth: 1,
      borderColor: t.dangerBorder,
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
    },
    message: {
      flex: 1,
      color: t.danger,
      fontSize: 13,
      paddingRight: 8,
    },
    retryButton: {
      backgroundColor: t.dangerSolid,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 7,
    },
    retryText: {
      color: t.onAccent,
      fontWeight: "700",
      fontSize: 13,
    },
  });
