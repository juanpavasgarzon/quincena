import { formatCOP } from "@/lib/format";
import { haptics } from "@/lib/haptics";
import { colors, radii } from "@/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

interface StickyBalanceProps {
  balance: number;
  income: number;
  totalExpenses: number;
  /** Quincena abierta: sincronización en segundo plano */
  autoSyncLabel?: string;
  /** Acción principal (p. ej. Iniciar quincena) */
  primaryAction?: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
    loading?: boolean;
  };
  /** Acción secundaria (p. ej. cerrar quincena) */
  secondaryAction?: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
  };
  /** Notifica si el panel está expandido (balance + acciones visibles). */
  onExpandedChange?: (expanded: boolean) => void;
}

export function StickyBalance({
  balance,
  income,
  totalExpenses,
  autoSyncLabel,
  primaryAction,
  secondaryAction,
  onExpandedChange,
}: StickyBalanceProps) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    onExpandedChange?.(expanded);
  }, [expanded, onExpandedChange]);

  const isNeg = balance < 0;
  const progress = useSharedValue(isNeg ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(isNeg ? 1 : 0, { duration: 300 });
  }, [isNeg]);

  const balanceColorStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [colors.pos, colors.neg]),
  }));

  const toggleExpanded = () => {
    haptics.selection();
    setExpanded((v) => !v);
  };

  return (
    <View style={[styles.container, !expanded && styles.containerCollapsed]}>
      {expanded ? (
        <>
          <View style={styles.collapseHandleRow}>
            <Pressable
              style={styles.collapseIconHit}
              onPress={toggleExpanded}
              hitSlop={16}
              accessibilityLabel="Ocultar panel"
              accessibilityRole="button"
            >
              <Ionicons name="chevron-down" size={24} color={colors.ink} />
            </Pressable>
          </View>

          <View style={styles.row}>
            <View style={styles.balanceSection}>
              <Text style={styles.label}>Balance</Text>
              <Animated.Text style={[styles.balance, balanceColorStyle]}>{formatCOP(balance)}</Animated.Text>
            </View>
            <View style={styles.statsSection}>
              <Text style={styles.stat}>
                Ingreso <Text style={styles.statNum}>{formatCOP(income)}</Text>
              </Text>
              <Text style={styles.stat}>
                Gastos <Text style={styles.statNum}>{formatCOP(totalExpenses)}</Text>
              </Text>
            </View>
          </View>

          {autoSyncLabel ? <Text style={styles.autoHint}>{autoSyncLabel}</Text> : null}

          {primaryAction ? (
            <Pressable
              style={[
                styles.saveBtn,
                (primaryAction.disabled || primaryAction.loading) && styles.saveBtnDisabled,
              ]}
              onPress={primaryAction.onPress}
              disabled={primaryAction.disabled || primaryAction.loading}
            >
              <Text style={styles.saveBtnText}>
                {primaryAction.loading ? "Procesando..." : primaryAction.label}
              </Text>
            </Pressable>
          ) : null}

          {secondaryAction ? (
            <Pressable
              style={[styles.secondaryBtn, secondaryAction.disabled && styles.secondaryBtnDisabled]}
              onPress={secondaryAction.onPress}
              disabled={secondaryAction.disabled}
            >
              <Text style={styles.secondaryBtnText}>{secondaryAction.label}</Text>
            </Pressable>
          ) : null}
        </>
      ) : (
        <View style={styles.collapsedRoot}>
          <Pressable
            style={styles.collapsedExpandHit}
            onPress={toggleExpanded}
            hitSlop={12}
            accessibilityLabel="Balance y opciones"
            accessibilityRole="button"
          >
            <Ionicons name="chevron-up" size={22} color={colors.muted} />
            <Text style={styles.collapsedExpandLabel}>Balance y opciones</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderTopWidth: 1,
    borderTopColor: colors.line,
    padding: 20,
    gap: 14,
  },
  containerCollapsed: {
    paddingVertical: 2,
    paddingHorizontal: 12,
    gap: 0,
  },
  collapsedRoot: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  balanceSection: { gap: 4, flex: 1 },
  collapseHandleRow: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: 2,
  },
  label: { fontSize: 11, color: colors.muted, fontWeight: "600", letterSpacing: 0.8, textTransform: "uppercase" },
  balance: { fontSize: 26, fontWeight: "700", letterSpacing: -0.65 },
  collapseIconHit: {
    paddingVertical: 2,
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  collapsedExpandHit: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  collapsedExpandLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.ink,
    letterSpacing: -0.2,
  },
  statsSection: { alignItems: "flex-end", gap: 6 },
  stat: { fontSize: 11, color: colors.muted },
  statNum: { color: colors.ink2, fontWeight: "600", fontSize: 13 },
  autoHint: { fontSize: 11, color: colors.muted2, textAlign: "center" },
  saveBtn: {
    backgroundColor: colors.pos,
    borderRadius: radii.md,
    paddingVertical: 15,
    alignItems: "center",
    shadowColor: colors.pos,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  saveBtnDisabled: { opacity: 0.45, shadowOpacity: 0 },
  saveBtnText: { fontSize: 15, fontWeight: "600", color: "#fff", letterSpacing: -0.15 },
  secondaryBtn: {
    backgroundColor: colors.surface2,
    borderRadius: radii.md,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.line,
  },
  secondaryBtnDisabled: { opacity: 0.45 },
  secondaryBtnText: { fontSize: 15, fontWeight: "600", color: colors.ink, letterSpacing: -0.15 },
});
