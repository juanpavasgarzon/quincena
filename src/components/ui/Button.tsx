import React from "react";
import { Pressable, Text, StyleSheet, ActivityIndicator, type PressableProps } from "react-native";
import { colors, radii } from "@/theme/tokens";

type Variant = "primary" | "accent" | "soft" | "ghost" | "danger";
type Size = "md" | "sm";

interface ButtonProps extends Omit<PressableProps, "style"> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: React.ReactNode;
  fullWidth?: boolean;
  style?: object;
}

export function Button({ variant = "primary", size = "md", loading, children, fullWidth, disabled, style, ...rest }: ButtonProps) {
  const vs = variantStyles[variant];
  const ss = sizeStyles[size];
  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        ss.btn,
        vs.btn,
        fullWidth && styles.fullWidth,
        (pressed || loading || disabled) && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={vs.textColor} size="small" />
      ) : (
        <Text style={[styles.text, ss.text, { color: vs.textColor }]}>{children}</Text>
      )}
    </Pressable>
  );
}

const variantStyles: Record<Variant, { btn: object; textColor: string }> = {
  primary: { btn: { backgroundColor: colors.pos, shadowColor: colors.pos, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 2 }, textColor: "#fff" },
  accent:  { btn: { backgroundColor: colors.pos, shadowColor: colors.pos, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 2 }, textColor: "#fff" },
  soft:    { btn: { backgroundColor: colors.surface2 }, textColor: colors.ink },
  ghost:   { btn: { backgroundColor: "transparent" }, textColor: colors.ink },
  danger:  { btn: { backgroundColor: "transparent" }, textColor: colors.neg },
};

const sizeStyles: Record<Size, { btn: object; text: object }> = {
  md: { btn: { paddingVertical: 14, paddingHorizontal: 18, borderRadius: radii.md }, text: { fontSize: 15 } },
  sm: { btn: { paddingVertical: 9, paddingHorizontal: 12, borderRadius: radii.sm }, text: { fontSize: 13.5 } },
};

const styles = StyleSheet.create({
  base: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  fullWidth: { width: "100%" },
  text: { fontWeight: "600", letterSpacing: -0.15 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.45 },
});
