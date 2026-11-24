-- =================================================================
-- ▤ 0007: Create Audit Logs Table (Issue #259)
-- Immutable append-only audit trail for sensitive financial
-- and administrative actions (e.g., operation deletions).
-- =================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_type text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,
    meeting_id uuid NULL REFERENCES public.meetings(id) ON DELETE SET NULL,
    user_id uuid NULL,
    user_email text NULL,
    user_role text NULL,
    reason text NULL,
    details jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
    ON public.audit_logs (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_meeting_id
    ON public.audit_logs (meeting_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type
    ON public.audit_logs (event_type);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
    ON public.audit_logs (created_at DESC);

COMMENT ON TABLE public.audit_logs IS 'Immutable audit trail for sensitive operations and administrative actions.';
COMMENT ON COLUMN public.audit_logs.event_type IS 'Domain audit event type (e.g., OPERATION_DELETED).';
COMMENT ON COLUMN public.audit_logs.details IS 'JSONB snapshot of affected entities and metadata at the time of the event.';
