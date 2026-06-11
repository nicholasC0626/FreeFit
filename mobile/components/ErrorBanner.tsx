import { Pressable, StyleSheet, Text, View } from "react-native";

type ErrorBannerProps = {
  message: string;
  onRetry?: () => void;
};

export default function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
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

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  message: {
    flex: 1,
    color: "#dc2626",
    fontSize: 13,
    paddingRight: 8,
  },
  retryButton: {
    backgroundColor: "#dc2626",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  retryText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
  },
});
