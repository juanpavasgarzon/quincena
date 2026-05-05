import React, { useState, useCallback } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner-native";
import { colors, radii, shadows } from "@/theme/tokens";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useFixedItems, useCreateFixedItem, useUpdateFixedItem, useDeleteFixedItem, FIXED_ITEMS_QUERY_KEY } from "@/features/fixedItems/useFixedItems";
import { FixedItemEditCard } from "@/components/FixedItemEditCard";
import { Toggle } from "@/components/ui/Toggle";
import { Pill } from "@/components/ui/Pill";
import { SkeletonList } from "@/components/Skeleton";
import { ConfirmModal } from "@/components/ConfirmModal";
import { formatCOP } from "@/lib/format";
import { haptics } from "@/lib/haptics";
import type { FixedItem } from "@/types/db";

export default function ConfigScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { data: items, isLoading } = useFixedItems();
  const createItem = useCreateFixedItem();
  const updateItem = useUpdateFixedItem();
  const deleteItem = useDeleteFixedItem();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [togglePrompt, setTogglePrompt] = useState<{ id: string; nextActive: boolean } | null>(null);

  const activeItems = (items ?? []).filter((i) => i.is_active);
  const monthlyTotal = activeItems.filter((i) => i.frequency === "monthly").reduce((s, i) => s + i.amount, 0);
  const biweeklyTotal = activeItems.filter((i) => i.frequency === "biweekly").reduce((s, i) => s + i.amount, 0);

  const handleToggle = (id: string, val: boolean) => {
    setTogglePrompt({ id, nextActive: val });
  };

  const handleSave = (id: string, patch: any) => {
    updateItem.mutate({ id, ...patch });
    haptics.success();
    setEditingId(null);
  };

  const handleCreate = (patch: any) => {
    createItem.mutate(patch);
    haptics.success();
    setAdding(false);
  };

  const handleDelete = (id: string) => {
    deleteItem.mutate(id);
    haptics.light();
    setEditingId(null);
    toast.success("Eliminado");
  };

  useFocusEffect(
    useCallback(() => {
      void qc.invalidateQueries({ queryKey: FIXED_ITEMS_QUERY_KEY });
      void qc.refetchQueries({ queryKey: FIXED_ITEMS_QUERY_KEY });
    }, [qc]),
  );

  return (
    <View style={styles.root}>
      <ScreenHeader title="Config" />
      <ScrollView
        style={styles.root}
        contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom, 28) }]}
        showsVerticalScrollIndicator={false}
      >

      <View style={styles.pad}>
        <View style={styles.dashboard}>
          <View style={styles.dashHalf}>
            <Text style={styles.dashCaption}>Mensual</Text>
            <Text
              style={styles.dashAmt}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {formatCOP(monthlyTotal)}
            </Text>
          </View>
          <View style={styles.dashRule} />
          <View style={styles.dashHalf}>
            <Text style={styles.dashCaption}>Quincenal</Text>
            <Text
              style={styles.dashAmt}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {formatCOP(biweeklyTotal)}
            </Text>
          </View>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.pad}><SkeletonList /></View>
      ) : (
        <>
          <View style={styles.pad}>
            <View style={styles.list}>
              {(items ?? []).map((it) =>
                editingId === it.id ? (
                  <FixedItemEditCard
                    key={it.id}
                    item={it}
                    onSave={(patch) => handleSave(it.id, patch)}
                    onCancel={() => setEditingId(null)}
                    onDelete={() => handleDelete(it.id)}
                  />
                ) : (
                  <FixedItemRow
                    key={it.id}
                    item={it}
                    onToggle={(v) => handleToggle(it.id, v)}
                    onEdit={() => {
                      haptics.selection();
                      setEditingId(it.id);
                    }}
                  />
                )
              )}
            </View>
          </View>

          <View style={[styles.pad, { marginTop: 16 }]}>
            {adding ? (
              <FixedItemEditCard
                item={{ label: "", amount: 0, frequency: "monthly", is_active: true }}
                onSave={handleCreate}
                onCancel={() => setAdding(false)}
                isNew
              />
            ) : (
              <Pressable
                style={styles.addBtn}
                onPress={() => {
                  haptics.selection();
                  setAdding(true);
                }}
              >
                <Text style={styles.addBtnText}>＋ Añadir</Text>
              </Pressable>
            )}
          </View>
        </>
      )}

      </ScrollView>

      <ConfirmModal
        visible={togglePrompt !== null}
        title={togglePrompt?.nextActive ? "Activar" : "Desactivar"}
        message={
          (() => {
            const tp = togglePrompt;
            if (!tp) return "";
            const rowLabel = items?.find((i) => i.id === tp.id)?.label;
            if (rowLabel) {
              return tp.nextActive ? `¿Activar "${rowLabel}"?` : `¿Desactivar "${rowLabel}"?`;
            }
            return tp.nextActive ? "¿Activar?" : "¿Desactivar este ítem?";
          })()
        }
        cancelLabel="Cancelar"
        confirmLabel={togglePrompt?.nextActive ? "Activar" : "Desactivar"}
        confirmVariant={togglePrompt?.nextActive ? "primary" : "danger"}
        onCancel={() => setTogglePrompt(null)}
        onConfirm={() => {
          const tp = togglePrompt;
          setTogglePrompt(null);
          if (!tp) return;
          updateItem.mutate({ id: tp.id, is_active: tp.nextActive });
          haptics.selection();
        }}
      />
    </View>
  );
}

function FixedItemRow({ item, onToggle, onEdit }: { item: FixedItem; onToggle: (v: boolean) => void; onEdit: () => void }) {
  return (
    <View style={[styles.row, !item.is_active && { opacity: 0.5 }]}>
      <Pressable style={{ flex: 1 }} onPress={onEdit}>
        <View style={styles.rowLabel}>
          <Text style={styles.rowTitle}>{item.label}</Text>
          <View style={styles.rowMeta}>
            <Pill tone={item.frequency === "monthly" ? "accent" : "default"}>
              {item.frequency === "monthly" ? "M" : "Q"}
            </Pill>
            <Text style={styles.rowAmt}>{formatCOP(item.amount)}</Text>
          </View>
        </View>
      </Pressable>
      <Toggle value={item.is_active} onValueChange={onToggle} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingTop: 12 },
  pad: { paddingHorizontal: 22, marginBottom: 12 },
  dashboard: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 20,
    paddingHorizontal: 4,
    ...shadows.sm,
  },
  dashHalf: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 8, minWidth: 0 },
  dashRule: { width: 1, alignSelf: "stretch", marginVertical: 4, backgroundColor: colors.line },
  dashCaption: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: "600",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  dashAmt: { fontSize: 17, fontWeight: "600", color: colors.ink, letterSpacing: -0.35 },
  list: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.line,
    ...shadows.sm,
    marginTop: 4,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 18, paddingHorizontal: 18, borderTopWidth: 1, borderTopColor: colors.line },
  rowLabel: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: "500", color: colors.ink, letterSpacing: -0.2 },
  rowMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  rowAmt: { fontSize: 13, color: colors.muted },
  addBtn: { backgroundColor: colors.surface2, borderRadius: radii.md, paddingVertical: 16, alignItems: "center", borderWidth: 1, borderColor: colors.line },
  addBtnText: { fontSize: 14, fontWeight: "600", color: colors.ink, letterSpacing: -0.1 },
});
