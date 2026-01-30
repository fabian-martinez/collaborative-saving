import { LoanType } from '@domain/entities/loan-type.entity';
import { LoanType as LoanTypeEntity, AmortizationType } from '../entities/loan-type.entity';

export class LoanTypeMapper {
  static toDomain(persistence: LoanTypeEntity): LoanType {
    return LoanType.create({
      id: persistence.id,
      name: persistence.name,
      defaultApprovedAmount: Number(persistence.defaultApprovedAmount),
      defaultInterestRate: Number(persistence.defaultInterestRate),
      defaultTerm: persistence.defaultTerm,
      amortizationType: persistence.amortizationType as unknown as AmortizationType,
    });
  }

  static toPersistence(domain: LoanType): Partial<LoanTypeEntity> {
    return {
      id: domain.id,
      name: domain.name,
      defaultApprovedAmount: domain.defaultApprovedAmount,
      defaultInterestRate: domain.defaultInterestRate,
      defaultTerm: domain.defaultTerm,
      amortizationType: domain.amortizationType as unknown as AmortizationType,
    };
  }
}
