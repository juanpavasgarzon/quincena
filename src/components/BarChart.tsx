import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "@/theme/tokens";
import { formatCOP } from "@/lib/format";

interface BarData {
  label: string;
  amount: number;
}

interface BarChartProps {
  data: BarData[];
  showCount?: number;
}

export function BarChart({ data, showCount = 8 }: BarChartProps) {
  const top = data.slice(0, showCount);
  const total = data.reduce((s, d) => s + d.amount, 0);

  return (
    <View>
      {top.map((d, i) => {
        const share = total > 0 ? (d.amount / total) * 100 : 0;
        return (
          <View key={`${d.label}-${i}`} style={styles.row}>
            <Text style={styles.name} numberOfLines={1}>{d.label}</Text>
            <Text style={styles.pct}>{share.toFixed(0)}%</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  name: { fontSize: 14, color: colors.ink2, flex: 1, marginRight: 12 },
  pct: { fontSize: 14, fontWeight: "600", color: colors.ink },
});
