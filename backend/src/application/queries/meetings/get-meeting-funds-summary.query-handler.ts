/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { Inject, Injectable } from '@nestjs/common';
import {
  MEETING_REPOSITORY,
  LOAN_REPOSITORY,
  STOCK_REPOSITORY,
  STOCK_SUBSCRIPTION_REPOSITORY,
  LEDGER_ENTRY_REPOSITORY,
  OPERATION_REPOSITORY,
} from '@domain/constants/injection-tokens';
import { MeetingRepository } from '@domain/ports/repositories/meeting-repository.port';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { StockRepository } from '@domain/ports/repositories/stock-repository.port';
import { StockSubscriptionRepository } from '@domain/ports/repositories/stock-subscription-repository.port';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { OperationRepository } from '@domain/ports/repositories/operation-repository.port';
import { MeetingNotFoundException } from '@application/exceptions/meeting-not-found.exception';
import {
  MeetingFundsSummaryDto,
  LoanFundSummaryDto,
  StockFundSummaryDto,
} from '@application/dto/meetings/get-meeting-funds-summary.dto';
import { Loan, LoanStatus } from '@domain/entities/loan.entity';
import { Stock } from '@domain/entities/stock.entity';
import {
  StockSubscription,
  StockSubscriptionStatus,
} from '@domain/entities/stock-subscription.entity';
import { LedgerEntry } from '@domain/entities/ledger-entry.entity';
import { Operation } from '@domain/entities/operation.entity';
import {
  LOANS_RECEIVABLE_ACCOUNT,
  INTEREST_INCOME_ACCOUNT,
} from '@domain/constants/account-types';
import { OperationType } from '@domain/enums/operation-type.enum';

interface LoanTypeAccumulator {
  loanType: string;
  loanTypeName: string;
  outstandingBalance: number;
  activeCount: number;
  principal: number;
  interest: number;
}

const DEFAULT_LOAN_TYPE_ORDER = ['corriente', 'prioritario', 'agil', 'accion'];

const DEFAULT_LOAN_TYPE_NAMES: Record<string, string> = {
  corriente: 'Corriente',
  prioritario: 'Prioritario',
  agil: 'Ágil',
  accion: 'Acción',
};

function formatLoanTypeName(code: string): string {
  if (DEFAULT_LOAN_TYPE_NAMES[code]) {
    return DEFAULT_LOAN_TYPE_NAMES[code];
  }
  return code.charAt(0).toUpperCase() + code.slice(1);
}

@Injectable()
export class GetMeetingFundsSummaryQueryHandler {
  constructor(
    @Inject(MEETING_REPOSITORY)
    private readonly meetingRepository: MeetingRepository,
    @Inject(LOAN_REPOSITORY)
    private readonly loanRepository: LoanRepository,
    @Inject(STOCK_REPOSITORY)
    private readonly stockRepository: StockRepository,
    @Inject(STOCK_SUBSCRIPTION_REPOSITORY)
    private readonly stockSubscriptionRepository: StockSubscriptionRepository,
    @Inject(LEDGER_ENTRY_REPOSITORY)
    private readonly ledgerEntryRepository: LedgerEntryRepository,
    @Inject(OPERATION_REPOSITORY)
    private readonly operationRepository: OperationRepository,
  ) {}

  async execute(meetingId: string): Promise<MeetingFundsSummaryDto> {
    // 1. Verify meeting exists
    const meeting = await this.meetingRepository.findById(meetingId);
    if (!meeting) {
      throw new MeetingNotFoundException(meetingId);
    }

    // 2. Fetch all loans and map by ID
    const allLoans: Loan[] = await this.loanRepository.findAll();
    const loanMap = new Map<string, Loan>(allLoans.map((l: Loan) => [l.id, l]));

    // 3. Initialize accumulator with default loan types
    const loanTypesMap = new Map<string, LoanTypeAccumulator>();
    for (const code of DEFAULT_LOAN_TYPE_ORDER) {
      loanTypesMap.set(code, {
        loanType: code,
        loanTypeName: DEFAULT_LOAN_TYPE_NAMES[code],
        outstandingBalance: 0,
        activeCount: 0,
        principal: 0,
        interest: 0,
      });
    }

    // 4. Group active loans by loanType
    for (const loan of allLoans) {
      const isLoanActive =
        loan.status === 'active' ||
        (loan.status as LoanStatus) === LoanStatus.ACTIVE;

      if (!isLoanActive) {
        continue;
      }

      const rawCode = loan.loanType?.trim().toLowerCase() || 'corriente';
      let acc = loanTypesMap.get(rawCode);
      if (!acc) {
        acc = {
          loanType: rawCode,
          loanTypeName: formatLoanTypeName(rawCode),
          outstandingBalance: 0,
          activeCount: 0,
          principal: 0,
          interest: 0,
        };
        loanTypesMap.set(rawCode, acc);
      }

      acc.outstandingBalance += loan.outstandingBalance;
      acc.activeCount += 1;
    }

    // 5. Fetch ledger entries and operations for the meeting
    const operations: Operation[] =
      await this.operationRepository.findByMeeting(meetingId);
    let ledgerEntries: LedgerEntry[] =
      await this.ledgerEntryRepository.findByMeeting(meetingId);

    // Fallback: If findByMeeting returned empty but operations exist, try findByOperations
    if (
      (!ledgerEntries || ledgerEntries.length === 0) &&
      operations.length > 0
    ) {
      const operationIds = operations.map((op: Operation) => op.id);
      ledgerEntries =
        await this.ledgerEntryRepository.findByOperations(operationIds);
    }

    const operationMap = new Map<string, Operation>(
      operations.map((op: Operation) => [op.id, op]),
    );

    // Map operationId -> loanId from entries that have loanId
    const operationLoanIdMap = new Map<string, string>();
    for (const entry of ledgerEntries) {
      if (entry.loanId) {
        operationLoanIdMap.set(entry.operationId, entry.loanId);
      }
    }

    // 6. Aggregate collections for this meeting (principal and interest)
    for (const entry of ledgerEntries) {
      const operation = operationMap.get(entry.operationId);
      const isDisbursement =
        operation?.type === OperationType.LOAN_DISBURSEMENT ||
        (entry.description &&
          entry.description.toLowerCase().includes('desembolso'));

      // Skip loan disbursements as they represent money going out
      if (isDisbursement) {
        continue;
      }

      const isPrincipal =
        entry.accountType === LOANS_RECEIVABLE_ACCOUNT &&
        (entry.amount < 0 ||
          operation?.type === OperationType.LOAN_PAYMENT ||
          operation?.type === OperationType.STOCK_LOAN_PAYMENT);

      const isInterest = entry.accountType === INTEREST_INCOME_ACCOUNT;

      if (!isPrincipal && !isInterest) {
        continue;
      }

      const loanId = entry.loanId || operationLoanIdMap.get(entry.operationId);
      const associatedLoan = loanId ? loanMap.get(loanId) : null;
      const loanTypeCode =
        associatedLoan?.loanType?.trim().toLowerCase() || 'corriente';

      let acc = loanTypesMap.get(loanTypeCode);
      if (!acc) {
        acc = {
          loanType: loanTypeCode,
          loanTypeName: formatLoanTypeName(loanTypeCode),
          outstandingBalance: 0,
          activeCount: 0,
          principal: 0,
          interest: 0,
        };
        loanTypesMap.set(loanTypeCode, acc);
      }

      const absAmount = Math.abs(entry.amount);
      if (isPrincipal) {
        acc.principal += absAmount;
      } else if (isInterest) {
        acc.interest += absAmount;
      }
    }

    // Build sorted array of loan funds summary
    const loansByType: LoanFundSummaryDto[] = Array.from(
      loanTypesMap.values(),
    ).map((acc: LoanTypeAccumulator) => ({
      loanType: acc.loanType,
      loanTypeName: acc.loanTypeName,
      outstandingBalance: Number(acc.outstandingBalance.toFixed(2)),
      collectedThisMeeting: {
        principal: Number(acc.principal.toFixed(2)),
        interest: Number(acc.interest.toFixed(2)),
        total: Number((acc.principal + acc.interest).toFixed(2)),
      },
      activeCount: acc.activeCount,
    }));

    loansByType.sort((a: LoanFundSummaryDto, b: LoanFundSummaryDto) => {
      const indexA = DEFAULT_LOAN_TYPE_ORDER.indexOf(a.loanType);
      const indexB = DEFAULT_LOAN_TYPE_ORDER.indexOf(b.loanType);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.loanType.localeCompare(b.loanType);
    });

    // 7. Aggregate stocks and subscriptions
    const stocks: Stock[] = await this.stockRepository.findActive();
    const stockIds = stocks.map((s: Stock) => s.id);
    const subscriptions: StockSubscription[] =
      stockIds.length > 0
        ? await this.stockSubscriptionRepository.findByStocks(stockIds)
        : [];

    const activeSubscriptions = subscriptions.filter(
      (s: StockSubscription) =>
        s.status === 'active' ||
        (s.status as StockSubscriptionStatus) ===
          StockSubscriptionStatus.ACTIVE,
    );

    const stocksByType: StockFundSummaryDto[] = stocks.map((stock: Stock) => {
      const stockSubs = activeSubscriptions.filter(
        (sub: StockSubscription) => sub.stockId === stock.id,
      );
      const totalShares = stockSubs.reduce(
        (sum: number, sub: StockSubscription) => sum + sub.quantity,
        0,
      );
      const shareValue = stock.value;
      const totalValue = Number((totalShares * shareValue).toFixed(2));

      return {
        stockId: stock.id,
        stockName: stock.name,
        stockType: stock.type || stock.name,
        isGuaranteed: stock.isGuaranteed,
        totalShares,
        shareValue,
        totalValue,
        activeSubscriptionsCount: stockSubs.length,
      };
    });

    return {
      meetingId: meeting.id,
      loansByType,
      stocksByType,
    };
  }
}
