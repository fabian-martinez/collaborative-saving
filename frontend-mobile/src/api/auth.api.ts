/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import apiClient from './client';

export interface ValidateEmailResponse {
  exists: boolean;
  active: boolean;
}

export const authApi = {
  async validateEmail(email: string): Promise<ValidateEmailResponse> {
    const response = await apiClient.post<ValidateEmailResponse>(
      '/v2/auth/validate-email',
      { email },
    );
    return response.data;
  },
};
