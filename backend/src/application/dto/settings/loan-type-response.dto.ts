/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

export interface LoanTypeResponseDto {
  id: string;
  code: string;
  name: string;
  interestRate: number;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}
