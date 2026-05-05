import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from "react-native";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import { supabase } from "@/lib/supabase";
import { colors, radii } from "@/theme/tokens";

function parseAllParams(url: string): Record<string, string> {
  try {
    const parsed = Linking.parse(url);
    const params: Record<string, string> = {};
    // query params (?key=val)
    for (const [k, v] of Object.entries(parsed.queryParams ?? {})) {
      if (typeof v === "string") params[k] = v;
    }
    // URL fragment (#key=val) — Linking.parse doesn't extract these
    const hashIndex = url.indexOf("#");
    if (hashIndex !== -1) {
      const fragment = url.slice(hashIndex + 1);
      for (const part of fragment.split("&")) {
        const [k, v] = part.split("=");
        if (k && v) params[decodeURIComponent(k)] = decodeURIComponent(v);
      }
    }
    return params;
  } catch {
    return {};
  }
}

export default function Callback() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleUrl = async (url: string) => {
      const params = parseAllParams(url);
      const code = params["code"];
      const accessToken = params["access_token"];
      const refreshToken = params["refresh_token"];

      if (code) {
        const { error: err } = await supabase.auth.exchangeCodeForSession(code);
        if (err) setError(err.message);
        else router.replace("/(tabs)");
      } else if (accessToken && refreshToken) {
        const { error: err } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (err) setError(err.message);
        else router.replace("/(tabs)");
      } else {
        setError("Enlace inválido o expirado.");
      }
    };

    Linking.getInitialURL().then((url) => { if (url) handleUrl(url); });
    const sub = Linking.addEventListener("url", ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, []);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable onPress={() => router.replace("/(auth)/login")} style={styles.retryBtn}>
          <Text style={styles.retryText}>Volver al login</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.accent} />
      <Text style={styles.text}>Verificando sesión...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg, gap: 16, padding: 24 },
  text: { fontSize: 15, color: colors.muted },
  errorText: { fontSize: 15, color: "#E53E3E", textAlign: "center" },
  retryBtn: { marginTop: 8, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: colors.ink, borderRadius: radii.md },
  retryText: { fontSize: 14, fontWeight: "600", color: "#fff" },
});
