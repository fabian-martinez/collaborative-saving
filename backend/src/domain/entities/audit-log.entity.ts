/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { randomUUID } from 'crypto';
import { AuditEventType } from '../enums/audit-event-type.enum';

export interface CreateAuditLogProps {
  eventType: AuditEventType;
  entityType: string;
  entityId: string;
  meetingId?: string | null;
  userId?: string | null;
  userEmail?: string | null;
  userRole?: string | null;
  reason?: string | null;
  details?: Record<string, unknown>;
  createdAt?: Date;
}

export interface AuditLogPersistenceProps {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string;
  meetingId?: string | null;
  userId?: string | null;
  userEmail?: string | null;
  userRole?: string | null;
  reason?: string | null;
  details?: Record<string, unknown> | null;
  createdAt: Date | string;
}

/**
 * Immutable domain entity representing an audit trail entry.
 */
export class AuditLog {
  constructor(
    public readonly id: string,
    private readonly _eventType: AuditEventType,
    private readonly _entityType: string,
    private readonly _entityId: string,
    private readonly _meetingId: string | null,
    private readonly _userId: string | null,
    private readonly _userEmail: string | null,
    private readonly _userRole: string | null,
    private readonly _reason: string | null,
    private readonly _details: Record<string, unknown>,
    private readonly _createdAt: Date,
  ) {
    this.validateInvariants();
  }

  static create(props: CreateAuditLogProps): AuditLog {
    return new AuditLog(
      randomUUID(),
      props.eventType,
      props.entityType,
      props.entityId,
      props.meetingId ?? null,
      props.userId ?? null,
      props.userEmail ?? null,
      props.userRole ?? null,
      props.reason ?? null,
      props.details ? { ...props.details } : {},
      props.createdAt ?? new Date(),
    );
  }

  static fromPersistence(props: AuditLogPersistenceProps): AuditLog {
    if (
      !Object.values(AuditEventType).includes(props.eventType as AuditEventType)
    ) {
      throw new Error(`Invalid audit event type: ${props.eventType}`);
    }

    return new AuditLog(
      props.id,
      props.eventType as AuditEventType,
      props.entityType,
      props.entityId,
      props.meetingId ?? null,
      props.userId ?? null,
      props.userEmail ?? null,
      props.userRole ?? null,
      props.reason ?? null,
      props.details ? { ...props.details } : {},
      typeof props.createdAt === 'string'
        ? new Date(props.createdAt)
        : props.createdAt,
    );
  }

  private validateInvariants(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error('AuditLog id is required');
    }
    if (!Object.values(AuditEventType).includes(this._eventType)) {
      throw new Error(`Invalid audit event type: ${this._eventType}`);
    }
    if (!this._entityType || this._entityType.trim().length === 0) {
      throw new Error('AuditLog entityType is required');
    }
    if (!this._entityId || this._entityId.trim().length === 0) {
      throw new Error('AuditLog entityId is required');
    }
  }

  get eventType(): AuditEventType {
    return this._eventType;
  }

  get entityType(): string {
    return this._entityType;
  }

  get entityId(): string {
    return this._entityId;
  }

  get meetingId(): string | null {
    return this._meetingId;
  }

  get userId(): string | null {
    return this._userId;
  }

  get userEmail(): string | null {
    return this._userEmail;
  }

  get userRole(): string | null {
    return this._userRole;
  }

  get reason(): string | null {
    return this._reason;
  }

  get details(): Record<string, unknown> {
    return { ...this._details };
  }

  get createdAt(): Date {
    return this._createdAt;
  }
}
