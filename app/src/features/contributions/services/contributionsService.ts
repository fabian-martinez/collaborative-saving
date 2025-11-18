import { api } from '@/services/api';
import type { MandatoryContribution } from '../types';

const ENDPOINT_URL = '/mandatory-contributions';

// Helper to transform backend response (camelCase) to frontend format (snake_case)
const transformContribution = (
  contribution: {
    id: string;
    assetType: string;
    value: string | number;
    total?: string | number;
  }
): MandatoryContribution => ({
  id: contribution.id,
  asset_type: contribution.assetType, // Map assetType to asset_type
  total: Number(contribution.total ?? contribution.value), // Use total if available, otherwise value
});

export const contributionsService = {
  getContributions: async (): Promise<MandatoryContribution[]> => {
    const contributions = await api.get<MandatoryContribution[]>(ENDPOINT_URL);
    return contributions.map(transformContribution);
  },

  createContribution: async (contributionData: Omit<MandatoryContribution, 'id'>): Promise<MandatoryContribution> => {
    const contribution = await api.post<MandatoryContribution>(ENDPOINT_URL, contributionData);
    return transformContribution(contribution);
  },

  updateContribution: async (id: string, contributionData: Partial<Omit<MandatoryContribution, 'id'>>): Promise<MandatoryContribution> => {
    const contribution = await api.patch<MandatoryContribution>(`${ENDPOINT_URL}/${id}`, contributionData);
    return transformContribution(contribution);
  },

  deleteContribution: (id: string): Promise<void> => {
    return api.delete<void>(`${ENDPOINT_URL}/${id}`);
  },
}; 