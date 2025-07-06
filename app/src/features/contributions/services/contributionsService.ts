import { api } from '@/services/api';
import type { MandatoryContribution } from '../types';

const ENDPOINT_URL = '/meetings/mandatory-contributions';

// Helper to ensure numeric fields are numbers, as the backend sends them as strings.
const transformContribution = (
  contribution: Omit<MandatoryContribution, 'total'> & { total: string | number }
): MandatoryContribution => ({
  ...contribution,
  total: Number(contribution.total),
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