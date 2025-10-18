import { faker } from '@faker-js/faker';
import { Loan } from '../../src/loans/entities/loan.entity';

export class LoanFactory {
  static create(overrides: Partial<Loan> = {}): Loan {
    return {
      id: faker.string.uuid(),
      member_id: faker.string.uuid(),
      loan_type: 'corriente',
      approved_amount: faker.number.float({
        min: 1000,
        max: 100000,
        fractionDigits: 2,
      }),
      monthly_payment_amount: faker.number.float({
        min: 100,
        max: 5000,
        fractionDigits: 2,
      }),
      outstanding_balance: faker.number.float({
        min: 0,
        max: 100000,
        fractionDigits: 2,
      }),
      interest_rate: faker.number.float({
        min: 0.01,
        max: 0.15,
        fractionDigits: 4,
      }),
      term: faker.number.int({ min: 1, max: 60 }),
      disbursed_amount: faker.number.float({
        min: 1000,
        max: 100000,
        fractionDigits: 2,
      }),
      status: 'active',
      creation_date: faker.date.past(),
      due_installments: 0,
      guaranteed_stock_id: null,
      guaranteed_stock: null,
      member: null,
      transactions: [],
      deleted_at: null,
      ...overrides,
    } as Loan;
  }

  static createMany(count: number, overrides: Partial<Loan> = {}): Loan[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  static createActive(overrides: Partial<Loan> = {}): Loan {
    return this.create({ status: 'active', ...overrides });
  }

  static createPaid(overrides: Partial<Loan> = {}): Loan {
    return this.create({
      status: 'paid',
      outstanding_balance: 0,
      due_installments: 0,
      ...overrides,
    });
  }

  static createOverdue(overrides: Partial<Loan> = {}): Loan {
    return this.create({
      status: 'active',
      due_installments: faker.number.int({ min: 1, max: 12 }),
      ...overrides,
    });
  }

  static createWithGuaranteedStock(
    guaranteedStockId: string,
    overrides: Partial<Loan> = {},
  ): Loan {
    return this.create({
      guaranteed_stock_id: guaranteedStockId,
      ...overrides,
    });
  }
}
