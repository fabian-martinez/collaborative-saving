import { LoanTransactionDetailMapper } from './loan-transaction-detail.mapper';
import {
  LoanTransactionDetail,
  LoanTransactionType,
} from '@domain/entities/loan-transaction-detail.entity';
import { LoanTransactionDetail as LoanTransactionDetailEntity } from '../entities/loan-transaction-detail.entity';

describe('LoanTransactionDetailMapper', () => {
  describe('toDomain', () => {
    it('should map LoanTransactionDetailEntity to Domain', () => {
      const entity: Partial<LoanTransactionDetailEntity> = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        loanId: 'loan-1',
        transactionType: 'principal_payment',
        amount: 500,
        transactionDate: new Date('2024-01-15'),
        notes: 'Monthly payment',
        operationId: 'operation-1',
      };

      const domain = LoanTransactionDetailMapper.toDomain(
        entity as LoanTransactionDetailEntity,
      );

      expect(domain).toBeInstanceOf(LoanTransactionDetail);
      expect(domain.id).toBe(entity.id);
      expect(domain.loanId).toBe(entity.loanId);
      expect(domain.amount).toBe(500);
    });
  });

  describe('toPersistence', () => {
    it('should map Domain to LoanTransactionDetailEntity', () => {
      const domain = LoanTransactionDetail.create({
        loanId: 'loan-1',
        transactionType: LoanTransactionType.PRINCIPAL_PAYMENT,
        amount: 500,
        notes: 'Monthly payment',
      });

      const persistence = LoanTransactionDetailMapper.toPersistence(domain);

      expect(persistence.id).toBe(domain.id);
      expect(persistence.loanId).toBe(domain.loanId);
      expect(persistence.amount).toBe(500);
    });
  });
});
