import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
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
} from '@domain/constants/account-types';

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
    @InjectDataSource()
    private readonly dataSource: DataSource,
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

    // Calculate totalInterest
    const totalInterest = await sumByAccountType(INTEREST_INCOME_ACCOUNT);

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
}
