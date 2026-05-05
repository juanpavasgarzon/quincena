-- Remove category from fixed_items and budget_line_items
alter table fixed_items drop column category;
alter table budget_line_items drop column category;

-- Update save_period RPC to not insert category
create or replace function save_period(p_period jsonb, p_items jsonb)
returns uuid
language plpgsql
security definer
as $$
declare
  v_entry_id uuid;
begin
  insert into budget_entries (user_id, period_label, period_sub, income)
  values (
    auth.uid(),
    p_period->>'period_label',
    p_period->>'period_sub',
    (p_period->>'income')::bigint
  )
  returning id into v_entry_id;

  insert into budget_line_items (entry_id, label, amount, is_fixed, source_frequency, position)
  select
    v_entry_id,
    item->>'label',
    (item->>'amount')::bigint,
    (item->>'is_fixed')::boolean,
    (item->>'source_frequency')::frequency,
    (row_number() over ())::int
  from jsonb_array_elements(p_items) as item;

  return v_entry_id;
end;
$$;
