import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, Modal, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radii } from "@/theme/tokens";
import { useAuth } from "@/features/auth/useAuth";
import { ConfirmModal } from "@/components/ConfirmModal";

interface Props {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  info?: string;
  /** Oculta el ícono de cerrar sesión (las pestañas principal lo muestran por defecto). */
  hideSignOut?: boolean;
}

export function ScreenHeader({ title, right, info, hideSignOut = false }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, signOut } = useAuth();
  const canGoBack = router.canGoBack();
  const [infoVisible, setInfoVisible] = useState(false);
  const [signOutVisible, setSignOutVisible] = useState(false);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.row}>
        <View style={styles.leftSlot}>
          {canGoBack ? (
            <Pressable
              style={styles.backBtn}
              onPress={() => router.back()}
              hitSlop={12}
            >
              <Ionicons name="chevron-back" size={24} color={colors.ink} />
            </Pressable>
          ) : (
            <View style={styles.backPlaceholder} />
          )}
        </View>

        <View style={styles.titleWrap}>
          <Text style={styles.title}>{title}</Text>
        </View>

        <View style={styles.rightSlot}>
          <View style={styles.rightCluster}>
            {!right && info ? (
              <Pressable onPress={() => setInfoVisible(true)} hitSlop={12}>
                <Ionicons name="information-circle-outline" size={20} color={colors.muted} />
              </Pressable>
            ) : null}
            {right}
            {session && !hideSignOut ? (
              <Pressable
                onPress={() => setSignOutVisible(true)}
                hitSlop={14}
                accessibilityLabel="Cerrar sesión"
              >
                <Ionicons name="log-out-outline" size={22} color={colors.muted} />
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>

      {info ? (
        <Modal visible={infoVisible} transparent animationType="fade" onRequestClose={() => setInfoVisible(false)}>
          <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setInfoVisible(false)}>
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>{title}</Text>
              <Text style={styles.infoBody}>{info}</Text>
              <Pressable style={styles.infoClose} onPress={() => setInfoVisible(false)}>
                <Text style={styles.infoCloseText}>Entendido</Text>
              </Pressable>
            </View>
          </TouchableOpacity>
        </Modal>
      ) : null}

      {session && !hideSignOut ? (
        <ConfirmModal
          visible={signOutVisible}
          title="Cerrar sesión"
          message="¿Salir?"
          cancelLabel="Cancelar"
          confirmLabel="Salir"
          confirmVariant="danger"
          onCancel={() => setSignOutVisible(false)}
          onConfirm={() => {
            setSignOutVisible(false);
            void signOut();
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 40,
  },
  leftSlot: {
    width: 36,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  backPlaceholder: { width: 32, height: 32 },
  titleWrap: { flex: 1, minWidth: 0 },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.35,
  },
  rightSlot: {
    flexShrink: 0,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  rightCluster: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: radii.lg,
    padding: 24,
    width: "100%",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  infoTitle: { fontSize: 17, fontWeight: "700", color: colors.ink, letterSpacing: -0.3 },
  infoBody: { fontSize: 14, color: colors.muted, lineHeight: 21 },
  infoClose: {
    marginTop: 6,
    backgroundColor: colors.pos,
    borderRadius: radii.md,
    paddingVertical: 12,
    alignItems: "center",
  },
  infoCloseText: { fontSize: 14, fontWeight: "600", color: "#fff" },
});
