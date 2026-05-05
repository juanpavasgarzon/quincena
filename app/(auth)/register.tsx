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

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password) return;
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: getEmailAuthRedirectUri() },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session) {
      toast.success("Cuenta lista");
      return;
    }
    toast.success("Te enviamos un código al correo.");
    router.push({
      pathname: "/(auth)/confirm-email",
      params: { email },
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>Quincena</Text>
          <Text style={styles.sub}>Crea tu cuenta</Text>
        </View>

        <View style={styles.card}>
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
          </View>

          <Pressable
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.btnText}>{loading ? "Un momento..." : "Crear cuenta"}</Text>
          </Pressable>
        </View>

        <Pressable style={styles.loginLink} onPress={() => router.replace("/(auth)/login" as "/")}>
          <Text style={styles.loginLinkText}>
            ¿Ya tienes una cuenta?{" "}
            <Text style={styles.loginLinkAccent}>Inicia sesión</Text>
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
  fields: { gap: 16, marginBottom: 20 },
  field: {},
  label: { fontSize: 12, fontWeight: "600", color: colors.muted, textTransform: "uppercase", letterSpacing: 0.72, paddingHorizontal: 4, marginBottom: 8 },
  inputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: radii.md, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.line, gap: 8 },
  input: { fontSize: 15, color: colors.ink, padding: 0, flex: 1 },
  btn: { backgroundColor: colors.pos, borderRadius: radii.md, paddingVertical: 14, alignItems: "center", shadowColor: colors.pos, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 2 },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontSize: 15, fontWeight: "600", color: "#fff" },
  loginLink: { marginTop: 24, alignItems: "center" },
  loginLinkText: { fontSize: 14, color: colors.muted },
  loginLinkAccent: { color: colors.pos, fontWeight: "600" },
});
