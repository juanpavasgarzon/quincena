import { Stack, Redirect } from "expo-router";
import { useAuth } from "@/features/auth/useAuth";

export default function AuthLayout() {
  const { session } = useAuth();

  if (session) return <Redirect href="/(tabs)" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
