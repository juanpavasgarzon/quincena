import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Linking from "expo-linking";

/**
 * URL para emailRedirectTo de Supabase. Debe estar en Redirect URLs del dashboard.
 *
 * Expo Go (storeClient): usa exp://… dinámico. Magic links no funcionan bien
 * en Expo Go porque la IP/puerto cambia — usar dev client en su lugar.
 * Dev client / producción: quincena://callback (scheme de app.json).
 */
export function getEmailAuthRedirectUri(): string {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    // Expo Go — URL dinámica, puede no funcionar si cambia la IP
    return Linking.createURL("/--/callback");
  }
  return "quincena://callback";
}
