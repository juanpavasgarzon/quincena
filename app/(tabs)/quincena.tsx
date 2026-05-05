import { ConfirmModal } from "@/components/ConfirmModal";
import { LineItemRow } from "@/components/LineItemRow";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SkeletonList } from "@/components/Skeleton";
import { StickyBalance } from "@/components/StickyBalance";
import { AmountInput } from "@/components/ui/AmountInput";
import { Input } from "@/components/ui/Input";
import {
  FIXED_ITEMS_QUERY_KEY,
  mergeActiveFixedIntoDraftLines,
  useFixedItems,
} from "@/features/fixedItems/useFixedItems";
import {
  OPEN_PERIOD_KEY,
  entryToDraftLineItems,
  useCloseOpenPeriod,
  useCreateOpenPeriod,
  useOpenPeriod,
  useSyncOpenPeriod,
} from "@/features/periods/useOpenPeriod";
import { clearDraft, usePeriodDraft, type PeriodDraft } from "@/features/periods/usePeriodDraft";
import { PERIODS_QUERY_KEY, computeLocalTotals, type DraftLineItem } from "@/features/periods/usePeriods";
import { suggestPeriodLabel, suggestPeriodSub } from "@/lib/format";
import { haptics } from "@/lib/haptics";
import { colors, radii } from "@/theme/tokens";
import type { BudgetEntryWithItems, FixedItem } from "@/types/db";
import { useFocusEffect } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { toast } from "sonner-native";

/** Separación uniforme del header al contenido (misma sensación que otras pestañas). */
const CONTENT_TOP_PAD = 12;

function freshSuggest(): PeriodDraft {
  return {
    period_label: suggestPeriodLabel(),
    period_sub: suggestPeriodSub(),
    income: 0,
    items: [],
  };
}

function isDraftEffectivelyEmptyForFixedMerge(items: DraftLineItem[]) {
  if (items.length === 0) return true;
  return items.every((i) => i.amount === 0 && !i.label.trim());
}

export default function QuincenaScreen() {
  const qc = useQueryClient();
  const { data: open, isLoading: loadingOpen } = useOpenPeriod();
  const { data: fixedItems, isLoading: loadingFixed } = useFixedItems();
  const createOpen = useCreateOpenPeriod();
  const closeOpen = useCloseOpenPeriod();
  const syncOpen = useSyncOpenPeriod();

  const suggest = useMemo(() => freshSuggest(), []);
  const { draft: preDraft, setDraft: setPreDraft, draftHydrated } = usePeriodDraft(suggest);

  const [openForm, setOpenForm] = useState<PeriodDraft | null>(null);
  /** Evita mostrar borrador viejo antes de reaplicar estado limpio tras refetch sin período abierto. */
  const [preDraftGate, setPreDraftGate] = useState(false);
  const lastBoundOpenId = useRef<string | null>(null);
  const [closeConfirm, setCloseConfirm] = useState(false);
  const [deleteLineId, setDeleteLineId] = useState<string | null>(null);
  const [stickyPanelExpanded, setStickyPanelExpanded] = useState(false);
  const openRef = useRef(open);
  openRef.current = open;

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      setPreDraftGate(false);

      void (async () => {
        try {
          await qc.invalidateQueries({ queryKey: OPEN_PERIOD_KEY });
          await qc.invalidateQueries({ queryKey: PERIODS_QUERY_KEY });
          await qc.invalidateQueries({ queryKey: FIXED_ITEMS_QUERY_KEY });
          await Promise.all([
            qc.refetchQueries({ queryKey: OPEN_PERIOD_KEY }),
            qc.refetchQueries({ queryKey: PERIODS_QUERY_KEY }),
            qc.refetchQueries({ queryKey: FIXED_ITEMS_QUERY_KEY }),
          ]);
          if (!alive) return;
          lastBoundOpenId.current = null;

          const latestOpen =
            qc.getQueryData<BudgetEntryWithItems | null | undefined>(OPEN_PERIOD_KEY) ?? null;
          if (!latestOpen) {
            clearDraft();
            const fixedSnap = qc.getQueryData<FixedItem[]>(FIXED_ITEMS_QUERY_KEY) ?? [];
            setPreDraft({
              ...freshSuggest(),
              items: mergeActiveFixedIntoDraftLines([], fixedSnap),
            });
          }
        } finally {
          if (alive) setPreDraftGate(true);
        }
      })();

      return () => {
        alive = false;
        if (!openRef.current) {
          clearDraft();
          setPreDraft(freshSuggest());
        }
      };
    }, [qc, setPreDraft]),
  );

  useEffect(() => {
    if (!open) {
      lastBoundOpenId.current = null;
      setOpenForm(null);
      return;
    }
    if (lastBoundOpenId.current !== open.id) {
      lastBoundOpenId.current = open.id;
      setOpenForm({
        period_label: open.period_label,
        period_sub: open.period_sub ?? "",
        income: open.income,
        items: entryToDraftLineItems(open.budget_line_items),
      });
    }
  }, [open]);

  useEffect(() => {
    if (open || !draftHydrated || !fixedItems) return;
    setPreDraft((prev) => {
      if (!isDraftEffectivelyEmptyForFixedMerge(prev.items)) return prev;
      const merged = mergeActiveFixedIntoDraftLines(prev.items, fixedItems);
      const sameLen = merged.length === prev.items.length;
      const same =
        sameLen &&
        merged.every(
          (m, i) =>
            m.id === prev.items[i].id &&
            m.label === prev.items[i].label &&
            m.amount === prev.items[i].amount &&
            m.is_fixed === prev.items[i].is_fixed &&
            m.source_frequency === prev.items[i].source_frequency,
        );
      if (same) return prev;
      return { ...prev, items: merged };
    });
  }, [open, draftHydrated, fixedItems, setPreDraft]);

  const patchUi = useCallback(
    (update: Partial<PeriodDraft> | ((prev: PeriodDraft) => PeriodDraft)) => {
      if (open) {
        setOpenForm((prev) => {
          if (!prev) return prev;
          return typeof update === "function" ? update(prev) : { ...prev, ...update };
        });
      } else {
        setPreDraft(update);
      }
    },
    [open, setPreDraft],
  );

  const openFormRef = useRef(openForm);
  openFormRef.current = openForm;

  useEffect(() => {
    if (!open || !openForm) return;
    const entryId = open.id;
    const t = setTimeout(() => {
      const draft = openFormRef.current;
      if (!draft) return;
      void syncOpen
        .mutateAsync({ entryId, draft })
        .then((reps) => {
          if (Object.keys(reps).length) {
            setOpenForm((prev) =>
              prev
                ? {
                    ...prev,
                    items: prev.items.map((it) => (reps[it.id] ? { ...it, id: reps[it.id] } : it)),
                  }
                : prev,
            );
          }
        })
        .catch((e: Error) => {
          toast.error(e?.message ?? "No se pudo guardar");
        });
    }, 850);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce del borrador; `syncOpen` es estable en React Query
  }, [openForm, open?.id]);

  const updateItem = (id: string, patch: Partial<DraftLineItem>) => {
    patchUi((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    }));
  };

  const removeItem = (id: string) => {
    setDeleteLineId(id);
  };

  const addItem = () => {
    const newItem: DraftLineItem = {
      id: Math.random().toString(36).slice(2, 11),
      label: "",
      amount: 0,
      is_fixed: false,
      source_frequency: null,
    };
    patchUi((prev) => ({ ...prev, items: [newItem, ...prev.items] }));
  };

  const handleStart = async () => {
    const d = open ? openForm! : preDraft;
    const canStart =
      !open && d.period_label.trim().length > 0 && d.income > 0;
    if (!canStart) return;
    const withFixed = mergeActiveFixedIntoDraftLines(d.items, fixedItems ?? []);
    try {
      await createOpen.mutateAsync({ ...d, items: withFixed });
      clearDraft();
      setPreDraft(freshSuggest());
      haptics.success();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "No se pudo iniciar la quincena";
      toast.error(msg);
    }
  };

  const handleClose = async () => {
    if (!open) return;
    try {
      await closeOpen.mutateAsync(open.id);
      clearDraft();
      setPreDraft({
        ...freshSuggest(),
        items: mergeActiveFixedIntoDraftLines([], fixedItems ?? []),
      });
      setCloseConfirm(false);
      haptics.success();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "No se pudo cerrar la quincena";
      toast.error(msg);
    }
  };

  const awaitingOpenForm = !!open && openForm === null;
  /** Sin período abierto: esperamos hidratar borrador y completar sincronización al enfocar (evita mostrar valores viejos). */
  const awaitingPreCreateUi = !open && (!draftHydrated || !preDraftGate);
  if (loadingOpen || awaitingOpenForm || awaitingPreCreateUi) {
    return (
      <View style={styles.root}>
        <ScreenHeader title="Quincena" />
        <View style={[styles.pad, styles.bodyTopInset]}>
          <SkeletonList />
        </View>
      </View>
    );
  }

  const ui: PeriodDraft = open ? openForm! : preDraft;
  const { totalExpenses, balance } = computeLocalTotals(ui.income, ui.items);
  const canStart = !open && ui.period_label.trim().length > 0 && ui.income > 0;

  const deleteLineLabel =
    deleteLineId != null ? ui.items.find((i) => i.id === deleteLineId)?.label?.trim() : undefined;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <ScreenHeader title="Quincena" />
      <ScrollView
        style={styles.root}
        contentContainerStyle={[styles.scroll, { paddingBottom: 200 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
          <View style={styles.pad}>
            <View style={styles.card}>
            <Input
              label="Período"
              value={ui.period_label}
              onChangeText={(t) => patchUi({ period_label: t })}
              placeholder={suggestPeriodLabel()}
              style={styles.mb16}
              editable={!loadingFixed}
            />
            <View style={styles.mb0}>
              <AmountInput
                key={open?.id ?? "pre"}
                label="Ingreso"
                value={ui.income}
                onChange={(v) => patchUi({ income: v })}
                size="hero"
              />
            </View>
          </View>
        </View>

        {loadingFixed ? (
          <View style={styles.pad}>
            <SkeletonList />
          </View>
        ) : (
          <View style={styles.pad}>
            <Pressable style={styles.addBtn} onPress={addItem}>
              <Text style={styles.addBtnText}>＋ Gasto</Text>
            </Pressable>
            <View style={styles.list}>
              {ui.items.map((it) => (
                <LineItemRow
                  key={it.id}
                  item={it}
                  onUpdate={(patch) => updateItem(it.id, patch)}
                  onRemove={() => removeItem(it.id)}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View
        style={[
          styles.stickyWrap,
          {
            // La tab bar ya aplica inset inferior; aquí solo un pequeño aire sobre la barra.
            paddingBottom: stickyPanelExpanded ? 12 : 4,
          },
        ]}
      >
        <StickyBalance
          balance={balance}
          income={ui.income}
          totalExpenses={totalExpenses}
          onExpandedChange={setStickyPanelExpanded}
          autoSyncLabel={
            open
              ? syncOpen.isPending
                ? "Guardando…"
                : "Guardado"
              : undefined
          }
          primaryAction={
            !open
              ? {
                  label: "Iniciar",
                  onPress: handleStart,
                  disabled: !canStart,
                  loading: createOpen.isPending,
                }
              : undefined
          }
          secondaryAction={
            open
              ? {
                  label: "Terminar quincena",
                  onPress: () => setCloseConfirm(true),
                  disabled: closeOpen.isPending,
                }
              : undefined
          }
        />
      </View>

      <Modal visible={closeConfirm} transparent animationType="fade" onRequestClose={() => setCloseConfirm(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setCloseConfirm(false)}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Cerrar quincena</Text>
            <Text style={styles.confirmBody}>Pasará al historial.</Text>
            <View style={styles.confirmRow}>
              <Pressable style={styles.confirmCancel} onPress={() => setCloseConfirm(false)}>
                <Text style={styles.confirmCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable style={styles.confirmDanger} onPress={() => void handleClose()}>
                <Text style={styles.confirmDangerText}>Cerrar</Text>
              </Pressable>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <ConfirmModal
        visible={deleteLineId !== null}
        title="¿Eliminar este gasto?"
        message={
          deleteLineLabel
            ? `"${deleteLineLabel}" se quitará de esta quincena. Puedes añadir uno nuevo después.`
            : "Se quitará de esta quincena. Puedes añadir uno nuevo después."
        }
        cancelLabel="Cancelar"
        confirmLabel="Eliminar"
        confirmVariant="danger"
        onCancel={() => setDeleteLineId(null)}
        onConfirm={() => {
          const id = deleteLineId;
          setDeleteLineId(null);
          if (!id) return;
          haptics.light();
          patchUi((prev) => ({ ...prev, items: prev.items.filter((it) => it.id !== id) }));
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 0, paddingTop: CONTENT_TOP_PAD },
  pad: { paddingHorizontal: 22, marginBottom: 12 },
  bodyTopInset: { paddingTop: CONTENT_TOP_PAD },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 20,
    gap: 18,
  },
  mb16: {},
  mb0: {},
  list: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.line,
  },
  addBtn: {
    backgroundColor: colors.surface2,
    borderRadius: radii.md,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.line,
  },
  addBtnText: { fontSize: 14, fontWeight: "600", color: colors.ink, letterSpacing: -0.1 },
  stickyWrap: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  confirmCard: {
    backgroundColor: "#fff",
    borderRadius: radii.lg,
    padding: 24,
    width: "100%",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.line,
  },
  confirmTitle: { fontSize: 17, fontWeight: "700", color: colors.ink, letterSpacing: -0.3 },
  confirmBody: { fontSize: 14, color: colors.muted, lineHeight: 20 },
  confirmRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  confirmDanger: {
    flex: 1,
    backgroundColor: colors.neg,
    borderRadius: radii.md,
    paddingVertical: 13,
    alignItems: "center",
  },
  confirmDangerText: { fontSize: 14, fontWeight: "600", color: "#fff" },
  confirmCancel: {
    flex: 1,
    backgroundColor: colors.surface2,
    borderRadius: radii.md,
    paddingVertical: 13,
    alignItems: "center",
  },
  confirmCancelText: { fontSize: 14, fontWeight: "500", color: colors.ink },
});
