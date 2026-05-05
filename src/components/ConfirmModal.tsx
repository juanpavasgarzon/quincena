import React from "react";
import { Modal, View, Text, Pressable, StyleSheet } from "react-native";
import { colors, radii } from "@/theme/tokens";

export interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  cancelLabel?: string;
  confirmLabel: string;
  /** danger = botón rojo; primary = verde */
  confirmVariant?: "danger" | "primary";
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmModal({
  visible,
  title,
  message,
  cancelLabel = "Cancelar",
  confirmLabel,
  confirmVariant = "danger",
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onCancel} accessibilityLabel="Cerrar diálogo" />
        <View style={styles.center} pointerEvents="box-none">
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>{title}</Text>
            <Text style={styles.confirmBody}>{message}</Text>
            <View style={styles.confirmRow}>
              <Pressable style={styles.confirmCancel} onPress={onCancel}>
                <Text style={styles.confirmCancelText}>{cancelLabel}</Text>
              </Pressable>
              <Pressable
                style={confirmVariant === "danger" ? styles.confirmDanger : styles.confirmPrimary}
                onPress={onConfirm}
              >
                <Text style={confirmVariant === "danger" ? styles.confirmDangerText : styles.confirmPrimaryText}>
                  {confirmLabel}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  confirmCard: {
    backgroundColor: "#fff",
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 22,
    width: "100%",
    maxWidth: 400,
    gap: 8,
  },
  confirmTitle: { fontSize: 17, fontWeight: "700", color: colors.ink },
  confirmBody: { fontSize: 14, color: colors.muted, lineHeight: 20 },
  confirmRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  confirmDanger: {
    flex: 1,
    backgroundColor: colors.neg,
    borderRadius: radii.md,
    paddingVertical: 13,
    alignItems: "center",
  },
  confirmDangerText: { fontSize: 14, fontWeight: "600", color: "#fff" },
  confirmPrimary: {
    flex: 1,
    backgroundColor: colors.pos,
    borderRadius: radii.md,
    paddingVertical: 13,
    alignItems: "center",
  },
  confirmPrimaryText: { fontSize: 14, fontWeight: "600", color: "#fff" },
  confirmCancel: {
    flex: 1,
    backgroundColor: colors.surface2,
    borderRadius: radii.md,
    paddingVertical: 13,
    alignItems: "center",
  },
  confirmCancelText: { fontSize: 14, fontWeight: "500", color: colors.ink },
});
