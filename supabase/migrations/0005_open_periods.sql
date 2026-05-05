-- Período "abierto": closed_at NULL hasta que el usuario cierra la quincena.
alter table budget_entries add column if not exists closed_at timestamptz;

-- Histórico: marcar filas existentes como cerradas en su fecha de creación.
update budget_entries
set closed_at = coalesce(created_at, now())
where closed_at is null;

-- Una sola quincena abierta por usuario.
create unique index if not exists budget_entries_one_open_per_user
  on budget_entries (user_id)
  where (closed_at is null);
