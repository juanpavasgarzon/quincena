import React, { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, type TextInputProps } from "react-native";
import { colors, radii } from "@/theme/tokens";

interface AmountInputProps extends Omit<TextInputProps, "value" | "onChangeText" | "onChange"> {
  label?: string;
  value: number;
  onChange: (v: number) => void;
  size?: "default" | "hero";
  error?: string;
}

function formatThousands(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function AmountInput({ label, value, onChange, size = "default", error, ...rest }: AmountInputProps) {
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState(() =>
    value === 0 ? "" : formatThousands(value)
  );

  useEffect(() => {
    if (focused) return;
    setText(value === 0 ? "" : formatThousands(value));
  }, [value, focused]);

  const handleChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    const num = digits === "" ? 0 : parseInt(digits, 10);
    setText(digits === "" ? "" : formatThousands(num));
    onChange(num);
  };

  const handleBlur = () => {
    setFocused(false);
    if (value > 0) setText(formatThousands(value));
  };

  return (
    <View style={styles.field}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.wrap, focused && styles.focused]}>
        <TextInput
          style={[styles.input, size === "hero" && styles.inputHero]}
          value={text}
          onChangeText={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          keyboardType="numeric"
          placeholderTextColor={colors.muted2}
          placeholder="0"
          {...rest}
        />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 0 },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.72,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.line,
  },
  focused: { borderWidth: 2, borderColor: colors.pos },
  input: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.ink,
    letterSpacing: -0.15,
    padding: 0,
  },
  inputHero: {
    fontSize: 24,
    fontWeight: "600",
    letterSpacing: -0.6,
  },
  error: { fontSize: 12, color: colors.neg, marginTop: 4, paddingHorizontal: 4 },
});
