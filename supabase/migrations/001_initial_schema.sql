-- =============================================================
-- Expenses App — Initial Schema
-- =============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- =============================================================
-- PROFILES
-- =============================================================
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- =============================================================
-- USER PREFERENCES
-- =============================================================
create table if not exists user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade unique,
  default_currency text not null default 'SGD',
  default_payment_method_id uuid,
  privacy_mode boolean not null default false,
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table user_preferences enable row level security;
create policy "Users can manage own preferences" on user_preferences
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-create preferences on signup
create or replace function handle_new_user_preferences()
returns trigger language plpgsql security definer as $$
begin
  insert into user_preferences (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_profile_created
  after insert on profiles
  for each row execute procedure handle_new_user_preferences();

-- =============================================================
-- CATEGORIES
-- =============================================================
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  name text not null,
  icon text not null default 'circle-ellipsis',
  color text not null default '#94a3b8',
  transaction_type text not null default 'expense'
    check (transaction_type in ('expense', 'income', 'investment', 'savings', 'transfer', 'refund')),
  is_needs boolean,
  is_fixed boolean,
  monthly_budget integer,
  sort_order integer not null default 0,
  is_archived boolean not null default false,
  is_system boolean not null default false,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table categories enable row level security;
-- System categories visible to all, user categories only to owner
create policy "Users can view applicable categories" on categories
  for select using (is_system = true or auth.uid() = user_id);
create policy "Users can manage own categories" on categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =============================================================
-- SUBCATEGORIES
-- =============================================================
create table if not exists subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories on delete cascade,
  user_id uuid references auth.users on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table subcategories enable row level security;
create policy "Users can view applicable subcategories" on subcategories
  for select using (
    user_id is null
    or auth.uid() = user_id
    or exists (
      select 1 from categories c where c.id = subcategories.category_id and c.is_system = true
    )
  );
create policy "Users can manage own subcategories" on subcategories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =============================================================
-- PAYMENT METHODS
-- =============================================================
create table if not exists payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  icon text not null default 'credit-card',
  sort_order integer not null default 0,
  is_default boolean not null default false,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table payment_methods enable row level security;
create policy "Users can manage own payment methods" on payment_methods
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =============================================================
-- TRANSACTIONS
-- =============================================================
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  type text not null default 'expense'
    check (type in ('expense', 'income', 'investment', 'savings', 'transfer', 'refund')),
  category_id uuid not null references categories,
  subcategory_id uuid references subcategories,
  -- Amount stored as integer minor units (cents). SGD: 1000 = $10.00
  amount integer not null check (amount >= 0),
  currency text not null default 'SGD',
  original_amount integer,
  original_currency text,
  exchange_rate numeric(12, 6),
  description text,
  merchant text,
  payment_method_id uuid references payment_methods,
  is_needs boolean,
  is_fixed boolean,
  is_recurring boolean not null default false,
  recurring_expense_id uuid,
  notes text,
  transaction_date timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index transactions_user_date on transactions(user_id, transaction_date desc);
create index transactions_user_category on transactions(user_id, category_id);

alter table transactions enable row level security;
create policy "Users can manage own transactions" on transactions
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =============================================================
-- BUDGETS
-- =============================================================
create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  category_id uuid references categories,
  amount integer not null check (amount > 0),
  period text not null default 'monthly' check (period in ('monthly', 'annual')),
  year integer not null,
  month integer check (month between 1 and 12),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, category_id, period, year, month)
);

alter table budgets enable row level security;
create policy "Users can manage own budgets" on budgets
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =============================================================
-- RECURRING EXPENSES
-- =============================================================
create table if not exists recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  amount integer not null check (amount > 0),
  currency text not null default 'SGD',
  category_id uuid not null references categories,
  subcategory_id uuid references subcategories,
  payment_method_id uuid references payment_methods,
  frequency text not null check (frequency in ('weekly', 'monthly', 'quarterly', 'annual')),
  next_payment_date date not null,
  is_active boolean not null default true,
  auto_record boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table recurring_expenses enable row level security;
create policy "Users can manage own recurring expenses" on recurring_expenses
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =============================================================
-- UPDATED_AT TRIGGER
-- =============================================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on profiles
  for each row execute procedure set_updated_at();
create trigger set_updated_at before update on user_preferences
  for each row execute procedure set_updated_at();
create trigger set_updated_at before update on categories
  for each row execute procedure set_updated_at();
create trigger set_updated_at before update on subcategories
  for each row execute procedure set_updated_at();
create trigger set_updated_at before update on payment_methods
  for each row execute procedure set_updated_at();
create trigger set_updated_at before update on transactions
  for each row execute procedure set_updated_at();
create trigger set_updated_at before update on budgets
  for each row execute procedure set_updated_at();
create trigger set_updated_at before update on recurring_expenses
  for each row execute procedure set_updated_at();
