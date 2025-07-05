-- =================================================================
-- ▤ 0002: Functions
-- =================================================================

-- ----------------------------------------------------------------
-- ▤ Drop existing functions
-- ----------------------------------------------------------------
drop function if exists public.handle_new_user() cascade;
drop function if exists public.get_my_role();
drop function if exists public.close_meeting(uuid);
drop function if exists public.get_member_dues(uuid);
drop function if exists public.record_meeting_transactions(uuid, uuid, jsonb);

-- ----------------------------------------------------------------
-- ▤ Function Definitions
-- ----------------------------------------------------------------

-- Function to create a new member profile when a new user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.members (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.email), new.email);
  return new;
end;
$$;
comment on function public.handle_new_user() is 'Creates a new member profile upon user signup.';

-- This trigger calls the handle_new_user function after a new user is created.
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Gets the role of the currently authenticated user from their JWT.
create or replace function public.get_my_role()
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  return auth.jwt()->>'role';
end;
$$;
comment on function public.get_my_role() is 'Gets the role of the currently authenticated user from their JWT.';

-- Closes an active meeting.
create or replace function public.close_meeting(p_meeting_id uuid)
returns void
language plpgsql
as $$
begin
  update public.meetings
  set status = 'closed'
  where id = p_meeting_id and status = 'active';
end;
$$;
comment on function public.close_meeting(p_meeting_id uuid) is 'Closes an active meeting.';

-- Calculates all expected payments (dues) for a given member.
create or replace function public.get_member_dues(p_member_id uuid)
returns setof public.member_due
language plpgsql
as $$
begin
    -- 1. Mandatory fund contributions
    return query
    select
      'mandatory_contribution'::text as type,
      fa.asset_type as description,
      fa.amount as amount
    from public.fund_assets fa
    where fa.amount > 0;

    -- 2. Subscribed stock fees
    return query
    select
      'stock_fee'::text as type,
      'Cuota de acción: ' || s.type as description,
      s.monthly_contribution as amount
    from public.stock_subscriptions as ss
    join public.stocks as s on ss.stock_id = s.id
    where ss.member_id = p_member_id
      and ss.status = 'active'
      and s.monthly_contribution > 0;

    -- 3. Loan payments (logic to be implemented in the future)
end;
$$;
comment on function public.get_member_dues(p_member_id uuid) is 'Calculates all expected payments (dues) for a given member.';


-- (Placeholder) Records all transactions for a member in a specific meeting.
create or replace function public.record_meeting_transactions(
  p_member_id uuid,
  p_meeting_id uuid,
  p_payments jsonb
)
returns uuid -- returns the new operation_id
language plpgsql
as $$
declare
  v_operation_id uuid;
begin
  -- 1. Create a single master operation for this set of payments
  insert into public.operations (member_id, meeting_id, description)
  values (p_member_id, p_meeting_id, 'Registro de pagos de la reunión.')
  returning id into v_operation_id;

  -- 2. Process each payment and create double-entry ledger records.
  -- This part is a placeholder and requires detailed accounting logic.

  raise notice 'Function record_meeting_transactions is a placeholder and not fully implemented.';

  return v_operation_id;
end;
$$;
comment on function public.record_meeting_transactions(uuid, uuid, jsonb) is '(Placeholder) Records all transactions for a member in a specific meeting.'; 