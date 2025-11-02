export class RecordMonthlyPaymentsResponseDto {
  operationId: string;
  meetingId: string;
  memberId: string;
  totalAmount: number;
  paymentsProcessed: number;
  loanPaymentsSummary: Array<{
    loanId: string;
    interestPaid: number;
    principalPaid: number;
    newBalance: number;
  }>;
}
