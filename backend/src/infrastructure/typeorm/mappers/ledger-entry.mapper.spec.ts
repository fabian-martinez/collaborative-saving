import { LedgerEntryMapper } from './ledger-entry.mapper';
import { LedgerEntry } from '@domain/entities/ledger-entry.entity';
import { LedgerEntry as LedgerEntryEntity } from '../entities/ledger-entry.entity';
import { CASH_ACCOUNT } from '@domain/constants/account-types';

describe('LedgerEntryMapper', () => {
  describe('toDomain', () => {
    it('should map LedgerEntryEntity to Domain LedgerEntry', () => {
      const entity: Partial<LedgerEntryEntity> = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        operationId: 'operation-1',
        accountType: CASH_ACCOUNT,
        amount: 1000,
        description: 'Payment received',
        createdAt: new Date('2024-01-15'),
        loanId: 'loan-1',
        stockId: null,
        mandatoryContributionId: null,
        stockSubscriptionId: null,
      };

      const domain = LedgerEntryMapper.toDomain(entity as LedgerEntryEntity);

      expect(domain).toBeInstanceOf(LedgerEntry);
      expect(domain.id).toBe(entity.id);
      expect(domain.operationId).toBe('operation-1');
      expect(domain.amount).toBe(1000);
      expect(domain.loanId).toBe('loan-1');
    });
  });

  describe('toPersistence', () => {
    it('should map Domain LedgerEntry to LedgerEntryEntity', () => {
      const domain = LedgerEntry.create({
        operationId: 'operation-1',
        accountType: CASH_ACCOUNT,
        amount: 1000,
        loanId: 'loan-1',
      });

      const persistence = LedgerEntryMapper.toPersistence(domain);

      expect(persistence.id).toBe(domain.id);
      expect(persistence.operationId).toBe(domain.operationId);
      expect(persistence.amount).toBe(1000);
    });
  });
});
