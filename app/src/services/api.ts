const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function request<T>(
  method: string,
  endpoint: string,
  body?: unknown
): Promise<T> {
  const headers = new Headers();
  headers.append('Content-Type', 'application/json');

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(errorBody);
    throw new Error(
      `API request failed with status ${response.status}: ${errorBody}`
    );
  }

  // Si la respuesta no tiene cuerpo (ej. en un 204 No Content),
  // no intentamos parsear JSON.
  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string) => request<T>('GET', endpoint),
  post: <T>(endpoint: string, body: unknown) => request<T>('POST', endpoint, body),
  patch: <T>(endpoint: string, body: unknown) => request<T>('PATCH', endpoint, body),
  delete: <T>(endpoint: string) => request<T>('DELETE', endpoint),
};

// Métodos específicos para el ledger
export const ledgerApi = {
  // Obtener asientos contables con filtros y paginación
  async getLedgerEntries(params: {
    q?: string;
    memberId?: string;
    accountType?: string;
    meetingId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
    operationType?: string;
  }) {
    const searchParams = new URLSearchParams();
    
    if (params.q) searchParams.append('q', params.q);
    if (params.memberId) searchParams.append('memberId', params.memberId);
    if (params.accountType) searchParams.append('accountType', params.accountType);
    if (params.meetingId) searchParams.append('meetingId', params.meetingId);
    if (params.dateFrom) searchParams.append('dateFrom', params.dateFrom);
    if (params.dateTo) searchParams.append('dateTo', params.dateTo);
    if (params.operationType) searchParams.append('operationType', params.operationType);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    
    const response = await fetch(
      `${API_BASE_URL}/ledger-entries?${searchParams}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },

  // Obtener asientos contables de una operación específica
  async getLedgerEntriesByOperation(operationId: string) {
    const response = await fetch(
      `${API_BASE_URL}/ledger-entries/operation/${operationId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },

  // Obtener tipos de cuenta disponibles
  async getAccountTypes() {
    const response = await fetch(
      `${API_BASE_URL}/ledger-entries/account-types`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },

  // Obtener operaciones con filtros y paginación
  async getOperations(params: {
    meetingId?: string;
    memberId?: string;
    operationType?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    
    if (params.meetingId) searchParams.append('meetingId', params.meetingId);
    if (params.memberId) searchParams.append('memberId', params.memberId);
    if (params.operationType) searchParams.append('operationType', params.operationType);
    if (params.dateFrom) searchParams.append('dateFrom', params.dateFrom);
    if (params.dateTo) searchParams.append('dateTo', params.dateTo);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    
    const response = await fetch(
      `${API_BASE_URL}/operations?${searchParams}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },

  // Obtener reuniones con paginación
  async getMeetings(params: {
    page?: number;
    limit?: number;
  } = {}) {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    
    const response = await fetch(
      `${API_BASE_URL}/meetings?${searchParams}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },
}; 