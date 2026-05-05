import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { BudgetEntryWithItems } from "@/types/db";
import { useAuth } from "@/features/auth/useAuth";

export const PERIODS_QUERY_KEY = ["periods"] as const;

export function usePeriods() {
  const { session } = useAuth();

  return useQuery({
    queryKey: PERIODS_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budget_entries")
        .select("*, budget_line_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as BudgetEntryWithItems[];
      for (const e of rows) {
        if (e.budget_line_items?.length) {
          e.budget_line_items = [...e.budget_line_items].sort(
            (a, b) => (a.position ?? 0) - (b.position ?? 0)
          );
        }
      }
      return rows;
    },
    enabled: !!session,
  });
}

export interface DraftLineItem {
  id: string;
  label: string;
  amount: number;
  is_fixed: boolean;
  source_frequency: "monthly" | "biweekly" | null;
}

export function useSavePeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      period,
      items,
    }: {
      period: { period_label: string; period_sub?: string; income: number };
      items: DraftLineItem[];
    }) => {
      const { data, error } = await supabase.rpc("save_period", {
        p_period: period,
        p_items: items.map((it, i) => ({ ...it, position: i })),
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PERIODS_QUERY_KEY }),
  });
}

export function computeTotals(entry: BudgetEntryWithItems) {
  const items = entry.budget_line_items ?? [];
  const totalExpenses = items.reduce((s, i) => s + (i.amount ?? 0), 0);
  const balance = (entry.income ?? 0) - totalExpenses;
  const breakdown = items
    .map((it) => ({ label: it.label, amount: it.amount ?? 0 }))
    .sort((a, b) => b.amount - a.amount);
  return { totalExpenses, balance, breakdown };
}

export function computeLocalTotals(income: number, items: DraftLineItem[]) {
  const totalExpenses = items.reduce((s, i) => s + (i.amount ?? 0), 0);
  const balance = income - totalExpenses;
  const breakdown = items
    .map((it) => ({ label: it.label, amount: it.amount ?? 0 }))
    .sort((a, b) => b.amount - a.amount);
  return { totalExpenses, balance, breakdown };
}
