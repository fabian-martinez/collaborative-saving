/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

export interface AuthenticatedMemberResponseDto {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  identificationNumber?: string;
  phone?: string;
  address?: string;
  beneficiary?: string;
  registrationDate: Date | string;
  createdAt?: Date | string;
}
