/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

export interface UndoOperationDto {
  meetingId: string;
  operationId: string;
  reason?: string;
  performedBy: {
    id: string;
    email: string;
    role: string;
  };
}
