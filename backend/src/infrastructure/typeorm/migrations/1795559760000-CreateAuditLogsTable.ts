/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLogsTable1795559760000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.audit_logs (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
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
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
      ON public.audit_logs (entity_type, entity_id);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_meeting_id
      ON public.audit_logs (meeting_id);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type
      ON public.audit_logs (event_type);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
      ON public.audit_logs (created_at DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public.audit_logs;`);
  }
}
