import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { BudgetEntryWithItems } from "@/types/db";
import { useAuth } from "@/features/auth/useAuth";
import { PERIODS_QUERY_KEY } from "@/features/periods/usePeriods";
import type { PeriodDraft } from "@/features/periods/usePeriodDraft";
import type { DraftLineItem } from "@/features/periods/usePeriods";

export const OPEN_PERIOD_KEY = ["period", "open"] as const;

function mapRowsToEntry(data: BudgetEntryWithItems | null): BudgetEntryWithItems | null {
  if (!data) return null;
  return data;
}

export function useOpenPeriod() {
  const { session } = useAuth();

  return useQuery({
    queryKey: OPEN_PERIOD_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budget_entries")
        .select("*, budget_line_items(*)")
        .is("closed_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      const entry = data as BudgetEntryWithItems | null;
      if (entry?.budget_line_items) {
        entry.budget_line_items = [...entry.budget_line_items].sort(
          (a, b) => (a.position ?? 0) - (b.position ?? 0)
        );
      }
      return mapRowsToEntry(entry);
    },
    enabled: !!session,
  });
}

export function entryToDraftLineItems(items: BudgetEntryWithItems["budget_line_items"]): DraftLineItem[] {
  return (items ?? []).map((it) => ({
    id: it.id,
    label: it.label ?? "",
    amount: it.amount ?? 0,
    is_fixed: it.is_fixed,
    source_frequency: it.source_frequency,
  }));
}

export function useCreateOpenPeriod() {
  const qc = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async (draft: PeriodDraft) => {
      const uid = session?.user?.id;
      if (!uid) throw new Error("Sesión requerida");

      const { data: entry, error: e1 } = await supabase
        .from("budget_entries")
        .insert({
          user_id: uid,
          period_label: draft.period_label.trim(),
          period_sub: draft.period_sub?.trim() || null,
          income: draft.income,
          closed_at: null,
        })
        .select()
        .single();
      if (e1) throw e1;

      const rows = draft.items.map((it, i) => ({
        entry_id: entry.id,
        label: (it.label.trim() || "Gasto").slice(0, 500),
        amount: it.amount,
        is_fixed: it.is_fixed,
        source_frequency: it.source_frequency,
        position: i,
      }));

      if (rows.length) {
        const { error: e2 } = await supabase.from("budget_line_items").insert(rows);
        if (e2) throw e2;
      }

      return entry.id as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: OPEN_PERIOD_KEY });
      qc.invalidateQueries({ queryKey: PERIODS_QUERY_KEY });
    },
  });
}

export function useCloseOpenPeriod() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (entryId: string) => {
      const { error } = await supabase
        .from("budget_entries")
        .update({ closed_at: new Date().toISOString() })
        .eq("id", entryId)
        .is("closed_at", null);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: OPEN_PERIOD_KEY });
      qc.invalidateQueries({ queryKey: PERIODS_QUERY_KEY });
    },
  });
}

export interface SyncReplacements {
  [tempId: string]: string;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isPersistedLineId(id: string) {
  return UUID_RE.test(id);
}

export function useSyncOpenPeriod() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      entryId,
      draft,
    }: {
      entryId: string;
      draft: PeriodDraft;
    }): Promise<SyncReplacements> => {
      const { error: e1 } = await supabase
        .from("budget_entries")
        .update({
          period_label: draft.period_label.trim(),
          period_sub: draft.period_sub?.trim() || null,
          income: draft.income,
        })
        .eq("id", entryId)
        .is("closed_at", null);
      if (e1) throw e1;

      const { data: existing, error: e2 } = await supabase
        .from("budget_line_items")
        .select("id")
        .eq("entry_id", entryId);
      if (e2) throw e2;

      const isTempId = (id: string) => !isPersistedLineId(id);
      const clientDbIds = draft.items.filter((it) => !isTempId(it.id)).map((it) => it.id);
      const toDelete = (existing ?? []).map((r) => r.id).filter((id) => !clientDbIds.includes(id));
      if (toDelete.length) {
        const { error: e3 } = await supabase.from("budget_line_items").delete().in("id", toDelete);
        if (e3) throw e3;
      }

      const replacements: SyncReplacements = {};

      for (let i = 0; i < draft.items.length; i++) {
        const it = draft.items[i];
        const label = (it.label.trim() || "Gasto").slice(0, 500);
        if (isTempId(it.id)) {
          const { data: row, error: e4 } = await supabase
            .from("budget_line_items")
            .insert({
              entry_id: entryId,
              label,
              amount: it.amount,
              is_fixed: it.is_fixed,
              source_frequency: it.source_frequency,
              position: i,
            })
            .select("id")
            .single();
          if (e4) throw e4;
          replacements[it.id] = row.id;
        } else {
          const { error: e5 } = await supabase
            .from("budget_line_items")
            .update({
              label,
              amount: it.amount,
              is_fixed: it.is_fixed,
              source_frequency: it.source_frequency,
              position: i,
            })
            .eq("id", it.id);
          if (e5) throw e5;
        }
      }

      return replacements;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: OPEN_PERIOD_KEY });
      qc.invalidateQueries({ queryKey: PERIODS_QUERY_KEY });
    },
  });
}
