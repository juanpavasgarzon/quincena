import React, { useState, useCallback } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { colors, radii } from "@/theme/tokens";
import { ScreenHeader } from "@/components/ScreenHeader";
import { usePeriods, computeTotals, PERIODS_QUERY_KEY } from "@/features/periods/usePeriods";
import { formatCOP } from "@/lib/format";
import { SkeletonList } from "@/components/Skeleton";

export default function HistorialScreen() {
  const qc = useQueryClient();
  const { data: periods, isLoading } = usePeriods();
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      void qc.invalidateQueries({ queryKey: PERIODS_QUERY_KEY });
      void qc.refetchQueries({ queryKey: PERIODS_QUERY_KEY });
    }, [qc]),
  );

  const closed = periods?.filter((p) => p.closed_at != null) ?? [];

  const toggle = (id: string) => {
    setOpenIds((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title="Historial" />
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.scroll,
          (!isLoading && !closed.length) && styles.scrollCentered,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.pad}><SkeletonList rows={5} /></View>
        ) : !closed.length ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>Vacío</Text>
            <Text style={styles.emptySub}>Aquí quedan períodos cerrados.</Text>
          </View>
        ) : (
          <View style={styles.timeline}>
            {closed.map((p, i) => {
              const { totalExpenses, balance } = computeTotals(p);
              const isOpen = openIds.has(p.id);
              const isLast = i === closed.length - 1;
              return (
                <TimelineEntry
                  key={p.id}
                  period={p}
                  totalExpenses={totalExpenses}
                  balance={balance}
                  isOpen={isOpen}
                  isLast={isLast}
                  onToggle={() => toggle(p.id)}
                />
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function TimelineEntry({ period, totalExpenses, balance, isOpen, isLast, onToggle }: any) {
  const height = useSharedValue(0);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    height.value = withTiming(isOpen ? 1 : 0, { duration: 300 });
    opacity.value = withTiming(isOpen ? 1 : 0, { duration: 220 });
  }, [isOpen]);

  const bodyStyle = useAnimatedStyle(() => ({
    // Altura amplia para listas largas (evita cortar gastos al expandir)
    maxHeight: height.value * 50000,
    opacity: opacity.value,
    overflow: "hidden",
  }));

  const isPos = balance >= 0;

  return (
    <View style={styles.entry}>
      {/* Timeline spine */}
      <View style={styles.spine}>
        <View style={[styles.dot, isOpen && styles.dotActive]} />
        {!isLast && <View style={styles.line} />}
      </View>

      {/* Content */}
      <View style={styles.entryContent}>
        <Pressable style={styles.entryHead} onPress={onToggle}>
          <View style={styles.entryMeta}>
            <Text style={styles.entryLabel}>{period.period_label}</Text>
            {period.period_sub ? (
              <Text style={styles.entrySub}>{period.period_sub}</Text>
            ) : null}
          </View>
          <Text style={[styles.entryBal, { color: isPos ? colors.pos : colors.neg }]}>
            {isPos ? "+" : ""}{formatCOP(balance)}
          </Text>
        </Pressable>

        <Animated.View style={bodyStyle}>
          <View style={styles.entryBody}>
            {/* Summary row */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Ingresos</Text>
                <Text style={styles.summaryVal}>{formatCOP(period.income)}</Text>
              </View>
              <View style={styles.summarySep} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Egresos</Text>
                <Text style={styles.summaryVal}>{formatCOP(totalExpenses)}</Text>
              </View>
            </View>

            {/* Items */}
            {(period.budget_line_items ?? []).length > 0 && (
              <View style={styles.itemsList}>
                {(period.budget_line_items ?? []).map((it: any, idx: number) => (
                  <View key={it.id} style={[styles.itemRow, idx === 0 && { borderTopWidth: 0 }]}>
                    <Text style={styles.itemLabel} numberOfLines={1}>{it.label}</Text>
                    <Text style={styles.itemAmt}>{formatCOP(it.amount)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const DOT_SIZE = 10;
const SPINE_WIDTH = 24;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingTop: 12, paddingBottom: 100 },
  scrollCentered: { flexGrow: 1, justifyContent: "center" },
  pad: { paddingHorizontal: 22 },
  emptyWrap: { paddingHorizontal: 40, alignItems: "center", gap: 6 },
  emptyTitle: { fontSize: 17, fontWeight: "600", color: colors.ink, textAlign: "center" },
  emptySub: { fontSize: 13, color: colors.muted, textAlign: "center" },

  timeline: { paddingHorizontal: 22 },

  entry: { flexDirection: "row", gap: 0 },

  spine: { width: SPINE_WIDTH, alignItems: "center" },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: colors.line,
    borderWidth: 2,
    borderColor: colors.line,
    marginTop: 18,
  },
  dotActive: {
    backgroundColor: colors.pos,
    borderColor: colors.pos,
  },
  line: {
    flex: 1,
    width: 1.5,
    backgroundColor: colors.line,
    marginTop: 4,
    marginBottom: 0,
  },

  entryContent: { flex: 1, paddingBottom: 28 },

  entryHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingTop: 14,
    gap: 14,
  },
  entryMeta: { flex: 1 },
  entryLabel: { fontSize: 15, fontWeight: "600", color: colors.ink, letterSpacing: -0.2 },
  entrySub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  entryBal: { fontSize: 15, fontWeight: "700", letterSpacing: -0.3 },

  entryBody: { marginTop: 12, gap: 12 },

  summaryRow: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.line,
  },
  summaryItem: { flex: 1, paddingVertical: 14, paddingHorizontal: 14 },
  summaryLabel: { fontSize: 11, color: colors.muted, marginBottom: 3 },
  summaryVal: { fontSize: 13, fontWeight: "600", color: colors.ink },
  summarySep: { width: 1, backgroundColor: colors.line },

  itemsList: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: "hidden",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  itemLabel: { fontSize: 14, color: colors.ink, flex: 1, marginRight: 12 },
  itemAmt: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.ink,
    flexShrink: 0,
    marginLeft: 8,
  },
});
