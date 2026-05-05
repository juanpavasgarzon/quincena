import React, { useState } from "react";
import {
  View, Text, TextInput, Pressable, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { toast } from "sonner-native";
import { colors, radii } from "@/theme/tokens";
import { supabase } from "@/lib/supabase";
import { getEmailAuthRedirectUri } from "@/features/auth/emailAuthRedirect";

type Mode = "login" | "magic";

export default function LoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(error.message);
  };

  const handleMagicLink = async () => {
    if (!email) return;
    setLoading(true);
    const redirectTo = getEmailAuthRedirectUri();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Enlace enviado. Revisa tu correo.");
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>Quincena</Text>
          <Text style={styles.sub}>Tu presupuesto quincenal</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.tabs}>
            {(["login", "magic"] as Mode[]).map((m) => (
              <Pressable key={m} style={[styles.tab, mode === m && styles.tabActive]} onPress={() => setMode(m)}>
                <Text style={[styles.tabText, mode === m && styles.tabTextActive]}>
                  {m === "login" ? "Contraseña" : "Enlace mágico"}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.fields}>
            <View style={styles.field}>
              <Text style={styles.label}>Correo electrónico</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="nombre@correo.com"
                  placeholderTextColor={colors.muted2}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            {mode === "login" && (
              <View style={styles.field}>
                <Text style={styles.label}>Contraseña</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Mínimo 6 caracteres"
                    placeholderTextColor={colors.muted2}
                    secureTextEntry={!showPassword}
                  />
                  <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={colors.muted}
                    />
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          <Pressable
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={mode === "login" ? handleLogin : handleMagicLink}
            disabled={loading}
          >
            <Text style={styles.btnText}>
              {loading ? "Un momento..." : mode === "login" ? "Ingresar" : "Enviar enlace"}
            </Text>
          </Pressable>
        </View>

        <Pressable style={styles.registerLink} onPress={() => router.replace("/(auth)/register" as "/")}>
          <Text style={styles.registerLinkText}>
            ¿No tienes una cuenta?{" "}
            <Text style={styles.registerLinkAccent}>Regístrate</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 20 },
  header: { alignItems: "center", marginBottom: 32 },
  logo: { fontSize: 32, fontWeight: "700", color: colors.ink, letterSpacing: -0.8 },
  sub: { fontSize: 15, color: colors.muted, marginTop: 6 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 22,
    shadowColor: "#111",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
  tabs: { flexDirection: "row", backgroundColor: colors.surface2, borderRadius: radii.sm, padding: 2, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: radii.sm, alignItems: "center" },
  tabActive: { backgroundColor: "#fff", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 1, elevation: 1 },
  tabText: { fontSize: 13, fontWeight: "500", color: colors.muted },
  tabTextActive: { color: colors.ink },
  fields: { gap: 16, marginBottom: 20 },
  field: {},
  label: { fontSize: 12, fontWeight: "600", color: colors.muted, textTransform: "uppercase", letterSpacing: 0.72, paddingHorizontal: 4, marginBottom: 8 },
  inputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: radii.md, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.line, gap: 8 },
  input: { fontSize: 15, color: colors.ink, padding: 0, flex: 1 },
  btn: { backgroundColor: colors.pos, borderRadius: radii.md, paddingVertical: 14, alignItems: "center", shadowColor: colors.pos, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 2 },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontSize: 15, fontWeight: "600", color: "#fff" },
  registerLink: { marginTop: 24, alignItems: "center" },
  registerLinkText: { fontSize: 14, color: colors.muted },
  registerLinkAccent: { color: colors.pos, fontWeight: "600" },
});
