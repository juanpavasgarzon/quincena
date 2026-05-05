import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { FixedItem } from "@/types/db";
import { useAuth } from "@/features/auth/useAuth";
import type { DraftLineItem } from "@/features/periods/usePeriods";

export const FIXED_ITEMS_QUERY_KEY = ["fixed_items"] as const;

export function useFixedItems() {
  const { session } = useAuth();

  return useQuery({
    queryKey: FIXED_ITEMS_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fixed_items")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as FixedItem[];
    },
    enabled: !!session,
  });
}

export function useCreateFixedItem() {
  const qc = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (item: Omit<FixedItem, "id" | "user_id" | "created_at">) => {
      const uid = session?.user?.id;
      if (!uid) throw new Error("Sesión requerida");
      const { data, error } = await supabase
        .from("fixed_items")
        .insert({ ...item, user_id: uid })
        .select()
        .single();
      if (error) throw error;
      return data as FixedItem;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: FIXED_ITEMS_QUERY_KEY }),
  });
}

export function useUpdateFixedItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<FixedItem> & { id: string }) => {
      const { data, error } = await supabase
        .from("fixed_items")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as FixedItem;
    },
    onMutate: async ({ id, ...patch }) => {
      await qc.cancelQueries({ queryKey: FIXED_ITEMS_QUERY_KEY });
      const prev = qc.getQueryData<FixedItem[]>(FIXED_ITEMS_QUERY_KEY);
      qc.setQueryData<FixedItem[]>(FIXED_ITEMS_QUERY_KEY, (old) =>
        old?.map((item) => (item.id === id ? { ...item, ...patch } : item)) ?? []
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(FIXED_ITEMS_QUERY_KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: FIXED_ITEMS_QUERY_KEY }),
  });
}

export function useDeleteFixedItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fixed_items").delete().eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: FIXED_ITEMS_QUERY_KEY });
      const prev = qc.getQueryData<FixedItem[]>(FIXED_ITEMS_QUERY_KEY);
      qc.setQueryData<FixedItem[]>(FIXED_ITEMS_QUERY_KEY, (old) => old?.filter((i) => i.id !== id) ?? []);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(FIXED_ITEMS_QUERY_KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: FIXED_ITEMS_QUERY_KEY }),
  });
}

export function fixedToLineItem(fi: FixedItem) {
  return {
    id: Math.random().toString(36).slice(2, 10),
    label: fi.label,
    amount: fi.frequency === "monthly" ? Math.round(fi.amount / 2) : fi.amount,
    is_fixed: true as const,
    source_frequency: fi.frequency,
  };
}

/** Añade al borrador cada fijo activo que aún no esté representado (evita depender solo del cierre de quincena). */
export function mergeActiveFixedIntoDraftLines(
  items: DraftLineItem[],
  fixedList: FixedItem[] | undefined
): DraftLineItem[] {
  if (!fixedList?.length) return items;
  const next = [...items];
  for (const fi of fixedList) {
    if (!fi.is_active) continue;
    const expectedAmount = fi.frequency === "monthly" ? Math.round(fi.amount / 2) : fi.amount;
    const already = next.some(
      (it) =>
        it.is_fixed &&
        it.source_frequency === fi.frequency &&
        it.label.trim() === fi.label.trim() &&
        it.amount === expectedAmount
    );
    if (!already) next.push(fixedToLineItem(fi));
  }
  return next;
}
