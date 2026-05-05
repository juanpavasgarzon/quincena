import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { colors, radii, shadows } from "@/theme/tokens";
import { Input } from "@/components/ui/Input";
import { AmountInput } from "@/components/ui/AmountInput";
import { Segmented } from "@/components/ui/Segmented";
import { Toggle } from "@/components/ui/Toggle";
import { ConfirmModal } from "@/components/ConfirmModal";
import type { FixedItem, Frequency } from "@/types/db";

type DraftItem = Omit<FixedItem, "id" | "user_id" | "created_at">;

interface FixedItemEditCardProps {
  item: DraftItem;
  onSave: (patch: DraftItem) => void;
  onCancel: () => void;
  onDelete?: () => void;
  isNew?: boolean;
  flat?: boolean;
}

export function FixedItemEditCard({ item, onSave, onCancel, onDelete, isNew = false, flat = false }: FixedItemEditCardProps) {
  const [label, setLabel] = useState(item.label);
  const [amount, setAmount] = useState(item.amount);
  const [frequency, setFrequency] = useState<Frequency>(item.frequency);
  const [isActive, setIsActive] = useState(item.is_active);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const pendingSaveRef = useRef<DraftItem | null>(null);

  const canSave = label.trim().length > 0 && amount > 0;

  const patch = (): DraftItem => ({
    label: label.trim(),
    amount,
    frequency,
    is_active: isActive,
  });

  const requestSave = () => {
    if (!canSave) return;
    const p = patch();
    if (isNew) {
      onSave(p);
      return;
    }
    pendingSaveRef.current = p;
    setSaveModalVisible(true);
  };

  return (
    <View style={flat ? styles.flatCard : styles.card}>
      <Input
        label="Nombre del gasto"
        value={label}
        onChangeText={setLabel}
        placeholder="p. ej. Cuota apartamento"
        autoFocus
      />

      <View style={styles.spacer} />

      <AmountInput label="Monto" value={amount} onChange={setAmount} />

      <View style={styles.spacer} />

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Frecuencia</Text>
        <Segmented
          options={[
            { label: "Mensual", value: "monthly" as const },
            { label: "Quincenal", value: "biweekly" as const },
          ]}
          value={frequency}
          onChange={setFrequency}
        />
      </View>

      {!isNew && (
        <>
          <View style={styles.spacer} />
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>Activo</Text>
              <Text style={styles.toggleSub}>Se incluye en nuevas quincenas</Text>
            </View>
            <Toggle value={isActive} onValueChange={setIsActive} />
          </View>
        </>
      )}

      <View style={styles.spacer} />

      <View style={styles.actions}>
        <Pressable style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelBtnText}>Cancelar</Text>
        </Pressable>
        <Pressable
          style={[styles.acceptBtn, !canSave && styles.acceptBtnDisabled]}
          onPress={requestSave}
          disabled={!canSave}
        >
          <Text style={styles.acceptBtnText}>Aceptar</Text>
        </Pressable>
      </View>

      {!isNew && onDelete && (
        <Pressable style={styles.deleteContained} onPress={() => setDeleteModalVisible(true)}>
          <Text style={styles.deleteContainedText}>Eliminar item</Text>
        </Pressable>
      )}

      {!isNew && onDelete && (
        <ConfirmModal
          visible={deleteModalVisible}
          title="Eliminar item"
          message="Ya no se usará en períodos nuevos."
          cancelLabel="Cancelar"
          confirmLabel="Eliminar"
          confirmVariant="danger"
          onCancel={() => setDeleteModalVisible(false)}
          onConfirm={() => {
            setDeleteModalVisible(false);
            onDelete();
          }}
        />
      )}

      {!isNew && (
        <ConfirmModal
          visible={saveModalVisible}
          title="Guardar cambios"
          message="¿Guardar estos datos?"
          cancelLabel="Cancelar"
          confirmLabel="Guardar"
          confirmVariant="primary"
          onCancel={() => {
            setSaveModalVisible(false);
            pendingSaveRef.current = null;
          }}
          onConfirm={() => {
            const p = pendingSaveRef.current;
            pendingSaveRef.current = null;
            setSaveModalVisible(false);
            if (p) onSave(p);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 20,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadows.sm,
  },
  flatCard: {
    padding: 20,
  },
  spacer: { height: 14 },
  field: { gap: 8 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.72,
    paddingHorizontal: 4,
  },
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  toggleLabel: { fontSize: 14, fontWeight: "500", color: colors.ink },
  toggleSub: { fontSize: 11, color: colors.muted, marginTop: 2 },
  actions: { flexDirection: "row", gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, backgroundColor: colors.surface2, borderRadius: radii.md, paddingVertical: 13, alignItems: "center", borderWidth: 1, borderColor: colors.line },
  cancelBtnText: { fontSize: 14, fontWeight: "500", color: colors.ink },
  acceptBtn: { flex: 1, backgroundColor: colors.pos, borderRadius: radii.md, paddingVertical: 13, alignItems: "center" },
  acceptBtnText: { fontSize: 14, fontWeight: "600", color: "#fff" },
  acceptBtnDisabled: { opacity: 0.4 },
  deleteContained: {
    marginTop: 14,
    width: "100%",
    alignSelf: "stretch",
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.neg,
    borderRadius: radii.md,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteContainedText: { fontSize: 14, fontWeight: "600", color: colors.neg, letterSpacing: -0.15 },
});
