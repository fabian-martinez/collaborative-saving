import { LoanMapper } from './loan.mapper';
import { Loan } from '@domain/entities/loan.entity';
import { Loan as LoanEntity } from '../entities/loan.entity';

describe('LoanMapper', () => {
  describe('toDomain', () => {
    it('should map LoanEntity to Domain Loan', () => {
      const entity: Partial<LoanEntity> = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        memberId: 'member-1',
        loanType: 'corriente',
        approvedAmount: 10000,
        disbursedAmount: 5000,
        outstandingBalance: 5000, // Debe ser <= disbursedAmount cuando disbursedAmount > 0
        monthlyPaymentAmount: 500,
        interestRate: 0.02,
        term: 24,
        status: 'active',
        creationDate: new Date('2024-01-15T00:00:00.000Z'),
        loanTypeId: 'type-id-123',
        guaranteedStockId: null,
      };

      const domain = LoanMapper.toDomain(entity as LoanEntity);

      expect(domain).toBeInstanceOf(Loan);
      expect(domain.id).toBe(entity.id);
      expect(domain.memberId).toBe(entity.memberId);
      expect(domain.approvedAmount).toBe(10000);
      expect(domain.disbursedAmount).toBe(5000);
      expect(domain.interestRate).toBe(0.02);
      expect(domain.loanTypeId).toBe('type-id-123');
    });

    it('should handle guaranteedStockId', () => {
      const entity: Partial<LoanEntity> = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        memberId: 'member-1',
        loanType: 'corriente',
        approvedAmount: 10000,
        disbursedAmount: 0,
        outstandingBalance: 10000,
        monthlyPaymentAmount: 500,
        interestRate: 0.02,
        term: 24,
        status: 'pending',
        creationDate: new Date('2024-01-15'),
        guaranteedStockId: 'stock-1',
      };

      const domain = LoanMapper.toDomain(entity as LoanEntity);
      expect(domain.guaranteedStockId).toBe('stock-1');
    });
  });

  describe('toPersistence', () => {
    it('should map Domain Loan to LoanEntity', () => {
      const domain = Loan.fromPersistence({
        id: 'loan-1',
        member_id: 'member-1',
        loan_type: 'corriente',
        approved_amount: 10000,
        disbursed_amount: 0,
        outstanding_balance: 10000,
        monthly_payment_amount: 500,
        interest_rate: 0.02,
        term: 24,
        status: 'pending',
        creation_date: new Date('2024-01-15T00:00:00.000Z'),
        loan_type_id: 'type-id-123',
      });

      const persistence = LoanMapper.toPersistence(domain);

      expect(persistence.id).toBe(domain.id);
      expect(persistence.memberId).toBe(domain.memberId);
      expect(persistence.approvedAmount).toBe(domain.approvedAmount);
      expect(persistence.status).toBe(domain.status);
      expect(persistence.term).toBe(24);
      expect(persistence.loanTypeId).toBe('type-id-123');
    });
  });
});
