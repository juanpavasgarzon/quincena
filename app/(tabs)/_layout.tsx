import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Tabs, useRouter, usePathname, Redirect } from "expo-router";
import { useAuth } from "@/features/auth/useAuth";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radii } from "@/theme/tokens";
import { haptics } from "@/lib/haptics";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

const TAB_ROUTES: Array<{
  name: string;
  href: string;
  label: string;
  icon: IoniconName;
  iconActive: IoniconName;
}> = [
  { name: "index",     href: "/",           label: "Inicio",    icon: "home-outline",     iconActive: "home" },
  { name: "quincena",  href: "/quincena",   label: "Quincena",  icon: "calendar-outline",   iconActive: "calendar" },
  { name: "historial", href: "/historial",  label: "Historial", icon: "time-outline",     iconActive: "time" },
  { name: "config",    href: "/config",     label: "Configuración",    icon: "settings-outline", iconActive: "settings" },
];

function CustomTabBar() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();

  const activeRoute = pathname === "/" ? "index"
    : pathname.includes("quincena") ? "quincena"
    : pathname.includes("historial") ? "historial"
    : pathname.includes("config") ? "config"
    : "index";

  return (
    <View style={[styles.tabbar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {TAB_ROUTES.map(({ name, href, label, icon, iconActive }) => {
        const active = activeRoute === name;
        return (
          <Pressable
            key={name}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => { haptics.selection(); router.navigate(href as "/"); }}
          >
            <Ionicons
              name={active ? iconActive : icon}
              size={26}
              color={active ? colors.pos : colors.muted2}
            />
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  const { session } = useAuth();

  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      tabBar={() => <CustomTabBar />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="quincena" />
      <Tabs.Screen name="historial" />
      <Tabs.Screen name="config" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabbar: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.97)",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.07)",
    paddingTop: 12,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: radii.sm,
  },
  tabActive: {},
  tabLabel: { fontSize: 11, fontWeight: "500", color: colors.muted2, letterSpacing: -0.1 },
  tabLabelActive: { color: colors.pos, fontWeight: "600" },
});
