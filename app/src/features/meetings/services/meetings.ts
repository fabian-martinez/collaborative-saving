import { api } from '@/services/api';
import type {
  Meeting,
  MemberDue,
  SimplifiedRecordTransactions,
  MeetingDetail,
} from '../types';
import type { Operation } from '@/features/operations/types';
import type { StocksForPurchase } from '@/features/stocks/types';
import { operationsService } from '@/features/operations/services/operationsService';

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
    if (capitalPayment !== undefined) {
      return api.get(`/dues/calculate-insurance/${memberId}?capitalPayment=${capitalPayment}`);
    }
    return api.get(`/dues/calculate-insurance/${memberId}`);
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
   * Compra de acciones para un socio existente
   */
  buyStocks(meetingId: string, payload: StocksForPurchase): Promise<any> {
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
   * Obtiene el resumen de la reunión con los campos solicitados
   */
  getMeetingSummary(meetingId: string, fields?: string[]): Promise<any> {
    let url = `/meetings/${meetingId}/summary`;
    if (fields && fields.length > 0) {
      const params = fields.map(f => `fields=${encodeURIComponent(f)}`).join('&');
      url += `?${params}`;
    }
    return api.get(url);
  }

  async getMeetingDetail(meetingId: string): Promise<MeetingDetail> {
    // Obtener el resumen de la reunión (JSON plano)
    const summary = await api.get<any>(`/meetings/${meetingId}/summary`);
    // Obtener las operaciones asociadas a la reunión (JSON plano)
    const operations = await api.get<any>(`/operations?meetingId=${meetingId}`);

    // Mapear los datos al modelo MeetingDetail
    return {
      meeting: summary.meeting || {
        id: '',
        date: '',
        status: '',
        notes: '',
      },
      income: {
        contributions: summary.totalCash ?? 0,
        loanPayments: 0,
        interest: summary.totalInterest ?? 0,
        insurance: 0,
        assets: 0,
        purchases: 0,
      },
      withdrawals: {
        loansGranted: { ordinary: 0, emergency: 0 },
        dividendPayouts: summary.totalDividends ?? 0,
        shareWithdrawals: 0,
      },
      transactions: (operations.data ?? operations).map((op: any) => ({
        id: op.id,
        type: op.type,
        member: op.member?.name || '',
        memberId: op.member?.id || '',
        amount: (op.total_debit ?? 0) - (op.total_credit ?? 0),
        details: op.description,
      })),
    };
  }
}

export const meetingsService = new MeetingsService();