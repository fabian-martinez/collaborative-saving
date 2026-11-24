/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import apiClient from './client';

export interface ValidateEmailResponse {
  exists: boolean;
  active: boolean;
}

export interface AuthenticatedMemberProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'treasurer' | 'secretary' | 'member' | string;
  status: string;
  identification_number?: string | null;
  phone?: string | null;
  address?: string | null;
  beneficiary?: string | null;
  registration_date?: string;
  created_at?: string;
}

export const authApi = {
  async validateEmail(email: string): Promise<ValidateEmailResponse> {
    const response = await apiClient.post<ValidateEmailResponse>(
      '/v2/auth/validate-email',
      { email },
    );
    return response.data;
  },

  async getMe(): Promise<AuthenticatedMemberProfile> {
    const response = await apiClient.get<AuthenticatedMemberProfile>('/v2/auth/me');
    return response.data;
  },
};
