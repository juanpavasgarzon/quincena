import { create } from "zustand";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthState {
  session: Session | null;
  loading: boolean;
  setSession: (session: Session | null) => void;
  signOut: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  session: null,
  loading: true,
  setSession: (session) => set({ session, loading: false }),
  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null });
  },
}));

// Call this once at app root to wire up Supabase auth listener
export function initAuthListener() {
  supabase.auth.getSession().then(({ data: { session } }) => {
    useAuth.getState().setSession(session);
  });

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    useAuth.getState().setSession(session);
  });

  return () => subscription.unsubscribe();
}
