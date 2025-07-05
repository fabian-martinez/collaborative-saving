-- =================================================================
-- ▤ 0003: Refactor Business Logic to Backend
-- =================================================================

-- ----------------------------------------------------------------
-- ▤ Drop functions migrated to NestJS backend
-- ----------------------------------------------------------------
drop function if exists public.get_member_dues(uuid);
drop function if exists public.record_meeting_transactions(uuid, uuid, jsonb); 