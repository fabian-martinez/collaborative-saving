/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity({ name: 'audit_logs' })
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', name: 'event_type' })
  eventType: string;

  @Column({ type: 'text', name: 'entity_type' })
  entityType: string;

  @Column({ type: 'uuid', name: 'entity_id' })
  entityId: string;

  @Column({ type: 'uuid', name: 'meeting_id', nullable: true })
  meetingId: string | null;

  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  userId: string | null;

  @Column({ type: 'text', name: 'user_email', nullable: true })
  userEmail: string | null;

  @Column({ type: 'text', name: 'user_role', nullable: true })
  userRole: string | null;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  details: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt: Date;
}
