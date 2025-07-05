import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
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

@Injectable()
export class OperationsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly stocksService: StocksService,
    private readonly stockSubscriptionsService: StockSubscriptionsService,
    private readonly loansService: LoansService,
  ) {}

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
      });
      await queryRunner.manager.save(operation);
      const operation_id = operation.id;
      const ledgerEntries: LedgerEntry[] = [];

      // 3. Update Stock Subscription
      await this.stockSubscriptionsService.create(
        { member_id: memberId, stock_id: stockId, quantity },
        queryRunner,
      );
      // Ledger for stock purchase
      ledgerEntries.push(
        queryRunner.manager.create(LedgerEntry, {
          operation_id,
          account_type: STOCK_CAPITAL_ACCOUNT,
          amount: totalValue, // Debito a capital social (aumento de valor)
        }),
      );

      // 4. Handle Cash Payment
      if (cashAmount > 0) {
        ledgerEntries.push(
          queryRunner.manager.create(LedgerEntry, {
            operation_id,
            account_type: CASH_ACCOUNT,
            amount: cashAmount, // Debito a caja (aumento)
          }),
        );
      }

      // 5. Create Loan if financed
      if (financedAmount > 0 && loanDetails) {
        await this.loansService.create(
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
        // Ledger for loan receivable
        ledgerEntries.push(
          queryRunner.manager.create(LedgerEntry, {
            operation_id,
            account_type: LOANS_RECEIVABLE_ACCOUNT,
            amount: financedAmount, // Debito a cartera de prestamos (aumento)
          }),
        );
      }

      // Balance the transaction
      // The sum of credits must equal the debit to STOCK_CAPITAL_ACCOUNT
      const totalCredits = cashAmount + financedAmount;
      if (totalValue !== totalCredits) {
        // This should not happen with current logic, but it's a good safeguard
        throw new Error('Debit and Credit accounts do not balance.');
      }
      // This entry is implicitly created by the sum of cash and loan entries

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
}
