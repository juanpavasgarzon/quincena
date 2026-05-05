import React from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolateColor } from "react-native-reanimated";
import { colors } from "@/theme/tokens";
import { haptics } from "@/lib/haptics";

interface ToggleProps {
  value: boolean;
  onValueChange: (v: boolean) => void;
}

export function Toggle({ value, onValueChange }: ToggleProps) {
  const progress = useSharedValue(value ? 1 : 0);

  React.useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, { duration: 200 });
  }, [value]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.lineStrong, colors.pos]
    ),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(value ? 18 : 0, { duration: 200 }) }],
  }));

  return (
    <Pressable
      role="switch"
      accessibilityState={{ checked: value }}
      onPress={() => { haptics.selection(); onValueChange(!value); }}
    >
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 44,
    height: 26,
    borderRadius: 999,
    justifyContent: "center",
    padding: 2,
  },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
});
