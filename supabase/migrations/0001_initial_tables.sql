-- =================================================================
-- ▤ 0001: Initial Tables, Types, and Seed Data
-- This script reflects the current production schema in Supabase.
-- Includes Phase 1 member and loan fields.
-- =================================================================

-- ----------------------------------------------------------------
-- ▤ Extensions
-- ----------------------------------------------------------------
create extension if not exists "uuid-ossp" with schema public;

-- ----------------------------------------------------------------
-- ▤ Drop existing objects for a clean slate
-- ----------------------------------------------------------------
drop table if exists "public"."ledger_entries" cascade;
drop table if exists "public"."operations" cascade;
drop table if exists "public"."pending_member_payments";
drop table if exists "public"."stock_subscriptions" cascade;
drop table if exists "public"."stock_value_history" cascade;
drop table if exists "public"."stocks" cascade;
drop table if exists "public"."stock_types" cascade;
drop table if exists "public"."mandatory_contributions" cascade;
drop table if exists "public"."loan_transaction_details" cascade;
drop table if exists "public"."loan_types" cascade;
drop table if exists "public"."loans" cascade;
drop table if exists "public"."meetings" cascade;
drop table if exists "public"."members" cascade;
drop type if exists "public"."member_due" cascade;


-- ----------------------------------------------------------------
-- ▤ Tables
-- ----------------------------------------------------------------

-- Stores information about each member of the fund.
create table public.members (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    email text unique,
    identification_number text unique,
    role text default 'member' not null,
    status text default 'active' not null,
    address text,
    phone text,
    beneficiary text,
    registration_date date default current_date not null,
    created_at timestamp with time zone default now() not null,
    deleted_at timestamp with time zone
);
comment on table public.members is 'Stores information about each member of the fund.';

-- Stores records of each meeting session.
create table public.meetings (
    id uuid default uuid_generate_v4() primary key,
    date timestamp with time zone default now() not null,
    status text default 'active' not null check (status in ('active', 'closed')),
    notes text
);
comment on table public.meetings is 'Stores records of each meeting session.';

-- Represents a single, high-level financial event, like a member's payment in a meeting.
create table public.operations (
    id uuid default uuid_generate_v4() primary key,
    member_id uuid references public.members(id) on delete set null,
    meeting_id uuid references public.meetings(id) on delete cascade,
    date timestamp with time zone default now() not null,
    type text not null,
    description text
);
comment on table public.operations is 'Represents a single, high-level financial event.';

-- Defines the types of stocks available in the fund.
create table public.stocks (
    id uuid default uuid_generate_v4() primary key,
    type text not null unique,
    value numeric(12, 2) not null,
    monthly_contribution numeric(12, 2) default 0 not null,
    is_guaranteed boolean default false not null,
    guaranteed_yield numeric(5, 4),
    behavior text not null default 'CAPITAL_APPRECIATION',
    deleted_at timestamp with time zone
);
comment on table public.stocks is 'Defines the types of stocks available in the fund.';

-- Stores information about loans granted to members.
create table public.loans (
    id uuid default uuid_generate_v4() primary key,
    member_id uuid not null references public.members(id) on delete cascade,
    loan_type text not null,
    approved_amount numeric(12, 2) not null,
    disbursed_amount numeric(12, 2) not null default 0, -- Monto desembolsado del préstamo
    outstanding_balance numeric(12, 2) not null default 0,
    monthly_payment_amount numeric(12, 2) not null,
    interest_rate numeric(4, 4) not null,
    term integer not null default 24,
    status text default 'pending' not null,
    creation_date date default current_date not null,
    guaranteed_stock_id uuid references public.stocks(id) on delete set null -- Relación con acción garantizada
);
comment on table public.loans is 'Stores information about loans granted to members.';
comment on column public.loans.guaranteed_stock_id is 'ID de la acción garantizada asociada a este préstamo, si aplica.';

-- Stores the historical value of each stock after revaluation.
create table public.stock_value_history (
    id uuid default uuid_generate_v4() primary key,
    stock_id uuid not null references public.stocks(id) on delete cascade,
    operation_id uuid not null references public.operations(id) on delete cascade,
    previous_value numeric(12, 2) not null,
    growth_from_contributions numeric(10, 4) not null,
    growth_from_interest numeric(10, 4) not null,
    total_growth_per_share numeric(10, 4) not null,
    new_value numeric(12, 2) not null,
    created_at timestamp with time zone default now() not null
);
comment on table public.stock_value_history is 'Stores the historical value of each stock after revaluation.';

-- Tracks which members are subscribed to which stocks.
create table public.stock_subscriptions (
    id uuid default uuid_generate_v4() primary key,
    member_id uuid references public.members(id) on delete cascade not null,
    stock_id uuid references public.stocks(id) on delete cascade not null,
    quantity numeric(20,10) default 1 not null,
    purchase_date date default now() not null,
    status text default 'active' not null check (status in ('active', 'inactive')),
    financing_loan_id uuid null references public.loans(id) on delete set null
);
comment on table public.stock_subscriptions is 'Tracks which members are subscribed to which stocks.';
comment on column public.stock_subscriptions.financing_loan_id is 'ID del préstamo utilizado para financiar esta subscripción de acción, si aplica.';

-- Defines mandatory, recurring contributions for the fund.
create table public.mandatory_contributions (
    id uuid default uuid_generate_v4() primary key,
    asset_type text not null unique,
    value numeric(12, 2) not null
);
comment on table public.mandatory_contributions is 'Defines mandatory, recurring contributions for the fund.';

-- Details of transactions related to a specific loan.
create table public.loan_transaction_details (
    id uuid default uuid_generate_v4() primary key,
    loan_id uuid not null references public.loans(id) on delete cascade,
    operation_id uuid references public.operations(id) on delete set null,
    transaction_type text not null check (transaction_type in ('disbursement', 'principal_payment', 'interest_payment')),
    amount numeric(12, 2) not null,
    transaction_date date default current_date not null,
    notes text
);
comment on table public.loan_transaction_details is 'Details of transactions related to a specific loan.';

-- Stores the atomic double-entry accounting records (debits and credits).
create table public.ledger_entries (
    id uuid default uuid_generate_v4() primary key,
    operation_id uuid references public.operations(id) on delete cascade not null,
    account_type text not null,
    amount numeric(12, 2) not null,
    description text,
    created_at timestamp with time zone default now() not null,
    -- Affected entity fields for traceability
    loan_id uuid references public.loans(id) on delete set null,
    stock_id uuid references public.stocks(id) on delete set null,
    mandatory_contribution_id uuid references public.mandatory_contributions(id) on delete set null,
    stock_subscription_id uuid references public.stock_subscriptions(id) on delete set null
);
comment on table public.ledger_entries is 'Stores the atomic double-entry accounting records.';
comment on column public.ledger_entries.loan_id is 'Reference to the affected loan, if applicable.';
comment on column public.ledger_entries.stock_id is 'Reference to the affected stock, if applicable.';
comment on column public.ledger_entries.mandatory_contribution_id is 'Reference to the affected mandatory contribution, if applicable.';
comment on column public.ledger_entries.stock_subscription_id is 'Reference to the affected stock subscription, if applicable.';

-- ----------------------------------------------------------------
-- ▤ Custom Types
-- ----------------------------------------------------------------
create type public.member_due as (
  type text,
  description text,
  amount numeric
);

-- ----------------------------------------------------------------
-- ▤ Tabla para solicitudes de pagos pendientes de socios
-- ----------------------------------------------------------------
create table public.pending_member_payments (
    id uuid default uuid_generate_v4() primary key,
    member_id uuid not null references public.members(id) on delete cascade,
    meeting_id uuid not null references public.meetings(id) on delete cascade,
    type text not null check (type in ('dividend', 'stock_withdrawal', 'loan', 'other')),
    amount numeric(12, 2) not null,
    status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'paid')),
    notes text,
    stock_id uuid references public.stocks(id) on delete set null, -- Acción relacionada (si aplica)
    loan_id uuid references public.loans(id) on delete set null, -- Préstamo relacionado (si aplica)
    stock_subscription_id uuid references public.stock_subscriptions(id) on delete set null, -- Subscripción de acción relacionada (si aplica)
    reference_meeting_id uuid references public.meetings(id) on delete set null, -- Reunión de referencia (si aplica)
    disbursement_type text, -- Tipo de desembolso (opcional)
    created_at timestamp with time zone default now() not null
);
comment on table public.pending_member_payments is 'Solicitudes de liquidez de socios (dividendos, retiros de acciones, etc.) a ser procesadas en el plan de desembolso.'; 