-- Enable UUID extension
create extension if not exists "pgcrypto";

create table profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade unique,
  full_name text,
  created_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "Users can manage own profile"
  on profiles for all using (user_id = auth.uid());

create type frequency as enum ('monthly', 'biweekly');

create table fixed_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  label text not null,
  amount bigint not null check (amount >= 0),
  frequency frequency not null,
  category text not null,
  is_active boolean not null default true,
  created_at timestamptz default now()
);
create index on fixed_items (user_id, is_active);
alter table fixed_items enable row level security;
create policy "Users manage own fixed_items"
  on fixed_items for all using (user_id = auth.uid());

create table budget_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  period_label text not null,
  period_sub text,
  income bigint not null check (income >= 0),
  created_at timestamptz default now()
);
create index on budget_entries (user_id, created_at desc);
alter table budget_entries enable row level security;
create policy "Users manage own budget_entries"
  on budget_entries for all using (user_id = auth.uid());

create table budget_line_items (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references budget_entries on delete cascade,
  label text not null,
  amount bigint not null check (amount >= 0),
  category text not null,
  is_fixed boolean not null default false,
  source_frequency frequency,
  position int not null default 0
);
create index on budget_line_items (entry_id);
alter table budget_line_items enable row level security;
create policy "Users manage own line_items"
  on budget_line_items for all
  using (
    entry_id in (
      select id from budget_entries where user_id = auth.uid()
    )
  );

-- RPC to save a full period atomically
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

  insert into budget_line_items (entry_id, label, amount, category, is_fixed, source_frequency, position)
  select
    v_entry_id,
    item->>'label',
    (item->>'amount')::bigint,
    item->>'category',
    (item->>'is_fixed')::boolean,
    (item->>'source_frequency')::frequency,
    (row_number() over ())::int
  from jsonb_array_elements(p_items) as item;

  return v_entry_id;
end;
$$;
