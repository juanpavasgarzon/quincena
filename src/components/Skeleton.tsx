import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from "react-native-reanimated";
import { colors, radii } from "@/theme/tokens";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export function Skeleton({ width, height = 16, borderRadius = 4, style }: SkeletonProps) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.4, { duration: 800 }),
      -1,
      true
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        styles.base,
        { height, borderRadius, width: width as number },
        animStyle,
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <Skeleton width="60%" height={14} style={{ marginBottom: 12 }} />
      <Skeleton width="40%" height={40} style={{ marginBottom: 20 }} />
      <Skeleton width="100%" height={1} style={{ marginBottom: 16 }} />
      <View style={styles.row}>
        <Skeleton width="45%" height={12} />
        <Skeleton width="35%" height={12} />
      </View>
    </View>
  );
}

export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={styles.listRow}>
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton width="55%" height={14} />
            <Skeleton width="35%" height={11} />
          </View>
          <Skeleton width={80} height={14} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: colors.surface2 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 22,
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  list: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.line,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
});
