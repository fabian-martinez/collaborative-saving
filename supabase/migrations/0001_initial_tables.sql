-- =================================================================
-- ▤ 0001: Initial Tables, Types, and Seed Data
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
    created_at timestamp with time zone default now() not null
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
    meeting_id uuid references public.meetings(id) on delete cascade not null,
    date timestamp with time zone default now() not null,
    description text
);
comment on table public.operations is 'Represents a single, high-level financial event.';

-- Stores the atomic double-entry accounting records (debits and credits).
create table public.ledger_entries (
    id uuid default extensions.uuid_generate_v4() primary key,
    operation_id uuid references public.operations(id) on delete cascade not null,
    account_type text not null,
    amount numeric(10, 2) not null,
    created_at timestamp with time zone default now() not null
);
comment on table public.ledger_entries is 'Stores the atomic double-entry accounting records.';

-- Defines the types of stocks available in the fund.
create table public.stocks (
    id uuid default extensions.uuid_generate_v4() primary key,
    type text not null unique,
    value numeric(10, 2) not null,
    monthly_contribution numeric(10, 2) default 0 not null
);
comment on table public.stocks is 'Defines the types of stocks available in the fund.';

-- Tracks which members are subscribed to which stocks.
create table public.stock_subscriptions (
    id uuid default extensions.uuid_generate_v4() primary key,
    member_id uuid references public.members(id) on delete cascade not null,
    stock_id uuid references public.stocks(id) on delete cascade not null,
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

-- ----------------------------------------------------------------
-- ▤ Custom Types
-- ----------------------------------------------------------------
create type public.member_due as (
  type text,
  description text,
  amount numeric
);

-- ----------------------------------------------------------------
-- ▤ Seed Data
-- ----------------------------------------------------------------
insert into public.members (id, name, email, identification_number, role) values
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Ana García', 'ana.garcia@email.com', '123456781', 'admin'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Carlos Sánchez', 'carlos.sanchez@email.com', '123456782', 'member'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Beatriz Fernández', 'beatriz.fernandez@email.com', '123456783', 'member'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'David Rodríguez', 'david.rodriguez@email.com', '123456784', 'member');

insert into public.stocks (id, type, value, monthly_contribution) values
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Acción Tipo A', 100.00, 10.00),
('f47ac10b-58cc-4372-a567-0e02b2c3d480', 'Acción Tipo B', 200.00, 20.00),
('f47ac10b-58cc-4372-a567-0e02b2c3d481', 'Acción Dorada', 1000.00, 100.00);

insert into public.mandatory_contributions (asset_type, total) values
('Cuota de Administración', 5.00),
('Fondo para Actividades', 2.00);

-- Example subscription: Ana García subscribes to an "Acción Tipo A"
insert into public.stock_subscriptions (member_id, stock_id)
values (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'f47ac10b-58cc-4372-a567-0e02b2c3d479'
); 