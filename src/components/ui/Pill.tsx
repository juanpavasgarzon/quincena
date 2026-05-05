import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, radii } from "@/theme/tokens";

type Tone = "default" | "accent" | "pos" | "neg";

interface PillProps {
  children: React.ReactNode;
  tone?: Tone;
  mono?: boolean;
}

export function Pill({ children, tone = "default", mono = false }: PillProps) {
  const ts = toneStyles[tone];
  return (
    <View style={[styles.pill, ts.bg]}>
      <Text style={[styles.text, ts.text, mono && styles.mono]}>{children}</Text>
    </View>
  );
}

const toneStyles: Record<Tone, { bg: object; text: object }> = {
  default: { bg: { backgroundColor: colors.surface2 },    text: { color: colors.ink2 } },
  accent:  { bg: { backgroundColor: colors.accentSoft },  text: { color: colors.accentInk } },
  pos:     { bg: { backgroundColor: colors.posBg },       text: { color: colors.posText } },
  neg:     { bg: { backgroundColor: colors.negBg },       text: { color: colors.negText } },
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  mono: {
    fontVariant: ["tabular-nums"],
  },
});
