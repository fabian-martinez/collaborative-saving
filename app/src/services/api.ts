import { useApiVersionStore } from '@/shared/stores/apiVersion'
import { getV2Endpoint, hasV2Version, ENDPOINT_MAPPINGS_V2 } from '@/shared/config/apiEndpoints'
import { normalizeToCamelCase } from '@/shared/utils'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Extrae parámetros de una URL y los mapea según un patrón
 * Ejemplo: pattern='dues/active-meeting/member/:memberId', url='dues/active-meeting/member/123'
 * Retorna: { memberId: '123' }
 */
function extractParams(pattern: string, url: string): Record<string, string> {
  const params: Record<string, string> = {}
  const patternParts = pattern.split('/')
  const urlParts = url.split('/')
  
  patternParts.forEach((part, index) => {
    if (part.startsWith(':')) {
      const paramName = part.slice(1)
      if (urlParts[index]) {
        params[paramName] = urlParts[index]
      }
    }
  })
  
  return params
}

/**
 * Obtiene el endpoint correcto según la versión de API activa
 * @param endpoint - Endpoint original
 * @param method - Método HTTP
 * @param additionalParams - Parámetros adicionales que pueden venir del body (ej: memberId para record-monthly-payment)
 */
function getApiEndpoint(endpoint: string, method: string, additionalParams?: Record<string, string>): string {
  const apiVersionStore = useApiVersionStore()
  
  // Si no está usando v2, devolver el endpoint original
  if (!apiVersionStore.isV2) {
    return endpoint
  }

  // Remover leading slash si existe para comparación
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint

  // Verificar si el endpoint tiene versión v2
  if (!hasV2Version(cleanEndpoint)) {
    return endpoint
  }

  // Extraer parámetros de la URL si hay un patrón que coincida
  let params: Record<string, string> | undefined = additionalParams ? { ...additionalParams } : undefined
  
  // Buscar en ENDPOINT_MAPPINGS_V2 si hay un patrón que coincida
  for (const pattern of Object.keys(ENDPOINT_MAPPINGS_V2)) {
    const patternRegex = new RegExp('^' + pattern.replace(/:[^/]+/g, '([^/]+)') + '$')
    if (patternRegex.test(cleanEndpoint)) {
      const extractedParams = extractParams(pattern, cleanEndpoint)
      params = params ? { ...params, ...extractedParams } : extractedParams
      break
    }
  }

  // Obtener el endpoint v2
  const v2Endpoint = getV2Endpoint(cleanEndpoint, method, params)
  
  // Asegurar que tenga el leading slash
  return v2Endpoint.startsWith('/') ? v2Endpoint : `/${v2Endpoint}`
}

async function request<T>(
  method: string,
  endpoint: string,
  body?: unknown
): Promise<T> {
  const headers = new Headers();
  headers.append('Content-Type', 'application/json');

  // Para endpoints que requieren extraer parámetros del body (como record-monthly-payment)
  // Necesitamos extraer el memberId del body y ponerlo en la URL en v2
  let bodyForRequest = body;
  let additionalParams: Record<string, string> | undefined = undefined;
  
  if (body && typeof body === 'object' && body !== null) {
    const bodyObj = body as Record<string, unknown>;
    const apiVersionStore = useApiVersionStore();
    
    // Si estamos usando v2 y el endpoint es record-monthly-payment
    // Necesitamos extraer memberId del body y ponerlo en la URL
    if (apiVersionStore.isV2 && endpoint.includes('record-monthly-payment') && 'memberId' in bodyObj) {
      const memberId = String(bodyObj.memberId);
      // Remover memberId del body ya que irá en la URL
      const { memberId: _, ...bodyWithoutMemberId } = bodyObj;
      bodyForRequest = bodyWithoutMemberId;
      // Pasar el memberId como parámetro adicional para que se incluya en la URL
      additionalParams = { memberId };
    }
  }

  // Obtener el endpoint correcto según la versión de API
  let finalEndpoint = getApiEndpoint(endpoint, method, additionalParams);
  
  // Reemplazar :id con el memberId si está disponible (para endpoints que lo requieren)
  if (additionalParams && additionalParams.memberId) {
    finalEndpoint = finalEndpoint.replace(':id', additionalParams.memberId);
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (bodyForRequest) {
    options.body = JSON.stringify(bodyForRequest);
  }

  const response = await fetch(`${API_BASE_URL}${finalEndpoint}`, options);

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

  const data = await response.json();
  
  // Normalizar la respuesta para convertir snake_case a camelCase
  // Esto permite que el frontend maneje ambos formatos del backend
  return normalizeToCamelCase(data) as T;
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
    
    const data = await response.json();
    return normalizeToCamelCase(data);
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
    
    const data = await response.json();
    return normalizeToCamelCase(data);
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
    
    const data = await response.json();
    return normalizeToCamelCase(data);
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
    
    const data = await response.json();
    return normalizeToCamelCase(data);
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
    
    const data = await response.json();
    return normalizeToCamelCase(data);
  },
}; 