import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, FindManyOptions } from 'typeorm';
import { BuyStockDto } from './dto/buy-stock.dto';
import { StocksService } from '../stocks/stocks.service';
import { StockSubscriptionsService } from '../stock-subscriptions/stock-subscriptions.service';
import { LoansService } from '../loans/loans.service';
import { Operation } from './entities/operation.entity';
import {
  CASH_ACCOUNT,
  STOCK_CAPITAL_ACCOUNT,
  LOANS_RECEIVABLE_ACCOUNT,
} from '../common/constants/account-types';
import { LedgerEntry } from '../ledger-entries/entities/ledger-entry.entity';
import { Loan } from '../loans/entities/loan.entity';

@Injectable()
export class OperationsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly stocksService: StocksService,
    private readonly stockSubscriptionsService: StockSubscriptionsService,
    private readonly loansService: LoansService,
  ) {}

  async findOne(id: string): Promise<Operation> {
    const operation = await this.dataSource.manager
      .getRepository(Operation)
      .findOne({
        where: { id },
        relations: ['member', 'ledger_entries'],
      });

    if (!operation) {
      throw new NotFoundException(`Operation with ID "${id}" not found.`);
    }

    return operation;
  }

  async buyStock(buyStockDto: BuyStockDto) {
    const { memberId, stockId, quantity, cashAmount, loanDetails } =
      buyStockDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Validation and Calculation
      const stock = await this.stocksService.findOne(stockId);
      const totalValue = stock.value * quantity;
      const financedAmount = totalValue - cashAmount;

      if (financedAmount < 0) {
        throw new BadRequestException(
          'Cash amount cannot exceed the total value of the stock purchase.',
        );
      }
      if (financedAmount > 0 && !loanDetails) {
        throw new BadRequestException(
          'Loan details are required when the purchase is financed.',
        );
      }

      // 2. Create Master Operation
      const operation = queryRunner.manager.create(Operation, {
        member_id: memberId,
        description: `Compra de ${quantity} x ${stock.type} por socio ${memberId}`,
        type: 'STOCK_PURCHASE',
      });
      await queryRunner.manager.save(operation);
      const operation_id = operation.id;
      const ledgerEntries: LedgerEntry[] = [];

      // 3. Create Loan if financed
      let newLoan: Loan | null = null;
      if (financedAmount > 0 && loanDetails) {
        newLoan = await this.loansService.create(
          {
            member_id: memberId,
            approved_amount: financedAmount,
            outstanding_balance: financedAmount,
            interest_rate: loanDetails.interest_rate,
            loan_type: loanDetails.loan_type,
            status: 'active',
          },
          queryRunner,
        );
      }

      // 4. Update Stock Subscription
      await this.stockSubscriptionsService.create(
        {
          member_id: memberId,
          stock_id: stockId,
          quantity,
          financing_loan_id: newLoan ? newLoan.id : null,
        },
        queryRunner,
      );

      // Corrected Double-Entry Logic:
      // When a stock is purchased, the fund's capital increases. This is a CREDIT to STOCK_CAPITAL.
      // This is paid for by either cash on hand (DEBIT to CASH) or by creating a loan receivable (DEBIT to LOANS_RECEIVABLE).

      // Credit entry for the increase in stock capital
      ledgerEntries.push(
        queryRunner.manager.create(LedgerEntry, {
          operation_id,
          account_type: STOCK_CAPITAL_ACCOUNT,
          amount: -totalValue, // Credit to Stock Capital
        }),
      );

      // Debit entry for the cash received
      if (cashAmount > 0) {
        ledgerEntries.push(
          queryRunner.manager.create(LedgerEntry, {
            operation_id,
            account_type: CASH_ACCOUNT,
            amount: cashAmount, // Debit to Cash
          }),
        );
      }

      // Debit entry for the loan receivable created
      if (newLoan) {
        ledgerEntries.push(
          queryRunner.manager.create(LedgerEntry, {
            operation_id,
            account_type: LOANS_RECEIVABLE_ACCOUNT,
            amount: financedAmount, // Debit to Loans Receivable
          }),
        );
      }

      // 6. Save Ledger Entries
      await queryRunner.manager.save(ledgerEntries);

      await queryRunner.commitTransaction();

      return {
        message: 'Stock purchase completed successfully.',
        operationId: operation_id,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(params: { meetingId?: string }) {
    const queryOptions: FindManyOptions<Operation> = {
      relations: ['ledger_entries'],
    };

    if (params.meetingId) {
      queryOptions.where = { meeting_id: params.meetingId };
    }

    return this.dataSource.manager.getRepository(Operation).find(queryOptions);
  }
}
