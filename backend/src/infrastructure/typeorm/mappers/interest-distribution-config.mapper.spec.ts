import { InterestDistributionConfig } from '@domain/entities/interest-distribution-config.entity';
import { InterestDistributionConfig as InterestDistributionConfigEntity } from '../entities/interest-distribution-config.entity';
import { InterestDistributionConfigMapper } from './interest-distribution-config.mapper';

describe('InterestDistributionConfigMapper', () => {
  const mockId = 'config-1';
  const mockLoanTypeId = 'loan-type-1';
  const mockStockTypeId = 'stock-type-1';

  const mockEntity: InterestDistributionConfigEntity = {
    id: mockId,
    loanTypeId: mockLoanTypeId,
    stockTypeId: mockStockTypeId,
  } as InterestDistributionConfigEntity;

  const mockDomain = InterestDistributionConfig.create({
    id: mockId,
    loanTypeId: mockLoanTypeId,
    stockTypeId: mockStockTypeId,
  });

  it('should map persistence entity to domain entity', () => {
    const result = InterestDistributionConfigMapper.toDomain(mockEntity);

    expect(result).toBeInstanceOf(InterestDistributionConfig);
    expect(result.id).toBe(mockId);
    expect(result.loanTypeId).toBe(mockLoanTypeId);
    expect(result.stockTypeId).toBe(mockStockTypeId);
  });

  it('should map domain entity to persistence entity', () => {
    const result = InterestDistributionConfigMapper.toPersistence(mockDomain);

    expect(result.id).toBe(mockId);
    expect(result.loanTypeId).toBe(mockLoanTypeId);
    expect(result.stockTypeId).toBe(mockStockTypeId);
  });
});
