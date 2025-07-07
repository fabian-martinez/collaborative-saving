-- =================================================================
-- ▤ 0001: Initial Tables, Types, and Seed Data
-- This script reflects the current production schema in Supabase.
-- =================================================================

-- ----------------------------------------------------------------
-- ▤ Extensions
-- ----------------------------------------------------------------
create extension if not exists "uuid-ossp" with schema extensions;

-- ----------------------------------------------------------------
-- ▤ Drop existing objects for a clean slate
-- ----------------------------------------------------------------
drop table if exists "public"."members" cascade;
drop table if exists "public"."meetings" cascade;
drop table if exists "public"."operations" cascade;
drop table if exists "public"."ledger_entries" cascade;
drop table if exists "public"."stocks" cascade;
drop table if exists "public"."stock_subscriptions" cascade;
drop table if exists "public"."mandatory_contributions" cascade;
drop table if exists "public"."loans" cascade;
drop table if exists "public"."loan_transaction_details" cascade;
drop table if exists "public"."stock_value_history" cascade;
drop type if exists "public"."member_due" cascade;


-- ----------------------------------------------------------------
-- ▤ Tables
-- ----------------------------------------------------------------

-- Stores information about each member of the fund.
create table public.members (
    id uuid default extensions.uuid_generate_v4() primary key,
    name text not null,
    email text unique,
    identification_number text unique,
    role text default 'member' not null,
    created_at timestamp with time zone default now() not null,
    deleted_at timestamp with time zone
);
comment on table public.members is 'Stores information about each member of the fund.';

-- Stores records of each meeting session.
create table public.meetings (
    id uuid default extensions.uuid_generate_v4() primary key,
    date timestamp with time zone default now() not null,
    status text default 'active' not null check (status in ('active', 'closed')),
    notes text
);
comment on table public.meetings is 'Stores records of each meeting session.';

-- Represents a single, high-level financial event, like a member's payment in a meeting.
create table public.operations (
    id uuid default extensions.uuid_generate_v4() primary key,
    member_id uuid references public.members(id) on delete set null,
    meeting_id uuid references public.meetings(id) on delete cascade,
    date timestamp with time zone default now() not null,
    description text
);
comment on table public.operations is 'Represents a single, high-level financial event.';

-- Defines the types of stocks available in the fund.
create table public.stocks (
    id uuid default extensions.uuid_generate_v4() primary key,
    type text not null unique,
    value numeric(10, 2) not null,
    monthly_contribution numeric(10, 2) default 0 not null,
    deleted_at timestamp with time zone
);
comment on table public.stocks is 'Defines the types of stocks available in the fund.';

-- Stores the historical value of each stock after revaluation.
create table public.stock_value_history (
    id uuid default extensions.uuid_generate_v4() primary key,
    stock_id uuid not null references public.stocks(id) on delete cascade,
    value numeric not null,
    date timestamp with time zone default now() not null
);
comment on table public.stock_value_history is 'Stores the historical value of each stock after revaluation.';

-- Tracks which members are subscribed to which stocks.
create table public.stock_subscriptions (
    id uuid default extensions.uuid_generate_v4() primary key,
    member_id uuid references public.members(id) on delete cascade not null,
    stock_id uuid references public.stocks(id) on delete cascade not null,
    quantity int default 1 not null,
    purchase_date date default now() not null,
    status text default 'active' not null check (status in ('active', 'inactive')),
    unique(member_id, stock_id)
);
comment on table public.stock_subscriptions is 'Tracks which members are subscribed to which stocks.';

-- Defines mandatory, recurring contributions for the fund.
create table public.mandatory_contributions (
    id uuid default extensions.uuid_generate_v4() primary key,
    asset_type text not null unique,
    total numeric(10, 2) not null
);
comment on table public.mandatory_contributions is 'Defines mandatory, recurring contributions for the fund.';

-- Stores information about loans granted to members.
create table public.loans (
    id uuid default extensions.uuid_generate_v4() primary key,
    member_id uuid not null references public.members(id) on delete cascade,
    loan_type text not null check (loan_type in ('corriente', 'agil')),
    approved_amount numeric not null,
    monthly_payment_amount numeric not null,
    interest_rate numeric not null,
    status text default 'pending' not null,
    creation_date date default current_date not null
);
comment on table public.loans is 'Stores information about loans granted to members.';

-- Details of transactions related to a specific loan.
create table public.loan_transaction_details (
    id uuid default extensions.uuid_generate_v4() primary key,
    loan_id uuid not null references public.loans(id) on delete cascade,
    operation_id uuid references public.operations(id) on delete set null,
    transaction_type text not null check (transaction_type in ('desembolso', 'abono_capital', 'pago_interes')),
    amount numeric not null,
    transaction_date date default current_date not null,
    notes text
);
comment on table public.loan_transaction_details is 'Details of transactions related to a specific loan.';

-- Stores the atomic double-entry accounting records (debits and credits).
create table public.ledger_entries (
    id uuid default extensions.uuid_generate_v4() primary key,
    operation_id uuid references public.operations(id) on delete cascade not null,
    account_type text not null,
    amount numeric(10, 2) not null,
    created_at timestamp with time zone default now() not null
);
comment on table public.ledger_entries is 'Stores the atomic double-entry accounting records.';

-- ----------------------------------------------------------------
-- ▤ Custom Types
-- ----------------------------------------------------------------
create type public.member_due as (
  type text,
  description text,
  amount numeric
); 