/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { DashboardV2Controller } from './dashboard.v2.controller';
import { GetMonthlyMovementsQueryHandler } from '@application/queries/dashboard/get-monthly-movements.query-handler';
import { GetPortfolioStatusQueryHandler } from '@application/queries/dashboard/get-portfolio-status.query-handler';
import { GetRecentActivityQueryHandler } from '@application/queries/dashboard/get-recent-activity.query-handler';

describe('DashboardV2Controller', () => {
  let controller: DashboardV2Controller;
  let getMonthlyMovementsQuery: jest.Mocked<GetMonthlyMovementsQueryHandler>;
  let getPortfolioStatusQuery: jest.Mocked<GetPortfolioStatusQueryHandler>;
  let getRecentActivityQuery: jest.Mocked<GetRecentActivityQueryHandler>;
  let getMonthlyMovementsSpy: jest.SpyInstance;
  let getPortfolioStatusSpy: jest.SpyInstance;
  let getRecentActivitySpy: jest.SpyInstance;

  beforeEach(() => {
    getMonthlyMovementsQuery = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetMonthlyMovementsQueryHandler>;

    getPortfolioStatusQuery = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetPortfolioStatusQueryHandler>;

    getRecentActivityQuery = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetRecentActivityQueryHandler>;

    getMonthlyMovementsSpy = jest.spyOn(getMonthlyMovementsQuery, 'execute');
    getPortfolioStatusSpy = jest.spyOn(getPortfolioStatusQuery, 'execute');
    getRecentActivitySpy = jest.spyOn(getRecentActivityQuery, 'execute');

    controller = new DashboardV2Controller(
      getMonthlyMovementsQuery,
      getPortfolioStatusQuery,
      getRecentActivityQuery,
    );
  });

  describe('getDashboardSession', () => {
    it('should return { status: "ok" } for authenticated session validation', () => {
      // ACT
      const result = controller.getDashboardSession();

      // ASSERT
      expect(result).toEqual({ status: 'ok' });
    });
  });

  describe('getMonthlyMovements', () => {
    it('should map monthly movements query result to HTTP DTO', async () => {
      // ARRANGE
      const mockResult = {
        movements: [
          { label: 'Ene', collected: 1000, disbursed: 500 },
          { label: 'Feb', collected: 2000, disbursed: 1500 },
        ],
      };
      getMonthlyMovementsQuery.execute.mockResolvedValue(mockResult);

      // ACT
      const result = await controller.getMonthlyMovements();

      // ASSERT
      expect(getMonthlyMovementsSpy).toHaveBeenCalled();
      expect(result).toEqual({
        movements: mockResult.movements,
        labels: ['Ene', 'Feb'],
        collected: [1000, 2000],
        disbursed: [500, 1500],
      });
    });
  });

  describe('getPortfolioStatus', () => {
    it('should map portfolio status query result to HTTP DTO', async () => {
      // ARRANGE
      const mockResult = {
        upToDate: 10,
        overdue: 2,
        writtenOff: 1,
      };
      getPortfolioStatusQuery.execute.mockResolvedValue(mockResult);

      // ACT
      const result = await controller.getPortfolioStatus();

      // ASSERT
      expect(getPortfolioStatusSpy).toHaveBeenCalled();
      expect(result).toEqual({
        up_to_date: 10,
        overdue: 2,
        written_off: 1,
      });
    });
  });

  describe('getRecentActivity', () => {
    it('should map recent activity query result to HTTP response DTOs', async () => {
      // ARRANGE
      const mockActivities = [
        {
          id: 'act-1',
          type: 'MANDATORY_CONTRIBUTION',
          description: 'Aporte mensual',
          amount: 150000,
          timestamp: '2024-03-01T10:00:00.000Z',
          memberName: 'María González',
        },
      ];
      getRecentActivityQuery.execute.mockResolvedValue(mockActivities);

      // ACT
      const result = await controller.getRecentActivity();

      // ASSERT
      expect(getRecentActivitySpy).toHaveBeenCalled();
      expect(result).toEqual([
        {
          id: 'act-1',
          type: 'MANDATORY_CONTRIBUTION',
          description: 'Aporte mensual',
          amount: 150000,
          timestamp: '2024-03-01T10:00:00.000Z',
          member_name: 'María González',
        },
      ]);
    });
  });
});
