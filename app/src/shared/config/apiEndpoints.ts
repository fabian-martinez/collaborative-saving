// Endpoints base que solo cambian el prefijo
export const API_ENDPOINTS_V2: Record<string, {
  base: string;
  methods: string[];
}> = {
  members: {
    base: 'v2/members',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  },
  stocks: {
    base: 'v2/stocks',
    methods: ['GET', 'PATCH'],
  },
  meetings: {
    base: 'v2/meetings',
    methods: ['GET', 'POST', 'PATCH'],
  },
  'mandatory-contributions': {
    base: 'v2/mandatory-contributions',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  },
}

// Endpoints que cambiaron completamente (estructura diferente)
export const ENDPOINT_MAPPINGS_V2: Record<string, {
  v2: string;
  method: string;
  paramMapping?: Record<string, string>; // mapeo de nombres de parámetros
}> = {
  // V1: GET /dues/active-meeting/member/:memberId
  // V2: GET /v2/members/:id/dues
  'dues/active-meeting/member/:memberId': {
    v2: 'v2/members/:id/dues',
    method: 'GET',
    paramMapping: { memberId: 'id' },
  },
  // V1: GET /dues/calculate-insurance/:memberId
  // V2: GET /v2/members/:id/insurance
  'dues/calculate-insurance/:memberId': {
    v2: 'v2/members/:id/insurance',
    method: 'GET',
    paramMapping: { memberId: 'id' },
  },
  // V1: POST /meetings/active/record-monthly-payment (con memberId en body)
  // V2: POST /v2/members/:id/payments
  // Nota: En V1 el memberId viene en el body, en V2 viene en la URL como :id
  'meetings/active/record-monthly-payment': {
    v2: 'v2/members/:id/payments',
    method: 'POST',
    paramMapping: { memberId: 'id' },
  },
  // V1: GET /meetings/:id/monthly-payments
  // V2: GET /v2/meetings/:id/payments
  'meetings/:id/monthly-payments': {
    v2: 'v2/meetings/:id/payments',
    method: 'GET',
    paramMapping: { id: 'id' },
  },
  // V1: GET /meetings/:id/revaluation/preview
  // V2: GET /v2/meetings/:id/revaluation
  'meetings/:id/revaluation/preview': {
    v2: 'v2/meetings/:id/revaluation',
    method: 'GET',
    paramMapping: { id: 'id' },
  },
  // V1: POST /meetings/:id/revaluation
  // V2: PATCH /v2/meetings/:id/revaluation/confirm
  // Nota: El servicio manejará el cambio de método (POST -> PATCH) cuando esté en v2
  'meetings/:id/revaluation': {
    v2: 'v2/meetings/:id/revaluation/confirm',
    method: 'POST',
    paramMapping: { id: 'id' },
  },
}

/**
 * Encuentra el patrón que coincide con el endpoint dado
 */
function findMatchingPattern(endpoint: string): string | null {
  for (const pattern of Object.keys(ENDPOINT_MAPPINGS_V2)) {
    const patternRegex = new RegExp('^' + pattern.replace(/:[^/]+/g, '[^/]+') + '$')
    if (patternRegex.test(endpoint)) {
      return pattern
    }
  }
  return null
}

/**
 * Verifica si un endpoint tiene versión v2 disponible
 */
export function hasV2Version(endpoint: string): boolean {
  // Verificar si coincide con algún patrón en los mapeos
  if (findMatchingPattern(endpoint)) {
    return true
  }

  // Verificar si está directamente en los mapeos
  if (ENDPOINT_MAPPINGS_V2[endpoint]) {
    return true
  }

  // Verificar si el endpoint base tiene v2
  const endpointBase = endpoint.split('/')[0]
  return !!API_ENDPOINTS_V2[endpointBase]
}

/**
 * Obtiene el endpoint v2 para un endpoint dado
 * @param endpoint - Endpoint v1 (ej: '/members', '/dues/active-meeting/member/123')
 * @param method - Método HTTP
 * @param params - Parámetros de la URL (ej: { memberId: '123' })
 * @returns Endpoint v2 con parámetros reemplazados
 */
export function getV2Endpoint(
  endpoint: string,
  method: string,
  params?: Record<string, string>
): string {
  // Remover leading slash si existe
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint

  // Buscar patrón que coincida
  const matchingPattern = findMatchingPattern(cleanEndpoint)
  if (matchingPattern) {
    const mapping = ENDPOINT_MAPPINGS_V2[matchingPattern]
    if (mapping && mapping.method === method) {
      let v2Endpoint = mapping.v2
      // Reemplazar parámetros si hay mapeo y params
      if (mapping.paramMapping && params) {
        Object.entries(mapping.paramMapping).forEach(([v1Param, v2Param]) => {
          if (params[v1Param]) {
            v2Endpoint = v2Endpoint.replace(`:${v2Param}`, params[v1Param])
          }
        })
      }
      return v2Endpoint
    }
  }

  // Verificar si está directamente en los mapeos
  const directMapping = ENDPOINT_MAPPINGS_V2[cleanEndpoint]
  if (directMapping && directMapping.method === method) {
    let v2Endpoint = directMapping.v2
    // Reemplazar parámetros si hay mapeo
    if (directMapping.paramMapping && params) {
      Object.entries(directMapping.paramMapping).forEach(([v1Param, v2Param]) => {
        if (params[v1Param]) {
          v2Endpoint = v2Endpoint.replace(`:${v2Param}`, params[v1Param])
        }
      })
    }
    return v2Endpoint
  }

  // Si no hay mapeo especial, verificar si el endpoint base tiene v2
  const endpointParts = cleanEndpoint.split('/')
  const basePath = endpointParts[0]
  const v2Config = API_ENDPOINTS_V2[basePath]

  if (v2Config && v2Config.methods.includes(method)) {
    // Reemplazar el prefijo base con el prefijo v2
    return cleanEndpoint.replace(basePath, v2Config.base)
  }

  // Si no tiene v2, devolver el endpoint original
  return cleanEndpoint
}

