/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import apiClient from './client';
import { ApiException } from './types';

export interface MeetingSummary {
  total_cash?: number;
  total_interest?: number;
  total_loans?: number;
  total_collected?: number;
  total_dividends?: number;
  total_stock_investment?: number;
  final_cash_balance?: number;
  total_disbursed?: number;
  participants_count?: number;
  duration?: string;
}

export interface Meeting {
  id: string;
  date: string | Date;
  status: 'active' | 'closed';
  notes: string | null;
  created_at: string | Date;
  summary?: MeetingSummary;
}

export interface GetMeetingQuery {
  include_summary?: boolean;
}

export const meetingsApi = {
  async getMeetings(): Promise<Meeting[]> {
    const response = await apiClient.get<Meeting[]>('/v2/meetings');
    return response.data;
  },

  async getMeetingById(id: string, query?: GetMeetingQuery): Promise<Meeting> {
    const params = new URLSearchParams();
    if (query?.include_summary) params.append('include_summary', 'true');
    const queryString = params.toString();
    const url = `/v2/meetings/${id}${queryString ? `?${queryString}` : ''}`;
    const response = await apiClient.get<Meeting>(url);
    return response.data;
  },

  async getActiveMeeting(): Promise<Meeting | null> {
    try {
      const response = await apiClient.get<Meeting>('/v2/meetings/active');
      return response.data;
    } catch (error) {
      if (error instanceof ApiException && error.status === 404) {
        return null;
      }
      throw error;
    }
  },
};
