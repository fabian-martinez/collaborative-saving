import { LoanTransactionDetailRepository } from '@domain/ports/repositories/loan-transaction-detail-repository.port';
import { LoanRepository } from '@domain/ports/repositories/loan-repository.port';
import { LoanNotFoundException } from '@application/exceptions/loan-not-found.exception';
import { GetLoanTransactionsQueryDto } from '@application/dto/loans/get-loan-transactions-query.dto';
import { LoanTransactionResponseDto } from '@application/dto/loans/loan-transaction-response.dto';
import { PaginatedResponse } from '@application/dto/accounting/paginated-response.dto';

export class GetLoanTransactionsQueryHandler {
  constructor(
    private readonly loanRepository: LoanRepository,
    private readonly loanTransactionDetailRepository: LoanTransactionDetailRepository,
  ) {}

  async execute(
    query: GetLoanTransactionsQueryDto,
  ): Promise<PaginatedResponse<LoanTransactionResponseDto>> {
    const loan = await this.loanRepository.findById(query.loanId);
    if (!loan) {
      throw new LoanNotFoundException(query.loanId);
    }

    const pagination = {
      page: query.page || 1,
      limit: query.limit || 10,
    };

    const result =
      await this.loanTransactionDetailRepository.findByLoanWithPagination(
        query.loanId,
        pagination,
      );

    const data: LoanTransactionResponseDto[] = result.data.map((t) => ({
      id: t.id,
      loanId: t.loanId,
      transactionType: t.transactionType,
      amount: t.amount,
      transactionDate: t.transactionDate,
      notes: t.notes || null,
      operationId: t.operationId || null,
    }));

    const totalPages = Math.ceil(result.total / pagination.limit);

    return {
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: result.total,
        totalPages,
      },
    };
  }
}
