import React, { useCallback } from "react";
import {
  View, Text, ScrollView, Pressable, StyleSheet,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { colors, radii, shadows } from "@/theme/tokens";
import { ScreenHeader } from "@/components/ScreenHeader";
import { usePeriods, computeTotals, PERIODS_QUERY_KEY } from "@/features/periods/usePeriods";
import { useOpenPeriod, OPEN_PERIOD_KEY } from "@/features/periods/useOpenPeriod";
import type { BudgetEntryWithItems } from "@/types/db";
import { formatCOP } from "@/lib/format";
import { BarChart } from "@/components/BarChart";
import { SkeletonCard, SkeletonList } from "@/components/Skeleton";

export default function HomeScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: open, isLoading: loadingOpen } = useOpenPeriod();
  const { data: periods, isLoading: loadingPeriods } = usePeriods();
  const isLoading = loadingOpen || loadingPeriods;

  useFocusEffect(
    useCallback(() => {
      void qc.invalidateQueries({ queryKey: OPEN_PERIOD_KEY });
      void qc.invalidateQueries({ queryKey: PERIODS_QUERY_KEY });
      void Promise.all([
        qc.refetchQueries({ queryKey: OPEN_PERIOD_KEY }),
        qc.refetchQueries({ queryKey: PERIODS_QUERY_KEY }),
      ]);
    }, [qc]),
  );

  const closedPeriods =
    periods?.filter((p) => p.closed_at != null) ?? [];
  const recent = closedPeriods.slice(0, 3);

  const goQuincena = () => router.navigate("/quincena" as "/");
  const goHist = () => router.navigate("/historial" as "/");

  return (
    <View style={styles.root}>
      <ScreenHeader title="Inicio" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 100, flexGrow: 1 }, (!isLoading && !open) && styles.scrollCentered]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={{ paddingHorizontal: 22, gap: 28 }}>
            <SkeletonCard />
            <SkeletonList />
          </View>
        ) : !open ? (
          <EmptyHome onStart={goQuincena} />
        ) : (
          <FilledHome period={open} onGoHist={goHist} recent={recent} />
        )}
      </ScrollView>
    </View>
  );
}

function EmptyHome({ onStart }: { onStart: () => void }) {
  return (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyTitle}>Sin período activo</Text>
      <Pressable style={styles.btnAccent} onPress={onStart}>
        <Text style={styles.btnAccentText}>Ir a Quincena</Text>
      </Pressable>
    </View>
  );
}

function FilledHome({
  period,
  onGoHist,
  recent,
}: {
  period: BudgetEntryWithItems;
  onGoHist: () => void;
  recent: BudgetEntryWithItems[];
}) {
  const { totalExpenses, balance, breakdown } = computeTotals(period);
  const isPos = balance >= 0;

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.pad}>
        {/* Hero card */}
        <View style={[styles.card, styles.heroCard]}>
          <Text style={styles.heroPeriod}>{period.period_label}</Text>
          <Text style={[styles.balanceHero, { color: isPos ? colors.pos : colors.neg }]}>
            {formatCOP(balance)}
          </Text>
          <View style={styles.inOutRow}>
            <View style={styles.inOutItem}>
              <Text style={styles.inOutLabel}>Ingresos</Text>
              <Text style={styles.inOutAmt}>{formatCOP(period.income)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={[styles.inOutItem, { paddingLeft: 16 }]}>
              <Text style={styles.inOutLabel}>Egresos</Text>
              <Text style={styles.inOutAmt}>{formatCOP(totalExpenses)}</Text>
            </View>
          </View>
        </View>
      </View>

      {breakdown.length > 0 ? (
        <View style={styles.pad}>
          <View style={styles.card}>
            <BarChart data={breakdown} />
          </View>
        </View>
        ) : (
        <View style={styles.emptySection}>
          <Text style={styles.emptyText}>Sin gastos.</Text>
        </View>
      )}

      {recent.length > 0 && (
        <View style={styles.pad}>
          <View style={styles.list}>
            {recent.map((p) => {
              const { balance: b } = computeTotals(p);
              return (
                <View key={p.id} style={styles.listRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{p.period_label}</Text>
                    {p.period_sub ? <Text style={styles.rowSub}>{p.period_sub}</Text> : null}
                  </View>
                  <Text style={[styles.rowAmt, { color: b >= 0 ? colors.pos : colors.neg }]}>
                    {b >= 0 ? "+" : ""}{formatCOP(b)}
                  </Text>
                </View>
              );
            })}
            <Pressable style={styles.listFooter} onPress={onGoHist}>
              <Text style={styles.listFooterText}>Historial</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 0, paddingTop: 12 },
  scrollCentered: { flexGrow: 1, justifyContent: "center" },
  pad: { paddingHorizontal: 22, marginBottom: 16 },
  emptyWrap: { paddingHorizontal: 40, alignItems: "center", gap: 22 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadows.sm,
  },
  heroCard: {},
  heroPeriod: { fontSize: 12, fontWeight: "600", color: colors.muted, marginBottom: 10, letterSpacing: 1, textTransform: "uppercase" },
  balanceHero: { fontSize: 42, fontWeight: "700", letterSpacing: -1.2, marginBottom: 22 },
  inOutRow: { flexDirection: "row", paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.line },
  inOutItem: { flex: 1 },
  inOutLabel: { fontSize: 11, color: colors.muted, marginBottom: 5, letterSpacing: 0.8, textTransform: "uppercase" },
  inOutAmt: { fontSize: 16, fontWeight: "600", color: colors.ink, letterSpacing: -0.3 },
  divider: { width: 1, backgroundColor: colors.line },
  list: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.line,
    ...shadows.sm,
  },
  listRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 18, paddingHorizontal: 18, borderTopWidth: 1, borderTopColor: colors.line },
  listFooter: { paddingVertical: 14, alignItems: "center", borderTopWidth: 1, borderTopColor: colors.line },
  listFooterText: { fontSize: 13, fontWeight: "600", color: colors.pos },
  rowTitle: { fontSize: 15, fontWeight: "500", color: colors.ink, letterSpacing: -0.1 },
  rowSub: { fontSize: 12, color: colors.muted, marginTop: 3 },
  rowAmt: { fontSize: 14, fontWeight: "600" },
  btnAccent: { backgroundColor: colors.pos, borderRadius: radii.md, paddingVertical: 15, paddingHorizontal: 28, alignItems: "center", alignSelf: "stretch", marginTop: 4 },
  btnAccentText: { fontSize: 15, fontWeight: "600", color: "#fff" },
  emptyTitle: { fontSize: 17, fontWeight: "600", color: colors.ink },
  emptySection: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 40 },
  emptyText: { fontSize: 14, color: colors.muted },
});
