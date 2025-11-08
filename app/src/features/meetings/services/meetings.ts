import { api } from '@/services/api';
import { useApiVersionStore } from '@/shared/stores/apiVersion';
import type {
  Meeting,
  MemberDue,
  SimplifiedRecordTransactions,
  MeetingDetail,
  ContributionsResponse,
  DisbursementsResponse,
  LedgerEntriesResponse,
  StockChangesSectionData,
  StockOperationsResponse,
  MemberPaymentResponse,
} from '../types';
import type { Operation } from '@/features/operations/types';
import type { StocksForPurchase } from '@/features/stocks/types';
import { operationsService } from '@/features/operations/services/operationsService';
import { assetRevaluationService } from '@/features/meetings/services/assetRevaluationService';

class MeetingsService {
  // Methods related to meetings list and creation
  findAll(): Promise<Meeting[]> {
    return api.get('/meetings');
  }

  findActive(): Promise<Meeting | null> {
    return api.get('/meetings/active');
  }

  create(date: { date: string }): Promise<Meeting> {
    return api.post('/meetings', date);
  }

  close(id: string): Promise<Meeting> {
    return api.patch(`/meetings/${id}/close`, {});
  }

  // Methods related to active meeting collections
  getMemberDues(memberId: string): Promise<MemberDue[]> {
    return api.get(`/dues/active-meeting/member/${memberId}`);
  }

  calculateInsurance(memberId: string, capitalPayment?: number): Promise<{ insuranceAmount: number }> {
    const apiVersionStore = useApiVersionStore();
    const query = capitalPayment !== undefined ? `?capitalPayment=${capitalPayment}` : '';

    if (apiVersionStore.isV2) {
      return api.get(`/v2/members/${memberId}/insurance${query}`);
    }

    return api.get(`/dues/calculate-insurance/${memberId}${query}`);
  }

  recordMonthlyPayment(
    payload: SimplifiedRecordTransactions,
  ): Promise<void> {
    return api.post('/meetings/active/record-monthly-payment', payload);
  }

  getMonthlyPayments(meetingId: string): Promise<Operation[]> {
    return api.get(`/meetings/${meetingId}/monthly-payments`);
  }

  /**
   * Obtiene los pagos mensuales de un miembro para una reunión específica (V2)
   * Solo se debe usar cuando la API está en modo V2
   * Retorna la respuesta normalizada del endpoint (camelCase)
   */
  getMemberPayments(memberId: string, meetingId?: string): Promise<MemberPaymentResponse[]> {
    // El enum PaymentFilterType usa valores en minúsculas con guiones bajos
    const queryParams = meetingId ? `?meetingId=${meetingId}&type=monthly_payment` : '?type=monthly_payment';
    return api.get(`/v2/members/${memberId}/payments${queryParams}`);
  }

  /**
   * Compra de acciones para un socio existente
   */
  buyStocks(meetingId: string, payload: StocksForPurchase): Promise<unknown> {
    return api.post(`/meetings/${meetingId}/buy/stocks`, payload);
  }

  /**
   * Obtiene todas las operaciones de compra de acciones de una reunión
   */
  async getStockPurchaseOperations(meetingId: string) {
    return operationsService.getOperations({
      meetingId,
      operationType: 'STOCK_PURCHASE',
    });
  }

  /**
   * Obtiene la reunión activa con su summary
   * Útil para actualizar valores cuando se cambia de step
   */
  async getActiveMeetingWithSummary(): Promise<{
    totalCollected?: number;
    totalInterest?: number;
    totalCash?: number;
    finalCashBalance?: number;
    totalDisbursed?: number;
    participantsCount?: number;
    duration?: string;
  }> {
    const apiVersionStore = useApiVersionStore();
    
    if (apiVersionStore.isV2) {
      // V2: usar endpoint que retorna reunión activa con summary incluido
      const response = await api.get<{
        id: string;
        date: Date;
        status: string;
        notes: string | null;
        createdAt: Date;
        summary?: {
          totalCash?: number;
          totalInterest?: number;
          totalLoans?: number;
          totalCollected?: number;
          totalDividends?: number;
          totalStockInvestment?: number;
          finalCashBalance?: number;
          totalDisbursed?: number;
          participantsCount?: number;
          duration?: string;
        };
      }>('/v2/meetings/active');
      
      return {
        totalCollected: response.summary?.totalCollected,
        totalInterest: response.summary?.totalInterest,
        totalCash: response.summary?.totalCash,
        finalCashBalance: response.summary?.finalCashBalance,
        totalDisbursed: response.summary?.totalDisbursed,
        participantsCount: response.summary?.participantsCount,
        duration: response.summary?.duration,
      };
    }
    
    // V1: obtener reunión activa y luego su summary
    const activeMeeting = await this.findActive();
    if (!activeMeeting) {
      return {};
    }
    
    return this.getMeetingSummary(activeMeeting.id, ['totalCollected', 'totalCash', 'totalInterest']);
  }

  /**
   * Obtiene el resumen de la reunión con los campos solicitados
   */
  async getMeetingSummary(meetingId: string, fields?: string[]): Promise<{
    totalCollected?: number;
    totalInterest?: number;
    totalCash?: number;
    finalCashBalance?: number;
    totalDisbursed?: number;
    participantsCount?: number;
    duration?: string;
  }> {
    const apiVersionStore = useApiVersionStore();
    
    // Si está en v2, usar el endpoint v2 que retorna el meeting con summary incluido
    if (apiVersionStore.isV2) {
      // Verificar si es la reunión activa para usar el endpoint específico
      let url: string;
      try {
        const activeMeeting = await this.findActive();
        if (activeMeeting && activeMeeting.id === meetingId) {
          // Es la reunión activa, usar endpoint específico
          url = '/v2/meetings/active';
        } else {
          // No es la reunión activa, usar endpoint con ID
          url = `/v2/meetings/${meetingId}?includeSummary=true`;
        }
      } catch {
        // Si falla obtener la reunión activa, usar el endpoint con ID
        url = `/v2/meetings/${meetingId}?includeSummary=true`;
      }
      
      const response = await api.get<{
        id: string;
        date: Date;
        status: string;
        notes: string | null;
        createdAt: Date;
        summary?: {
          totalCash?: number;
          totalInterest?: number;
          totalLoans?: number;
          totalCollected?: number;
          totalDividends?: number;
          totalStockInvestment?: number;
          finalCashBalance?: number;
          totalDisbursed?: number;
          participantsCount?: number;
          duration?: string;
        };
      }>(url);
      
      // Extraer solo el summary de la respuesta v2
      return {
        totalCollected: response.summary?.totalCollected,
        totalInterest: response.summary?.totalInterest,
        totalCash: response.summary?.totalCash,
        finalCashBalance: response.summary?.finalCashBalance,
        totalDisbursed: response.summary?.totalDisbursed,
        participantsCount: response.summary?.participantsCount,
        duration: response.summary?.duration,
      };
    }
    
    // V1: comportamiento original
    let url = `/meetings/${meetingId}/summary`;
    if (fields && fields.length > 0) {
      const params = fields.map(f => `fields=${encodeURIComponent(f)}`).join('&');
      url += `?${params}`;
    }
    return api.get(url);
  }

  async getMeetingDetail(meetingId: string): Promise<MeetingDetail> {
    const apiVersionStore = useApiVersionStore();
    
    let meeting: MeetingDetail['meeting'];
    let summary: MeetingDetail['summary'];
    
    if (apiVersionStore.isV2) {
      // V2: Obtener meeting con summary incluido
      let url: string;
      try {
        const activeMeeting = await this.findActive();
        if (activeMeeting && activeMeeting.id === meetingId) {
          // Es la reunión activa, usar endpoint específico
          url = '/v2/meetings/active';
        } else {
          // No es la reunión activa, usar endpoint con ID
          url = `/v2/meetings/${meetingId}?includeSummary=true`;
        }
      } catch {
        // Si falla obtener la reunión activa, usar el endpoint con ID
        url = `/v2/meetings/${meetingId}?includeSummary=true`;
      }
      
      const response = await api.get<{
        id: string;
        date: Date | string;
        status: string;
        notes: string | null;
        createdAt: Date | string;
        summary?: {
          totalCash?: number;
          totalInterest?: number;
          totalLoans?: number;
          totalCollected?: number;
          totalDividends?: number;
          totalStockInvestment?: number;
          finalCashBalance?: number;
          totalDisbursed?: number;
          participantsCount?: number;
          duration?: string;
        };
      }>(url);
      
      // Extraer meeting y summary de la respuesta v2
      meeting = {
        id: response.id,
        date: typeof response.date === 'string' ? response.date : response.date.toISOString(),
        status: (response.status as 'active' | 'closed') ?? 'closed',
        notes: response.notes ?? undefined,
      };
      
      summary = {
        totalCollected: Number(response.summary?.totalCollected ?? 0),
        totalInterest: Number(response.summary?.totalInterest ?? 0),
        totalDisbursed: Number(response.summary?.totalDisbursed ?? 0),
        finalCashBalance: Number(response.summary?.finalCashBalance ?? 0),
        duration: String(response.summary?.duration ?? ''),
        participantsCount: Number(response.summary?.participantsCount ?? 0),
      } satisfies MeetingDetail['summary'];
    } else {
      // V1: comportamiento original
      const rawSummary = await this.getMeetingSummary(meetingId, [
        'meeting.id',
        'meeting.date',
        'meeting.status',
        'meeting.notes',
        'totalCollected',
        'totalInterest',
        'finalCashBalance',
        'totalDisbursed',
        'participantsCount',
        'duration',
      ]) as {
        meeting?: { id?: string; date?: string; status?: string; notes?: string };
        totalCollected?: number;
        totalInterest?: number;
        totalDisbursed?: number;
        finalCashBalance?: number;
        duration?: string;
        participantsCount?: number;
      };

      meeting = {
        id: rawSummary?.meeting?.id ?? meetingId,
        date: rawSummary?.meeting?.date ?? new Date().toISOString(),
        status: (rawSummary?.meeting?.status as 'active' | 'closed') ?? 'closed',
        notes: rawSummary?.meeting?.notes ?? undefined,
      };

      summary = {
        totalCollected: Number(rawSummary?.totalCollected ?? 0),
        totalInterest: Number(rawSummary?.totalInterest ?? 0),
        totalDisbursed: Number(rawSummary?.totalDisbursed ?? 0),
        finalCashBalance: Number(rawSummary?.finalCashBalance ?? 0),
        duration: String(rawSummary?.duration ?? ''),
        participantsCount: Number(rawSummary?.participantsCount ?? 0),
      } satisfies MeetingDetail['summary'];
    }

    // 2) Mantener mocks en las demás secciones por ahora
    const [contributions, stockChanges, stockOperations, disbursements, ledgerEntries] = await Promise.all([
      this.getMeetingContributionsMock(),
      this.getMeetingStockChanges(meetingId),
      this.getMeetingStockOperationsMock(),
      this.getMeetingDisbursementsMock(),
      this.getMeetingLedgerEntriesMock(),
    ]);

    return { meeting, summary, contributions, stockChanges, stockOperations, disbursements, ledgerEntries };
  }

  // ---- Mock helpers for closed meeting detail ----
  private async getMeetingStockChanges(meetingId: string): Promise<StockChangesSectionData> {
    const preview = await assetRevaluationService.getPreview(meetingId);
    const revaluationHistory = (preview.details || []).map((d: { previous_value?: number; new_value?: number; type?: string; total_shares?: number; dividends_generated?: number }) => {
      const previousValue = Number(d.previous_value || 0);
      const newValue = Number(d.new_value || 0);
      const change = newValue - previousValue;
      const changePercentage = previousValue > 0 ? Number(((change / previousValue) * 100).toFixed(2)) : 0;
      return {
        stockType: String(d.type || ''),
        previousValue,
        newValue,
        change,
        changePercentage,
        totalShares: typeof d.total_shares === 'number' ? d.total_shares : undefined,
        previousTotalValue: typeof d.total_shares === 'number' ? previousValue * d.total_shares : undefined,
        newTotalValue: typeof d.total_shares === 'number' ? newValue * d.total_shares : undefined,
        totalChange: typeof d.total_shares === 'number' ? (newValue - previousValue) * d.total_shares : undefined,
        totalChangePercentage: typeof d.total_shares === 'number' && previousValue > 0 ? Number(((((newValue - previousValue) * d.total_shares) / (previousValue * d.total_shares)) * 100).toFixed(2)) : undefined,
      };
    });
    const dividendsGenerated = (preview.details || [])
      .filter((d: { dividends_generated?: number }) => typeof d.dividends_generated === 'number' && d.dividends_generated > 0)
      .map((d: { type?: string; dividends_generated?: number }) => ({
        stockType: String(d.type || ''),
        amount: Number(d.dividends_generated || 0),
        beneficiaries: 0,
      }));
    return { revaluationHistory, dividendsGenerated };
  }

  private async getMeetingSummaryMock(): Promise<MeetingDetail['summary']> {
    return {
      totalCollected: 3_500_000,
      totalInterest: 420_000,
      totalDisbursed: 1_800_000,
      finalCashBalance: 2_120_000,
      duration: '2h 15m',
      participantsCount: 18,
    };
  }

  private async getMeetingContributionsMock(): Promise<ContributionsResponse> {
    const data = [
      { memberId: 'm1', memberName: 'Ana Gómez', mandatoryContribution: 150_000, fees: 10_000, insurance: 5_000, loanPayments: 120_000, total: 285_000 },
      { memberId: 'm2', memberName: 'Luis Pérez', mandatoryContribution: 150_000, fees: 0, insurance: 5_000, loanPayments: 80_000, total: 235_000 },
      { memberId: 'm3', memberName: 'María Ruiz', mandatoryContribution: 150_000, fees: 5_000, insurance: 5_000, loanPayments: 0, total: 160_000 },
    ];
    const summary = data.reduce(
      (acc, item) => {
        acc.totalContributions += item.mandatoryContribution;
        acc.totalFees += item.fees;
        acc.totalInsurance += item.insurance;
        acc.totalLoanPayments += item.loanPayments;
        acc.grandTotal += item.total;
        return acc;
      },
      { totalContributions: 0, totalFees: 0, totalInsurance: 0, totalLoanPayments: 0, grandTotal: 0 },
    );
    return { data, summary };
  }

  private async getMeetingStockChangesMock(): Promise<StockChangesSectionData> {
    return {
      revaluationHistory: [
        { stockType: 'Type A', previousValue: 10_000, newValue: 10_700, change: 700, changePercentage: 7 },
        { stockType: 'Type B', previousValue: 20_000, newValue: 20_900, change: 900, changePercentage: 4.5 },
      ],
      dividendsGenerated: [
        { stockType: 'Type A', amount: 350_000, beneficiaries: 15 },
        { stockType: 'Type B', amount: 200_000, beneficiaries: 10 },
      ],
    };
  }

  private async getMeetingStockOperationsMock(): Promise<StockOperationsResponse> {
    const data: StockOperationsResponse['data'] = [
      { id: 'op1', type: 'STOCK_PURCHASE', memberId: 'm2', memberName: 'Luis Pérez', stockType: 'Type A', quantity: 5, amount: 500_000, paymentMethod: 'cash', date: new Date().toISOString() },
      { id: 'op2', type: 'STOCK_WITHDRAWAL', memberId: 'm4', memberName: 'Carlos Díaz', stockType: 'Type B', quantity: 3, amount: 300_000, paymentMethod: 'cash', date: new Date().toISOString() },
      { id: 'op3', type: 'STOCK_MODIFICATION', memberId: 'm1', memberName: 'Ana Gómez', stockType: 'Type A', quantity: 2, amount: 0, paymentMethod: 'mixed', date: new Date().toISOString() },
    ];
    const summary = data.reduce(
      (acc, item) => {
        if (item.type === 'STOCK_PURCHASE') acc.totalPurchases += 1;
        if (item.type === 'STOCK_WITHDRAWAL') acc.totalWithdrawals += 1;
        if (item.type === 'STOCK_MODIFICATION') acc.totalModifications += 1;
        return acc;
      },
      { totalPurchases: 0, totalWithdrawals: 0, totalModifications: 0 },
    );
    return { data, summary };
  }

  private async getMeetingDisbursementsMock(): Promise<DisbursementsResponse> {
    const data: DisbursementsResponse['data'] = [
      { id: 'd1', type: 'LOAN', memberId: 'm5', memberName: 'Pedro López', amount: 1_200_000, description: 'Préstamo ordinario', status: 'completed', date: new Date().toISOString() },
      { id: 'd2', type: 'DIVIDEND', memberId: 'm1', memberName: 'Ana Gómez', amount: 200_000, description: 'Distribución dividendos', status: 'completed', date: new Date().toISOString() },
      { id: 'd3', type: 'WITHDRAWAL', memberId: 'm3', memberName: 'María Ruiz', amount: 100_000, description: 'Retiro de acciones', status: 'partial', date: new Date().toISOString() },
    ];
    const summary = data.reduce(
      (acc, item) => {
        if (item.type === 'LOAN') acc.totalLoans += item.amount;
        else if (item.type === 'DIVIDEND') acc.totalDividends += item.amount;
        else if (item.type === 'WITHDRAWAL') acc.totalWithdrawals += item.amount;
        else acc.totalOther += item.amount;
        acc.grandTotal += item.amount;
        return acc;
      },
      { totalLoans: 0, totalDividends: 0, totalWithdrawals: 0, totalOther: 0, grandTotal: 0 },
    );
    return { data, summary };
  }

  private async getMeetingLedgerEntriesMock(): Promise<LedgerEntriesResponse> {
    const data: LedgerEntriesResponse['data'] = [
      { id: 'le1', accountType: 'CASH', amount: 150_000, description: 'Aporte obligatorio Ana', memberId: 'm1', date: new Date().toISOString(), debit: 150_000, credit: 0 },
      { id: 'le2', accountType: 'INTEREST_INCOME', amount: 80_000, description: 'Intereses de préstamos', date: new Date().toISOString(), debit: 80_000, credit: 0 },
      { id: 'le3', accountType: 'LOAN_PORTFOLIO', amount: 1_200_000, description: 'Desembolso de préstamo Pedro', memberId: 'm5', date: new Date().toISOString(), debit: 0, credit: 1_200_000 },
    ];
    const totals = data.reduce(
      (acc, item) => {
        acc.totalDebits += item.debit ?? 0;
        acc.totalCredits += item.credit ?? 0;
        return acc;
      },
      { totalDebits: 0, totalCredits: 0 },
    );
    return { data, summary: { ...totals, balance: totals.totalDebits - totals.totalCredits } };
  }
}

export const meetingsService = new MeetingsService();