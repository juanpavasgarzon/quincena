import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors, radii } from "@/theme/tokens";

interface Option<T> {
  label: string;
  value: T;
}

interface SegmentedProps<T> {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
}

export function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  return (
    <View style={styles.container}>
      {options.map((opt) => (
        <Pressable
          key={String(opt.value)}
          style={[styles.option, value === opt.value && styles.active]}
          onPress={() => onChange(opt.value)}
        >
          <Text style={[styles.text, value === opt.value && styles.activeText]}>
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: colors.surface2,
    borderRadius: radii.sm,
    padding: 2,
    gap: 2,
    alignSelf: "flex-start",
  },
  option: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: radii.sm,
  },
  active: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 1,
    elevation: 1,
  },
  text: { fontSize: 12.5, fontWeight: "500", color: colors.muted, letterSpacing: -0.1 },
  activeText: { color: colors.ink },
});
