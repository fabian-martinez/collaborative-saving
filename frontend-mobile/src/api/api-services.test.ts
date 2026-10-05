/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { membersApi } from './members.api';
import { meetingsApi } from './meetings.api';
import { fundApi } from './fund.api';
import { authApi } from './auth.api';
import apiClient from './client';
import { ApiException } from './types';

vi.mock('@/router', () => ({
  default: {
    push: vi.fn(),
    currentRoute: { value: { name: 'home', path: '/home' } },
  },
}));

vi.mock('@/features/auth/stores/authStore', () => ({
  useAuthStore: () => ({
    getToken: vi.fn().mockResolvedValue('test-token'),
    logout: vi.fn(),
  }),
}));

describe('API Services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('membersApi', () => {
    it('getMembers should request GET /v2/members', async () => {
      const mockMembers = [
        { id: '1', name: 'Member 1', email: 'm1@test.com', role: 'member', status: 'active', registration_date: '2026-01-01' },
      ];
      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({ data: mockMembers });

      const result = await membersApi.getMembers();

      expect(getSpy).toHaveBeenCalledWith('/v2/members');
      expect(result).toEqual(mockMembers);
    });

    it('getMemberById should request GET /v2/members/:id', async () => {
      const mockMember = { id: 'm-123', name: 'Member 1', email: 'm1@test.com', role: 'member', status: 'active', registration_date: '2026-01-01' };
      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({ data: mockMember });

      const result = await membersApi.getMemberById('m-123');

      expect(getSpy).toHaveBeenCalledWith('/v2/members/m-123');
      expect(result).toEqual(mockMember);
    });

    it('getMemberDues should request GET /v2/members/:id/dues', async () => {
      const mockDues = [
        { type: 'stock_fee', description: 'Cuota de acciones', amount: 50000 },
      ];
      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({ data: mockDues });

      const result = await membersApi.getMemberDues('m-123');

      expect(getSpy).toHaveBeenCalledWith('/v2/members/m-123/dues');
      expect(result).toEqual(mockDues);
    });

    it('getMemberLoans should request GET /v2/members/:id/loans', async () => {
      const mockLoans = [
        {
          id: 'loan-1',
          member_id: 'm-123',
          loan_type: 'corriente',
          approved_amount: 1000000,
          disbursed_amount: 1000000,
          outstanding_balance: 750000,
          monthly_payment_amount: 100000,
          interest_rate: 0.02,
          term: 12,
          status: 'active',
          creation_date: '2026-01-15',
        },
      ];
      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({ data: mockLoans });

      const result = await membersApi.getMemberLoans('m-123');

      expect(getSpy).toHaveBeenCalledWith('/v2/members/m-123/loans');
      expect(result).toEqual(mockLoans);
    });

    it('getMemberStockSubscriptions should handle query params correctly', async () => {
      const mockSubscriptions = [
        { id: 'sub-1', stock_id: 's-1', stock_type: 'Acción A', quantity: 5, purchase_date: '2026-01-01', status: 'active' },
      ];
      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({ data: mockSubscriptions });

      const result = await membersApi.getMemberStockSubscriptions('m-123', true);

      expect(getSpy).toHaveBeenCalledWith('/v2/members/m-123/stock-subscriptions?includeInactive=true');
      expect(result).toEqual(mockSubscriptions);
    });

    it('getStockSubscriptionById should request GET /v2/members/:id/stock-subscriptions/:subId', async () => {
      const mockSub = { id: 'sub-1', stock_id: 's-1', stock_type: 'Acción A', quantity: 5, purchase_date: '2026-01-01', status: 'active' };
      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({ data: mockSub });

      const result = await membersApi.getStockSubscriptionById('m-123', 'sub-1');

      expect(getSpy).toHaveBeenCalledWith('/v2/members/m-123/stock-subscriptions/sub-1');
      expect(result).toEqual(mockSub);
    });

    it('getMemberPayments should request GET /v2/members/:id/payments with query params', async () => {
      const mockPayments = [
        {
          operation_id: 'op-1',
          type: 'monthly_payment',
          total_amount: 150000,
          date: '2026-02-01',
          meeting_id: 'meet-1',
          entries: [],
        },
      ];
      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({ data: mockPayments });

      const result = await membersApi.getMemberPayments('m-123', {
        meeting_id: 'meet-1',
        type: 'monthly_payment',
      });

      expect(getSpy).toHaveBeenCalledWith('/v2/members/m-123/payments?meeting_id=meet-1&type=monthly_payment');
      expect(result).toEqual(mockPayments);
    });

    it('recordMonthlyPayment should POST /v2/members/:id/payments', async () => {
      const requestPayload = {
        payments: [{ type: 'stock_fee', amount: 50000 }],
        meeting_id: 'meet-1',
      };
      const mockResponse = { operation_id: 'op-123', total_amount: 50000 };
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: mockResponse });

      const result = await membersApi.recordMonthlyPayment('m-123', requestPayload);

      expect(postSpy).toHaveBeenCalledWith('/v2/members/m-123/payments', requestPayload);
      expect(result).toEqual(mockResponse);
    });

    it('getMemberPaymentSchedule should request GET /v2/members/:id/payment-schedule with query', async () => {
      const mockSchedule = {
        member_id: 'm-123',
        historical_payments: [],
        projected_payments: [],
        summary: {
          total_paid: 500000,
          total_pending: 1000000,
          next_payment_amount: 150000,
          total_outstanding_balance: 850000,
        },
      };
      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({ data: mockSchedule });

      const result = await membersApi.getMemberPaymentSchedule('m-123', { months: 6 });

      expect(getSpy).toHaveBeenCalledWith('/v2/members/m-123/payment-schedule?months=6');
      expect(result).toEqual(mockSchedule);
    });
  });

  describe('meetingsApi', () => {
    it('getActiveMeeting should return meeting data when active meeting exists', async () => {
      const mockMeeting = {
        id: 'meet-active',
        date: '2026-03-01',
        status: 'active' as const,
        notes: 'Active meeting',
        created_at: '2026-03-01',
      };
      vi.spyOn(apiClient, 'get').mockResolvedValue({ data: mockMeeting });

      const result = await meetingsApi.getActiveMeeting();

      expect(result).toEqual(mockMeeting);
    });

    it('getActiveMeeting should return null when 404 ApiException occurs', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new ApiException('Not found', 404));

      const result = await meetingsApi.getActiveMeeting();

      expect(result).toBeNull();
    });

    it('getActiveMeeting should rethrow when non-404 error occurs', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new ApiException('Internal error', 500));

      await expect(meetingsApi.getActiveMeeting()).rejects.toThrow('Internal error');
    });

    it('getMeetingById should handle query parameters', async () => {
      const mockMeeting = {
        id: 'meet-1',
        date: '2026-02-01',
        status: 'closed' as const,
        notes: null,
        created_at: '2026-02-01',
      };
      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({ data: mockMeeting });

      const result = await meetingsApi.getMeetingById('meet-1', { include_summary: true });

      expect(getSpy).toHaveBeenCalledWith('/v2/meetings/meet-1?include_summary=true');
      expect(result).toEqual(mockMeeting);
    });

    it('getMeetings should request GET /v2/meetings', async () => {
      const mockMeetings = [{ id: 'meet-1', date: '2026-01-01', status: 'closed' as const, notes: null, created_at: '2026-01-01' }];
      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({ data: mockMeetings });

      const result = await meetingsApi.getMeetings();

      expect(getSpy).toHaveBeenCalledWith('/v2/meetings');
      expect(result).toEqual(mockMeetings);
    });
  });

  describe('fundApi', () => {
    it('getFundSummary should request GET /v2/dashboard/fund-summary', async () => {
      const mockFundSummary = {
        total_patrimony: 45200000,
        solvency_percentage: 100,
        is_solvent: true,
        total_social_capital: 28500000,
        total_shares_count: 91,
        shares_by_type: [],
        shareholders: [],
        total_loans_balance: 16700000,
        active_loans_count: 13,
        loans_by_type: [],
        debtors: [],
        total_reserve_funds: 1250000,
        reserve_funds: [],
      };
      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({ data: mockFundSummary });

      const result = await fundApi.getFundSummary();

      expect(getSpy).toHaveBeenCalledWith('/v2/dashboard/fund-summary');
      expect(result).toEqual(mockFundSummary);
    });
  });

  describe('authApi', () => {
    it('validateEmail should POST /v2/auth/validate-email', async () => {
      const mockResponse = { exists: true, active: true };
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: mockResponse });

      const result = await authApi.validateEmail('socio@ejemplo.com');

      expect(postSpy).toHaveBeenCalledWith('/v2/auth/validate-email', {
        email: 'socio@ejemplo.com',
      });
      expect(result).toEqual(mockResponse);
    });

    it('getMe should GET /v2/auth/me', async () => {
      const mockProfile = {
        id: 'member-1',
        name: 'Carlos Martínez',
        email: 'carlos@ejemplo.com',
        role: 'member',
        status: 'active',
        identification_number: '123456789',
        phone: '+573001234567',
      };
      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({ data: mockProfile });

      const result = await authApi.getMe();

      expect(getSpy).toHaveBeenCalledWith('/v2/auth/me');
      expect(result).toEqual(mockProfile);
    });
  });
});
