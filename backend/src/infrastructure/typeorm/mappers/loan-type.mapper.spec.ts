import { LoanType, AmortizationType } from '@domain/entities/loan-type.entity';
import { LoanType as LoanTypeEntity, AmortizationType as AmortizationTypeEntity } from '../entities/loan-type.entity';
import { LoanTypeMapper } from './loan-type.mapper';

describe('LoanTypeMapper', () => {
  const mockId = 'type-1';
  
  const mockEntity: LoanTypeEntity = {
    id: mockId,
    name: 'Corriente',
    defaultApprovedAmount: 1000,
    defaultInterestRate: 0.05,
    defaultTerm: 12,
    amortizationType: AmortizationTypeEntity.FRENCH,
  } as LoanTypeEntity;

  const mockDomain = LoanType.create({
    id: mockId,
    name: 'Corriente',
    defaultApprovedAmount: 1000,
    defaultInterestRate: 0.05,
    defaultTerm: 12,
    amortizationType: AmortizationType.FRENCH,
  });

  it('should map persistence entity to domain entity', () => {
    const result = LoanTypeMapper.toDomain(mockEntity);

    expect(result).toBeInstanceOf(LoanType);
    expect(result.id).toBe(mockId);
    expect(result.name).toBe('Corriente');
    expect(result.defaultApprovedAmount).toBe(1000);
    expect(result.defaultInterestRate).toBe(0.05);
    expect(result.amortizationType).toBe(AmortizationType.FRENCH);
  });

  it('should map domain entity to persistence entity', () => {
    const result = LoanTypeMapper.toPersistence(mockDomain);

    expect(result.id).toBe(mockId);
    expect(result.name).toBe('Corriente');
    expect(result.defaultApprovedAmount).toBe(1000);
    expect(result.defaultInterestRate).toBe(0.05);
    expect(result.amortizationType).toBe(AmortizationTypeEntity.FRENCH);
  });
});
