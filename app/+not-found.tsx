import { View, Text, StyleSheet } from "react-native";
import { Link } from "expo-router";
import { colors } from "@/theme/tokens";

export default function NotFound() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pantalla no encontrada</Text>
      <Link href="/(tabs)" style={styles.link}>
        <Text style={styles.linkText}>Ir al inicio</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg, padding: 24 },
  title: { fontSize: 18, fontWeight: "600", color: colors.ink, marginBottom: 16 },
  link: {},
  linkText: { fontSize: 15, color: colors.accent },
});
