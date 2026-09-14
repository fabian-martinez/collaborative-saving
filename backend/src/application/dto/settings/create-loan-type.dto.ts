/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

export interface CreateLoanTypeDto {
  name: string;
  code?: string;
  interestRate: number;
  description?: string | null;
}
