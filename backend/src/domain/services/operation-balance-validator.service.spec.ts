import { OperationBalanceValidator } from './operation-balance-validator.service';
import { LedgerEntry } from '../entities/ledger-entry.entity';
import { BusinessRuleError } from '../errors/business-rule.error';
import {
  CASH_ACCOUNT,
  STOCK_CAPITAL_ACCOUNT,
  LOANS_RECEIVABLE_ACCOUNT,
} from '../constants/account-types';

describe('OperationBalanceValidator', () => {
  let validator: OperationBalanceValidator;

  beforeEach(() => {
    validator = new OperationBalanceValidator();
  });

  describe('validateBalance', () => {
    it('should validate a balanced operation with 2 entries', () => {
      const entries = [
        LedgerEntry.create({
          operationId: 'op-1',
          accountType: CASH_ACCOUNT,
          amount: -100, // Credit
        }),
        LedgerEntry.create({
          operationId: 'op-1',
          accountType: STOCK_CAPITAL_ACCOUNT,
          amount: 100, // Debit
        }),
      ];

      expect(() => validator.validateBalance(entries)).not.toThrow();
    });

    it('should validate a balanced operation with multiple entries', () => {
      const entries = [
        LedgerEntry.create({
          operationId: 'op-1',
          accountType: CASH_ACCOUNT,
          amount: -1000, // Credit
        }),
        LedgerEntry.create({
          operationId: 'op-1',
          accountType: STOCK_CAPITAL_ACCOUNT,
          amount: 500, // Debit
        }),
        LedgerEntry.create({
          operationId: 'op-1',
          accountType: LOANS_RECEIVABLE_ACCOUNT,
          amount: 500, // Debit
        }),
      ];

      expect(() => validator.validateBalance(entries)).not.toThrow();
    });

    it('should throw BusinessRuleError when there are less than 2 entries', () => {
      const entries = [
        LedgerEntry.create({
          operationId: 'op-1',
          accountType: CASH_ACCOUNT,
          amount: -100,
        }),
      ];

      expect(() => validator.validateBalance(entries)).toThrow(
        BusinessRuleError,
      );
      expect(() => validator.validateBalance(entries)).toThrow(
        'Operation must have at least 2 ledger entries',
      );
    });

    it('should throw BusinessRuleError when operation is not balanced', () => {
      const entries = [
        LedgerEntry.create({
          operationId: 'op-1',
          accountType: CASH_ACCOUNT,
          amount: -100, // Credit
        }),
        LedgerEntry.create({
          operationId: 'op-1',
          accountType: STOCK_CAPITAL_ACCOUNT,
          amount: 150, // Debit (does not match credit)
        }),
      ];

      expect(() => validator.validateBalance(entries)).toThrow(
        BusinessRuleError,
      );
      expect(() => validator.validateBalance(entries)).toThrow(
        'Operation is not balanced',
      );
    });

    it('should handle floating point precision correctly', () => {
      const entries = [
        LedgerEntry.create({
          operationId: 'op-1',
          accountType: CASH_ACCOUNT,
          amount: -100.01, // Credit
        }),
        LedgerEntry.create({
          operationId: 'op-1',
          accountType: STOCK_CAPITAL_ACCOUNT,
          amount: 50.005, // Debit
        }),
        LedgerEntry.create({
          operationId: 'op-1',
          accountType: LOANS_RECEIVABLE_ACCOUNT,
          amount: 50.005, // Debit
        }),
      ];

      // Should round to 2 decimals and match
      expect(() => validator.validateBalance(entries)).not.toThrow();
    });

    it('should validate that entries with zero amount are not allowed', () => {
      // Note: LedgerEntry.create() will throw if amount is 0 due to entity validation,
      // so this is a defensive check. We test by creating a mock entry with zero amount.
      const entry1 = LedgerEntry.create({
        operationId: 'op-1',
        accountType: CASH_ACCOUNT,
        amount: -100,
      });

      // Create a mock entry with zero amount to test validator's defensive check
      // In practice, this should be caught by LedgerEntry validation, but the
      // validator provides an additional safety check
      const entryWithZero = {
        id: 'test-id',
        operationId: 'op-1',
        accountType: STOCK_CAPITAL_ACCOUNT,
        amount: 0,
        createdAt: new Date(),
      } as LedgerEntry;

      const entriesWithZero = [entry1, entryWithZero];

      expect(() => validator.validateBalance(entriesWithZero)).toThrow(
        BusinessRuleError,
      );
      expect(() => validator.validateBalance(entriesWithZero)).toThrow(
        'Ledger entry amount cannot be zero',
      );
    });

    it('should validate balanced operation with negative and positive amounts', () => {
      const entries = [
        LedgerEntry.create({
          operationId: 'op-1',
          accountType: CASH_ACCOUNT,
          amount: -500.5, // Credit
        }),
        LedgerEntry.create({
          operationId: 'op-1',
          accountType: STOCK_CAPITAL_ACCOUNT,
          amount: 300.25, // Debit
        }),
        LedgerEntry.create({
          operationId: 'op-1',
          accountType: LOANS_RECEIVABLE_ACCOUNT,
          amount: 200.25, // Debit
        }),
      ];

      expect(() => validator.validateBalance(entries)).not.toThrow();
    });
  });
});
