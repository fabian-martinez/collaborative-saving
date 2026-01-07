import { Injectable, BadRequestException } from '@nestjs/common';
import { LedgerEntryRepository } from '@domain/ports/repositories/ledger-entry-repository.port';
import { GetAccountsSummaryQueryDto } from '@application/dto/accounting/get-accounts-summary-query.dto';
import { GetAccountsSummaryResponseDto } from '@application/dto/accounting/get-accounts-summary-response.dto';
import { AccountSummaryDto } from '@application/dto/accounting/account-summary.dto';
import { AccountLedgerEntryDto } from '@application/dto/accounting/account-ledger-entry.dto';
import { AccountType } from '@domain/constants/account-types';
import { OperationType } from '@domain/enums/operation-type.enum';

// Helper function to get account name in Spanish
function getAccountName(accountType: AccountType): string {
  const accountNames: Record<AccountType, string> = {
    CASH: 'Efectivo',
    LOANS_RECEIVABLE: 'Préstamos por Cobrar',
    INVESTMENT_IN_STOCKS: 'Inversión en Acciones',
    DIVIDENDS_PAYABLE: 'Dividendos por Pagar',
    STOCK_CAPITAL: 'Capital de Acciones',
    STOCK_TRANSFER: 'Transferencia de Acciones',
    REVALUATION_SURPLUS: 'Superávit de Revalorización',
    MEMBER_EQUITY: 'Patrimonio del Socio',
    ACCUMULATED_SURPLUS: 'Superávit Acumulado',
    INTEREST_INCOME: 'Ingresos por Intereses',
    FEE_INCOME: 'Ingresos por Multas',
    MANDATORY_CONTRIBUTION_INCOME: 'Ingresos por Cuotas Obligatorias',
    INSURANCE_INCOME: 'Ingresos por Seguro',
    DIVIDEND_EXPENSE: 'Gastos por Dividendos',
    OTHER_EXPENSES: 'Otros Gastos',
    NOVELTY_LOSS: 'Pérdidas por Novedades',
  };
  return accountNames[accountType] || accountType;
}

// Helper function to get account category for sorting
function getAccountCategory(accountType: AccountType): number {
  // 1: Activos, 2: Pasivos, 3: Patrimonio, 4: Ingresos, 5: Gastos
  const categories: Record<AccountType, number> = {
    CASH: 1,
    LOANS_RECEIVABLE: 1,
    INVESTMENT_IN_STOCKS: 1,
    DIVIDENDS_PAYABLE: 2,
    STOCK_CAPITAL: 3,
    STOCK_TRANSFER: 3,
    REVALUATION_SURPLUS: 3,
    MEMBER_EQUITY: 3,
    ACCUMULATED_SURPLUS: 3,
    INTEREST_INCOME: 4,
    FEE_INCOME: 4,
    MANDATORY_CONTRIBUTION_INCOME: 4,
    INSURANCE_INCOME: 4,
    DIVIDEND_EXPENSE: 5,
    OTHER_EXPENSES: 5,
    NOVELTY_LOSS: 5,
  };
  return categories[accountType] || 99;
}

@Injectable()
export class GetAccountsSummaryQueryHandler {
  constructor(private readonly ledgerEntryRepository: LedgerEntryRepository) {}

  async execute(
    query: GetAccountsSummaryQueryDto,
  ): Promise<GetAccountsSummaryResponseDto> {
    // Validate date range
    if (query.startDate && query.endDate) {
      const start = new Date(query.startDate);
      const end = new Date(query.endDate);
      if (start > end) {
        throw new BadRequestException(
          'startDate must be before or equal to endDate',
        );
      }
    }

    // Prepare filters
    const filters = {
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      accountTypes: query.accountTypes,
    };

    const entriesLimit = query.entriesLimit || 10;

    // Get data from repository
    const accountsData = await this.ledgerEntryRepository.getAccountsSummary(
      filters,
      entriesLimit,
    );

    // Map to DTOs and filter zero balance accounts if needed
    const accounts: AccountSummaryDto[] = accountsData
      .map((data) => {
        const accountSummary: AccountSummaryDto = {
          accountType: data.accountType,
          accountName: getAccountName(data.accountType),
          totalBalance: data.totalBalance,
          totalDebits: data.totalDebits,
          totalCredits: data.totalCredits,
          entriesCount: data.entriesCount,
          hasMoreEntries: data.entriesCount > entriesLimit,
          entries: data.entries.map(
            (entry): AccountLedgerEntryDto => ({
              id: entry.id,
              operationId: entry.operationId,
              accountType: entry.accountType,
              amount: entry.amount,
              createdAt: entry.createdAt,
              description: entry.description,
              loanId: entry.loanId,
              stockId: entry.stockId,
              mandatoryContributionId: entry.mandatoryContributionId,
              stockSubscriptionId: entry.stockSubscriptionId,
              operationType: entry.operationType
                ? (entry.operationType as OperationType)
                : undefined,
              operationDate: entry.operationDate,
            }),
          ),
        };
        return accountSummary;
      })
      .filter((account) => {
        // Filter zero balance accounts if needed
        if (!query.includeZeroBalance && account.totalBalance === 0) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Sort by category first, then alphabetically
        const categoryA = getAccountCategory(a.accountType);
        const categoryB = getAccountCategory(b.accountType);
        if (categoryA !== categoryB) {
          return categoryA - categoryB;
        }
        return a.accountType.localeCompare(b.accountType);
      });

    // Calculate summary totals
    const totalDebits = accounts.reduce(
      (sum, account) => sum + account.totalDebits,
      0,
    );
    const totalCredits = accounts.reduce(
      (sum, account) => sum + account.totalCredits,
      0,
    );
    const netBalance = totalDebits - totalCredits;

    // Build response
    const response: GetAccountsSummaryResponseDto = {
      accounts,
      summary: {
        totalAccounts: accounts.length,
        totalDebits,
        totalCredits,
        netBalance,
      },
      metadata: {
        queryDate: new Date(),
        entriesLimit,
        ...(query.startDate && query.endDate
          ? {
              dateRange: {
                startDate: query.startDate,
                endDate: query.endDate,
              },
            }
          : {}),
      },
    };

    return response;
  }
}
