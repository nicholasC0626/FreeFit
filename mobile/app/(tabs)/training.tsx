import { StyleSheet, Text, View } from "react-native";

export default function TrainingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Training</Text>
      <Text style={styles.subtitle}>Programs and workout logging will go here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    textAlign: "center",
    color: "#6b7280",
  },
});
