-- =================================================================
-- ▤ 0004: Deprecate get_member_dues function
-- =================================================================
-- This migration removes the get_member_dues function and its
-- associated member_due type. The business logic has been
-- migrated to the NestJS backend service (MeetingsService).
-- =================================================================

DROP FUNCTION IF EXISTS public.get_member_dues(uuid);
DROP TYPE IF EXISTS public.member_due; 