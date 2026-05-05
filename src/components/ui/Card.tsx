import React from "react";
import { View, StyleSheet, type ViewProps } from "react-native";
import { colors, radii, shadows } from "@/theme/tokens";

interface CardProps extends ViewProps {
  variant?: "default" | "flat";
  children: React.ReactNode;
  padding?: number;
}

export function Card({ variant = "default", children, style, padding = 18, ...rest }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        variant === "flat" ? styles.flat : styles.shadow,
        { padding },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
  },
  shadow: {
    ...shadows.card,
  },
  flat: {
    borderWidth: 1,
    borderColor: colors.line,
  },
});
