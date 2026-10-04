import { DashboardV2Controller } from './dashboard.v2.controller';
import { GetMonthlyMovementsQueryHandler } from '@application/queries/dashboard/get-monthly-movements.query-handler';
import { GetPortfolioStatusQueryHandler } from '@application/queries/dashboard/get-portfolio-status.query-handler';
import { GetDashboardMetricsQueryHandler } from '@application/queries/dashboard/get-dashboard-metrics.query-handler';

describe('DashboardV2Controller', () => {
  let controller: DashboardV2Controller;
  let getMonthlyMovementsQuery: jest.Mocked<GetMonthlyMovementsQueryHandler>;
  let getPortfolioStatusQuery: jest.Mocked<GetPortfolioStatusQueryHandler>;
  let getDashboardMetricsQuery: jest.Mocked<GetDashboardMetricsQueryHandler>;
  let getMonthlyMovementsSpy: jest.SpyInstance;
  let getPortfolioStatusSpy: jest.SpyInstance;
  let getDashboardMetricsSpy: jest.SpyInstance;

  beforeEach(() => {
    getMonthlyMovementsQuery = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetMonthlyMovementsQueryHandler>;

    getPortfolioStatusQuery = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetPortfolioStatusQueryHandler>;

    getDashboardMetricsQuery = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetDashboardMetricsQueryHandler>;

    getMonthlyMovementsSpy = jest.spyOn(getMonthlyMovementsQuery, 'execute');
    getPortfolioStatusSpy = jest.spyOn(getPortfolioStatusQuery, 'execute');
    getDashboardMetricsSpy = jest.spyOn(getDashboardMetricsQuery, 'execute');

    controller = new DashboardV2Controller(
      getMonthlyMovementsQuery,
      getPortfolioStatusQuery,
      getDashboardMetricsQuery,
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

  describe('getDashboardMetrics', () => {
    it('should map dashboard metrics query result to HTTP DTO', async () => {
      // ARRANGE
      const mockResult = {
        activeMembers: { count: 42, total: 45, changePercent: 5 },
        totalStocks: { count: 328, value: 16400000, changePercent: 8 },
        activeLoans: { count: 18, inPortfolio: true },
        totalPortfolio: { value: 24500000 },
        overduePortfolio: { value: 1250000, percentOfTotal: 5.1 },
        monthlyCollected: { value: 8750000, changePercent: 12 },
      };
      getDashboardMetricsQuery.execute.mockResolvedValue(mockResult);

      // ACT
      const result = await controller.getDashboardMetrics();

      // ASSERT
      expect(getDashboardMetricsSpy).toHaveBeenCalled();
      expect(result).toEqual({
        active_members: { count: 42, total: 45, change_percent: 5 },
        total_stocks: { count: 328, value: 16400000, change_percent: 8 },
        active_loans: { count: 18, in_portfolio: true },
        total_portfolio: { value: 24500000 },
        overdue_portfolio: { value: 1250000, percent_of_total: 5.1 },
        monthly_collected: { value: 8750000, change_percent: 12 },
      });
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
});
