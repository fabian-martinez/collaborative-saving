import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { LedgerEntry } from '@infrastructure/typeorm/entities/ledger-entry.entity';
import { Operation } from '@infrastructure/typeorm/entities/operation.entity';
import {
  CASH_ACCOUNT,
  INTEREST_INCOME_ACCOUNT,
  LOANS_RECEIVABLE_ACCOUNT,
  DIVIDENDS_PAYABLE_ACCOUNT,
  STOCK_CAPITAL_ACCOUNT,
  NOVELTY_LOSS_ACCOUNT,
  FEE_INCOME_ACCOUNT,
} from '@domain/constants/account-types';
import { OperationType } from '@domain/enums/operation-type.enum';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { StockValueHistoryRepository } from '@domain/ports/repositories/stock-value-history-repository.port';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { PendingMemberPaymentRepository } from '@domain/ports/repositories/pending-member-payment-repository.port';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { DetailedMeetingSummaryDto } from '@application/dto/meetings/detailed-meeting-summary.dto';

export interface MeetingSummary {
  totalCash?: number;
  totalInterest?: number;
  totalLoans?: number;
  totalCollected?: number;
  totalDividends?: number;
  totalStockInvestment?: number;
  finalCashBalance?: number;
  totalDisbursed?: number;
  participantsCount?: number;
  duration?: string;
}

@Injectable()
export class MeetingSummaryService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly operationRepository: OperationRepository,
    private readonly stockValueHistoryRepository: StockValueHistoryRepository,
    private readonly loanRepository: LoanRepository,
    private readonly pendingMemberPaymentRepository: PendingMemberPaymentRepository,
    private readonly stockRepository: StockRepository,
  ) {}

  async calculateSummary(meetingId: string): Promise<MeetingSummary> {
    const ledgerRepo = this.dataSource.getRepository(LedgerEntry);
    const operationRepo = this.dataSource.getRepository(Operation);

    // Get all operations for the meeting
    const operations = await operationRepo.find({
      where: { meetingId },
      select: ['id', 'memberId', 'date'],
    });

    const operationIds = operations.map((op) => op.id);

    if (operationIds.length === 0) {
      return this.getEmptySummary();
    }

    // Helper function to sum by account type
    const sumByAccountType = async (
      accountType: string,
      positiveOnly = false,
      descriptionLike?: string,
    ): Promise<number> => {
      const qb = ledgerRepo
        .createQueryBuilder('l')
        .where('l.operation_id IN (:...operationIds)', { operationIds })
        .andWhere('l.account_type = :accountType', { accountType });

      if (positiveOnly) {
        qb.andWhere('l.amount > 0');
      }

      if (descriptionLike) {
        qb.andWhere('l.description ILIKE :desc', {
          desc: `%${descriptionLike}%`,
        });
      }

      const rawResult = (await qb
        .select('SUM(l.amount)', 'sum')
        .getRawOne()) as { sum: string | null } | null;

      return rawResult && rawResult.sum ? Number(rawResult.sum) : 0;
    };

    // Calculate totalCash
    const totalCash = await sumByAccountType(CASH_ACCOUNT);

    // Calculate totalInterest (use absolute value since interests are recorded as negative credits)
    const totalInterest = Math.abs(
      await sumByAccountType(INTEREST_INCOME_ACCOUNT),
    );

    // Calculate totalLoans
    const totalLoans = await sumByAccountType(LOANS_RECEIVABLE_ACCOUNT);

    // Calculate totalCollected (cash in - novelty loss)
    const cashIn = await sumByAccountType(CASH_ACCOUNT, true);
    const noveltyLoss = await sumByAccountType(NOVELTY_LOSS_ACCOUNT);
    const totalCollected = cashIn - Math.abs(noveltyLoss);

    // Calculate totalDividends
    const totalDividends = await sumByAccountType(DIVIDENDS_PAYABLE_ACCOUNT);

    // Calculate totalStockInvestment
    const totalStockInvestment = await sumByAccountType(
      STOCK_CAPITAL_ACCOUNT,
      false,
      'compra',
    );

    // Calculate finalCashBalance
    const totalDebits = await sumByAccountType(CASH_ACCOUNT, false);
    const creditsQb = ledgerRepo
      .createQueryBuilder('l')
      .where('l.operation_id IN (:...operationIds)', { operationIds })
      .andWhere('l.account_type = :accountType', { accountType: CASH_ACCOUNT })
      .andWhere('l.amount < 0');
    const creditsRaw = (await creditsQb
      .select('SUM(l.amount)', 'sum')
      .getRawOne()) as { sum: string | null } | null;
    const totalCreditsAbs =
      creditsRaw && creditsRaw.sum ? Math.abs(Number(creditsRaw.sum)) : 0;
    const finalCashBalance = Number(totalDebits) - Number(totalCreditsAbs);

    // Calculate totalDisbursed (cash out - credits absolute value)
    const totalDisbursed = totalCreditsAbs;

    // Calculate participantsCount
    const uniqueMembers = new Set(
      operations.map((op) => op.memberId).filter(Boolean),
    );
    const participantsCount = uniqueMembers.size;

    // Calculate duration
    const dates = operations.map((op) => op.date).filter(Boolean);
    let duration = '0h 0m';
    if (dates.length >= 2) {
      const min = Math.min(...dates.map((d) => d.getTime()));
      const max = Math.max(...dates.map((d) => d.getTime()));
      const diffMs = max - min;
      const minutes = Math.round(diffMs / 60000);
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      duration = `${hours}h ${mins}m`;
    }

    return {
      totalCash,
      totalInterest,
      totalLoans,
      totalCollected,
      totalDividends,
      totalStockInvestment,
      finalCashBalance,
      totalDisbursed,
      participantsCount,
      duration,
    };
  }

  private getEmptySummary(): MeetingSummary {
    return {
      totalCash: 0,
      totalInterest: 0,
      totalLoans: 0,
      totalCollected: 0,
      totalDividends: 0,
      totalStockInvestment: 0,
      finalCashBalance: 0,
      totalDisbursed: 0,
      participantsCount: 0,
      duration: '0h 0m',
    };
  }

  async calculateDetailedSummary(
    meetingId: string,
  ): Promise<Omit<DetailedMeetingSummaryDto, 'meeting'>> {
    const ledgerRepo = this.dataSource.getRepository(LedgerEntry);
    const operationRepo = this.dataSource.getRepository(Operation);

    // Get all operations for the meeting
    const operations = await operationRepo.find({
      where: { meetingId },
      select: ['id', 'memberId', 'type', 'date'],
    });

    const operationIds = operations.map((op) => op.id);

    // Helper function to sum by account type
    const sumByAccountType = async (
      accountType: string,
      positiveOnly = false,
    ): Promise<number> => {
      if (operationIds.length === 0) return 0;

      const qb = ledgerRepo
        .createQueryBuilder('l')
        .where('l.operation_id IN (:...operationIds)', { operationIds })
        .andWhere('l.account_type = :accountType', { accountType });

      if (positiveOnly) {
        qb.andWhere('l.amount > 0');
      }

      const rawResult = (await qb
        .select('SUM(l.amount)', 'sum')
        .getRawOne()) as { sum: string | null } | null;

      return rawResult && rawResult.sum ? Number(rawResult.sum) : 0;
    };

    // Helper function to count and sum operations by type
    const countAndSumByOperationType = async (
      operationType: OperationType,
      cashPositive: boolean,
    ): Promise<{ count: number; amount: number }> => {
      const operationsOfType = operations.filter(
        (op) => op.type === (operationType as string),
      );

      if (operationsOfType.length === 0) {
        return { count: 0, amount: 0 };
      }

      const operationIdsOfType = operationsOfType.map((op) => op.id);
      const qb = ledgerRepo
        .createQueryBuilder('l')
        .where('l.operation_id IN (:...operationIds)', {
          operationIds: operationIdsOfType,
        })
        .andWhere('l.account_type = :accountType', {
          accountType: CASH_ACCOUNT,
        });

      if (cashPositive) {
        qb.andWhere('l.amount > 0');
      } else {
        qb.andWhere('l.amount < 0');
      }

      const rawResult = (await qb
        .select('SUM(l.amount)', 'sum')
        .getRawOne()) as { sum: string | null } | null;

      const amount =
        rawResult && rawResult.sum ? Math.abs(Number(rawResult.sum)) : 0;

      return {
        count: operationsOfType.length,
        amount,
      };
    };

    // Calculate totalCollected (cash in)
    const totalCollected = await sumByAccountType(CASH_ACCOUNT, true);

    // Calculate totalDisbursed (cash out - absolute value)
    const cashOutSum =
      operationIds.length > 0
        ? ((await ledgerRepo
            .createQueryBuilder('l')
            .where('l.operation_id IN (:...operationIds)', { operationIds })
            .andWhere('l.account_type = :accountType', {
              accountType: CASH_ACCOUNT,
            })
            .andWhere('l.amount < 0')
            .select('SUM(ABS(l.amount))', 'sum')
            .getRawOne()) as { sum: string | null } | null)
        : null;
    const totalDisbursed =
      cashOutSum && cashOutSum.sum ? Number(cashOutSum.sum) : 0;

    // Calculate participants
    const uniqueMembers = new Set(
      operations.map((op) => op.memberId).filter(Boolean),
    );
    const participants = uniqueMembers.size;

    // Calculate shareValue - look for ASSET_REVALUATION in this meeting
    let shareValue = 0;
    const revaluationOperations =
      await this.operationRepository.findByMeetingAndType(
        meetingId,
        OperationType.ASSET_REVALUATION,
      );

    if (revaluationOperations.length > 0) {
      // Get the most recent revaluation operation
      const latestRevaluation = revaluationOperations.sort(
        (a, b) => b.date.getTime() - a.date.getTime(),
      )[0];

      // Get stock value histories for this operation
      const histories = await this.stockValueHistoryRepository.findByOperation(
        latestRevaluation.id,
      );

      if (histories.length > 0) {
        // Calculate average new value
        const totalNewValue = histories.reduce((sum, h) => sum + h.newValue, 0);
        shareValue = totalNewValue / histories.length;
      }
    }

    // If no revaluation, get current stock values
    if (shareValue === 0) {
      const stocks = await this.stockRepository.findActive();
      if (stocks.length > 0) {
        const totalValue = stocks.reduce((sum, s) => sum + s.value, 0);
        shareValue = totalValue / stocks.length;
      }
    }

    // Collections
    const memberContributions = await countAndSumByOperationType(
      OperationType.MONTHLY_PAYMENT,
      true,
    );
    const loanPayments = await countAndSumByOperationType(
      OperationType.LOAN_PAYMENT,
      true,
    );
    const interestCollected = Math.abs(
      await sumByAccountType(INTEREST_INCOME_ACCOUNT),
    );
    const feesCollected = Math.abs(await sumByAccountType(FEE_INCOME_ACCOUNT));

    // Disbursements
    const newLoans = await countAndSumByOperationType(
      OperationType.LOAN_DISBURSEMENT,
      false,
    );
    const stockLiquidations = await countAndSumByOperationType(
      OperationType.STOCK_WITHDRAWAL,
      false,
    );
    const dividendPayments = await countAndSumByOperationType(
      OperationType.DIVIDEND_PAYMENT,
      false,
    );

    // Metrics - Attendance
    const attendanceCurrent = participants;
    const attendancePercentage = 100; // Placeholder, would need expected count

    // Metrics - Revaluation
    let revaluation: {
      previousValue: number;
      newValue: number;
      percentage: number;
    } | null = null;
    if (revaluationOperations.length > 0) {
      const latestRevaluation = revaluationOperations.sort(
        (a, b) => b.date.getTime() - a.date.getTime(),
      )[0];
      const histories = await this.stockValueHistoryRepository.findByOperation(
        latestRevaluation.id,
      );

      if (histories.length > 0) {
        // Calculate average for revaluation
        const avgPrevious =
          histories.reduce((sum, h) => sum + h.previousValue, 0) /
          histories.length;
        const avgNew =
          histories.reduce((sum, h) => sum + h.newValue, 0) / histories.length;
        const percentage =
          avgPrevious > 0 ? ((avgNew - avgPrevious) / avgPrevious) * 100 : 0;

        revaluation = {
          previousValue: avgPrevious,
          newValue: avgNew,
          percentage,
        };
      }
    }

    // Metrics - Payments up to date
    // Get all active loans and check if they have overdue payments
    const allLoans = await this.loanRepository.findAll();
    const activeLoans = allLoans.filter((loan) => loan.status === 'active');

    // For now, we'll count all active loans as "up to date"
    // In a real scenario, we'd need to check payment schedules
    const paymentsUpToDate = activeLoans.length;

    // Metrics - Overdue payments
    // Get pending payments for this meeting
    const pendingPayments =
      await this.pendingMemberPaymentRepository.findByMeeting(meetingId);
    const overduePayments = pendingPayments.filter(
      (p) =>
        (p.status === 'pending' || p.status === 'approved') &&
        p.meetingId === meetingId,
    ).length;

    return {
      summary: {
        totalCollected,
        totalDisbursed,
        shareValue,
        participants,
      },
      collections: {
        memberContributions,
        loanPayments,
        interestCollected,
        feesCollected,
      },
      disbursements: {
        newLoans,
        stockLiquidations,
        dividendPayments,
      },
      metrics: {
        attendance: {
          current: attendanceCurrent,
          percentage: attendancePercentage,
        },
        revaluation,
        paymentsUpToDate,
        overduePayments,
      },
    };
  }
}
