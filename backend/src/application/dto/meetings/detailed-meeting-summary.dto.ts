export interface DetailedMeetingSummaryDto {
  meeting: {
    id: string;
    date: Date;
    status: 'active' | 'closed';
    notes: string | null;
  };
  summary: {
    totalCollected: number;
    totalDisbursed: number;
    shareValue: number;
    participants: number;
  };
  collections: {
    memberContributions: { count: number; amount: number };
    loanPayments: { count: number; amount: number };
    interestCollected: number;
    feesCollected: number;
  };
  disbursements: {
    newLoans: { count: number; amount: number };
    stockLiquidations: { count: number; amount: number };
    dividendPayments: { count: number; amount: number };
  };
  metrics: {
    attendance: { current: number; expected?: number; percentage: number };
    revaluation: {
      previousValue: number;
      newValue: number;
      percentage: number;
    } | null;
    paymentsUpToDate: number;
    overduePayments: number;
  };
}
