import { api } from '@/services/api';

export interface Dividend {
  id: string;
  member_id: string;
  meeting_id: string;
  type: string;
  amount: number;
  status: string;
  notes?: string;
  stock_id?: string;
  created_at: string;
}

export interface GetDividendsParams {
  memberId?: string;
  meetingId?: string;
  status?: string;
  [key: string]: string | undefined;
}

function buildQuery(params: GetDividendsParams): string {
  const esc = encodeURIComponent;
  return (
    '?' +
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => esc(k) + '=' + esc(v!))
      .join('&')
  );
}

const dividendsService = {
  async getPendingDividends(params: GetDividendsParams = {}): Promise<Dividend[]> {
    const query = buildQuery(params);
    const res = await api.get<Dividend[]>(`/dividends/pending${query}`);
    return res;
  },
  async getDividendHistory(params: GetDividendsParams = {}): Promise<Dividend[]> {
    const query = buildQuery(params);
    const res = await api.get<Dividend[]>(`/dividends/history${query}`);
    return res;
  },
};

export default dividendsService; 