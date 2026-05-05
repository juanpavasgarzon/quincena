import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { colors, radii } from "@/theme/tokens";
import { Pill } from "@/components/ui/Pill";
import type { DraftLineItem } from "@/features/periods/usePeriods";

interface LineItemRowProps {
  item: DraftLineItem;
  onUpdate: (patch: Partial<DraftLineItem>) => void;
  onRemove: () => void;
}

export function LineItemRow({ item, onUpdate, onRemove }: LineItemRowProps) {
  const formatThousands = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  const [amtText, setAmtText] = useState(
    item.amount === 0 ? "" : formatThousands(item.amount)
  );

  const handleAmtChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    const num = digits === "" ? 0 : parseInt(digits, 10);
    setAmtText(digits === "" ? "" : formatThousands(num));
    onUpdate({ amount: num });
  };

  const handleAmtBlur = () => {
    if (item.amount > 0) setAmtText(formatThousands(item.amount));
  };

  return (
    <View style={styles.row}>
      <View style={styles.labelCol}>
        <TextInput
          style={styles.labelInput}
          value={item.label}
          onChangeText={(t) => onUpdate({ label: t })}
          placeholder="Descripción"
          placeholderTextColor={colors.muted2}
        />
        <View style={styles.meta}>
          {item.is_fixed && item.source_frequency === "monthly" && (
            <Pill tone="accent" mono>÷2</Pill>
          )}
          {!item.is_fixed && <Pill>Variable</Pill>}
        </View>
      </View>
      <View style={styles.amtWrap}>
        <TextInput
          style={styles.amtInput}
          value={amtText}
          onChangeText={handleAmtChange}
          onBlur={handleAmtBlur}
          keyboardType="numeric"
          placeholderTextColor={colors.muted2}
          placeholder="0"
        />
      </View>
      <Pressable
        style={({ pressed }) => [styles.del, pressed && styles.delPressed]}
        onPress={() => onRemove()}
        accessibilityLabel="Eliminar gasto"
        hitSlop={8}
      >
        <Text style={styles.delText}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  labelCol: { flex: 1, minWidth: 0 },
  labelInput: {
    fontSize: 14.5,
    color: colors.ink,
    letterSpacing: -0.1,
    padding: 0,
    paddingVertical: 4,
  },
  meta: { flexDirection: "row", gap: 6, marginTop: 2 },
  amtWrap: {
    width: 120,
    backgroundColor: colors.surface2,
    borderRadius: radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  amtInput: {
    fontSize: 14.5,
    fontWeight: "500",
    color: colors.ink,
    textAlign: "right",
    padding: 0,
  },
  del: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.sm,
  },
  delPressed: { opacity: 0.65 },
  delText: { fontSize: 16, fontWeight: "500", color: colors.muted2 },
});
