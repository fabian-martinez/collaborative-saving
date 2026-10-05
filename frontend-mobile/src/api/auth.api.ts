/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import apiClient from './client';

export interface ValidateEmailResponse {
  exists: boolean;
  active: boolean;
}

export interface MemberProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  identification_number?: string;
  phone?: string;
  address?: string;
  beneficiary?: string;
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

  async getMe(): Promise<MemberProfile> {
    const response = await apiClient.get<MemberProfile>('/v2/auth/me');
    return response.data;
  },
};
