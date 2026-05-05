import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, type TextInputProps } from "react-native";
import { colors, radii } from "@/theme/tokens";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  size?: "default" | "large";
}

export function Input({ label, error, size = "default", style, ...rest }: InputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.wrap,
          size === "large" && styles.wrapLg,
          focused && styles.focused,
          error ? styles.errorBorder : null,
        ]}
      >
        <TextInput
          style={[styles.input, size === "large" && styles.inputLg, style]}
          placeholderTextColor={colors.muted2}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
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
  wrapLg: { paddingVertical: 18, paddingHorizontal: 18 },
  focused: { borderWidth: 2, borderColor: colors.pos },
  errorBorder: { borderColor: colors.neg },
  input: {
    fontSize: 15,
    color: colors.ink,
    letterSpacing: -0.15,
    padding: 0,
  },
  inputLg: { fontSize: 36, fontWeight: "600", letterSpacing: -1.1 },
  error: { fontSize: 12, color: colors.neg, marginTop: 4, paddingHorizontal: 4 },
});
