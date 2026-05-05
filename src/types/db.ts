/**
 * Tipos de dominio (alias sobre `supabase.generated.ts`).
 * Regenerar esquema: `npm run gen:db-types` (requiere `supabase start` y migraciones aplicadas).
 */
import type { Database, Tables } from "./supabase.generated";

export type { Database, Json } from "./supabase.generated";

export type Frequency = Database["public"]["Enums"]["frequency"];

export type FixedItem = Tables<"fixed_items">;
export type BudgetEntry = Tables<"budget_entries">;
export type BudgetLineItem = Tables<"budget_line_items">;

export interface BudgetEntryWithItems extends BudgetEntry {
  budget_line_items: BudgetLineItem[];
}
