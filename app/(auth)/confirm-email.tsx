import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { toast } from "sonner-native";
import { colors, radii } from "@/theme/tokens";
import { supabase } from "@/lib/supabase";
import { getEmailAuthRedirectUri } from "@/features/auth/emailAuthRedirect";

function pickEmail(raw: string | string[] | undefined): string {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return typeof v === "string" ? v.trim() : "";
}

export default function ConfirmEmailScreen() {
  const router = useRouter();
  const { email: emailParam } = useLocalSearchParams<{ email?: string | string[] }>();
  const email = pickEmail(emailParam);

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const handleVerify = async () => {
    const token = code.replace(/\s/g, "");
    if (!email || !token) {
      toast.error("Introduce el código que recibiste por correo.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "signup",
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Correo confirmado");
    router.replace("/(tabs)" as "/");
  };

  const handleResend = async () => {
    if (!email) {
      toast.error("Falta el correo. Vuelve a registrarte.");
      return;
    }
    setResendLoading(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: getEmailAuthRedirectUri() },
    });
    setResendLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Te enviamos otro correo.");
  };

  if (!email) {
    return (
      <View style={[styles.root, styles.missingRoot]}>
        <Text style={styles.missingText}>No hay correo para verificar.</Text>
        <Pressable style={styles.secondaryBtn} onPress={() => router.replace("/(auth)/register" as "/")}>
          <Text style={styles.secondaryBtnText}>Volver a registro</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>Quincena</Text>
          <Text style={styles.sub}>Confirma tu correo</Text>
          <Text style={styles.hint}>
            Escribe el código que enviamos a{"\n"}
            <Text style={styles.emailEmph}>{email}</Text>
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}>Código de confirmación</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={code}
                onChangeText={setCode}
                placeholder="000000"
                placeholderTextColor={colors.muted2}
                autoCapitalize="characters"
                autoCorrect={false}
                keyboardType="default"
                maxLength={12}
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
              />
            </View>
          </View>

          <Pressable
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleVerify}
            disabled={loading}
          >
            <Text style={styles.btnText}>{loading ? "Un momento..." : "Confirmar"}</Text>
          </Pressable>

          <Pressable
            style={[styles.linkBtn, resendLoading && styles.btnDisabled]}
            onPress={handleResend}
            disabled={resendLoading}
          >
            <Text style={styles.linkBtnText}>
              {resendLoading ? "Enviando…" : "Reenviar código"}
            </Text>
          </Pressable>
        </View>

        <Pressable style={styles.footerLink} onPress={() => router.replace("/(auth)/login" as "/")}>
          <Text style={styles.footerLinkText}>
            ¿Ya confirmaste? <Text style={styles.footerAccent}>Inicia sesión</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  missingRoot: { justifyContent: "center", alignItems: "center", padding: 24 },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 20 },
  header: { alignItems: "center", marginBottom: 28 },
  logo: { fontSize: 32, fontWeight: "700", color: colors.ink, letterSpacing: -0.8 },
  sub: { fontSize: 15, color: colors.muted, marginTop: 6 },
  hint: { fontSize: 14, color: colors.muted, marginTop: 14, textAlign: "center", lineHeight: 20 },
  emailEmph: { fontWeight: "600", color: colors.ink },
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
  field: { marginBottom: 20 },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.72,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.line,
  },
  input: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.ink,
    padding: 0,
    flex: 1,
    letterSpacing: 4,
    textAlign: "center",
  },
  btn: {
    backgroundColor: colors.pos,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: colors.pos,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontSize: 15, fontWeight: "600", color: "#fff" },
  linkBtn: { marginTop: 16, alignItems: "center", paddingVertical: 8 },
  linkBtnText: { fontSize: 14, fontWeight: "600", color: colors.pos },
  footerLink: { marginTop: 24, alignItems: "center" },
  footerLinkText: { fontSize: 14, color: colors.muted },
  footerAccent: { color: colors.pos, fontWeight: "600" },
  missingText: { fontSize: 15, color: colors.muted, textAlign: "center", marginBottom: 20 },
  secondaryBtn: {
    alignSelf: "center",
    backgroundColor: colors.surface2,
    borderRadius: radii.md,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: colors.line,
  },
  secondaryBtnText: { fontSize: 14, fontWeight: "600", color: colors.ink },
});
