import { DeleteLoanTypeUseCase } from './delete-loan-type.use-case';
import { LoanTypeRepository } from '@domain/ports/repositories/loan-type-repository.port';

describe('DeleteLoanTypeUseCase', () => {
  let useCase: DeleteLoanTypeUseCase;
  let loanTypeRepository: jest.Mocked<LoanTypeRepository>;

  beforeEach(() => {
    loanTypeRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<LoanTypeRepository>;

    useCase = new DeleteLoanTypeUseCase(loanTypeRepository);
  });

  it('should delete a loan type by id', async () => {
    const id = 'loan-1';
    loanTypeRepository.delete.mockResolvedValue(undefined);

    await useCase.execute(id);

    expect(loanTypeRepository.delete).toHaveBeenCalledWith(id);
  });
});
