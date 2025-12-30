# Guía de API

## Introducción

Esta guía explica cómo crear y usar API clients, manejar errores, y trabajar con el sistema de mocks.

## Estructura de API Clients

### Cliente Base

El cliente base (`src/api/client.ts`) configura Axios con:
- Base URL desde variables de entorno
- Interceptores para logging (desarrollo)
- Manejo centralizado de errores
- Timeout configurado

### Clientes por Módulo

Cada módulo tiene su propio cliente API en `src/api/[module].api.ts`:

```typescript
// src/api/members.api.ts
import apiClient from './client'
import type { Member, CreateMemberRequest } from './types'

export const membersApi = {
  async getMembers(): Promise<Member[]> {
    const response = await apiClient.get<Member[]>('/v2/members')
    return response.data
  },

  async getMemberById(id: string): Promise<Member> {
    const response = await apiClient.get<Member>(`/v2/members/${id}`)
    return response.data
  },

  async createMember(data: CreateMemberRequest): Promise<Member> {
    const response = await apiClient.post<Member>('/v2/members', data)
    return response.data
  }
}
```

## Crear un Nuevo API Client

### Paso 1: Definir Tipos

```typescript
// src/api/types.ts (o archivo específico)

export interface MyFeatureResponse {
  id: string
  name: string
  created_at: string
}

export interface CreateMyFeatureRequest {
  name: string
  description?: string
}

export interface UpdateMyFeatureRequest {
  name?: string
  description?: string
}
```

### Paso 2: Crear el Cliente

```typescript
// src/api/myFeature.api.ts
import apiClient from './client'
import type {
  MyFeatureResponse,
  CreateMyFeatureRequest,
  UpdateMyFeatureRequest
} from './types'

export const myFeatureApi = {
  // GET - Listar
  async getItems(): Promise<MyFeatureResponse[]> {
    const response = await apiClient.get<MyFeatureResponse[]>('/v2/my-feature')
    return response.data
  },

  // GET - Por ID
  async getItemById(id: string): Promise<MyFeatureResponse> {
    const response = await apiClient.get<MyFeatureResponse>(`/v2/my-feature/${id}`)
    return response.data
  },

  // POST - Crear
  async createItem(data: CreateMyFeatureRequest): Promise<MyFeatureResponse> {
    const response = await apiClient.post<MyFeatureResponse>('/v2/my-feature', data)
    return response.data
  },

  // PATCH - Actualizar
  async updateItem(
    id: string,
    data: UpdateMyFeatureRequest
  ): Promise<MyFeatureResponse> {
    const response = await apiClient.patch<MyFeatureResponse>(
      `/v2/my-feature/${id}`,
      data
    )
    return response.data
  },

  // DELETE - Eliminar
  async deleteItem(id: string): Promise<void> {
    await apiClient.delete(`/v2/my-feature/${id}`)
  }
}
```

### Paso 3: Agregar Mocks

```typescript
// src/api/mocks/index.ts
async getMyFeatureItems(): Promise<MyFeatureResponse[]> {
  await delay()
  return [
    { id: '1', name: 'Item 1', created_at: '2024-01-01T00:00:00Z' },
    { id: '2', name: 'Item 2', created_at: '2024-01-02T00:00:00Z' }
  ]
}

async getMyFeatureItemById(id: string): Promise<MyFeatureResponse> {
  await delay()
  const item = mockItems.find(i => i.id === id)
  if (!item) throw new Error('Item not found')
  return { ...item }
}
```

### Paso 4: Integrar Mocks en el Cliente

```typescript
// src/api/myFeature.api.ts
import { mockApi } from './mocks'

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

export const myFeatureApi = {
  async getItems(): Promise<MyFeatureResponse[]> {
    if (USE_MOCKS) {
      return mockApi.getMyFeatureItems()
    }
    const response = await apiClient.get<MyFeatureResponse[]>('/v2/my-feature')
    return response.data
  }
  // ...
}
```

## Patrones Comunes

### Query Parameters

```typescript
async getItems(filters?: {
  status?: string
  page?: number
  limit?: number
}): Promise<MyFeatureResponse[]> {
  const params = new URLSearchParams()
  if (filters?.status) params.append('status', filters.status)
  if (filters?.page) params.append('page', filters.page.toString())
  if (filters?.limit) params.append('limit', filters.limit.toString())
  
  const queryString = params.toString()
  const url = `/v2/my-feature${queryString ? `?${queryString}` : ''}`
  
  const response = await apiClient.get<MyFeatureResponse[]>(url)
  return response.data
}
```

### Paginated Responses

```typescript
interface PaginatedResponse<T> {
  data: T[]
  page: number
  limit: number
  total: number
}

async getPaginatedItems(page: number = 1): Promise<PaginatedResponse<MyFeatureResponse>> {
  const response = await apiClient.get<PaginatedResponse<MyFeatureResponse>>(
    `/v2/my-feature?page=${page}&limit=20`
  )
  return response.data
}
```

### Nested Resources

```typescript
// Members con préstamos
async getMemberLoans(memberId: string): Promise<Loan[]> {
  const response = await apiClient.get<Loan[]>(`/v2/members/${memberId}/loans`)
  return response.data
}

// Crear préstamo para un miembro
async createMemberLoan(
  memberId: string,
  data: CreateLoanRequest
): Promise<Loan> {
  const response = await apiClient.post<Loan>(
    `/v2/members/${memberId}/loans`,
    data
  )
  return response.data
}
```

## Manejo de Errores

### Cliente Base

El cliente base maneja errores automáticamente:

```typescript
// src/api/client.ts
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response) {
      // Error del servidor
      const message = error.response.data?.message || 'Error desconocido'
      throw new ApiException(message, error.response.status, error.response.data?.errors)
    } else if (error.request) {
      // Sin respuesta del servidor
      throw new ApiException('No se pudo conectar con el servidor', 0)
    } else {
      // Error al configurar la petición
      throw new ApiException(`Error: ${error.message}`, 0)
    }
  }
)
```

### Manejo en Stores

```typescript
async function fetchItems() {
  loading.value = true
  error.value = null
  try {
    items.value = await myFeatureApi.getItems()
  } catch (e) {
    if (e instanceof ApiException) {
      error.value = e.message
      // Manejar errores específicos
      if (e.status === 404) {
        // Item no encontrado
      } else if (e.status === 403) {
        // Sin permisos
      }
    } else {
      error.value = 'Error desconocido'
    }
    console.error('Error fetching items:', e)
  } finally {
    loading.value = false
  }
}
```

## Sistema de Mocks

### Activar/Desactivar Mocks

```env
# .env.local
VITE_USE_MOCKS=true  # Usar mocks
VITE_USE_MOCKS=false # Usar API real
```

### Estructura de Mocks

```typescript
// src/api/mocks/index.ts

// Datos mock
const mockItems: MyFeatureResponse[] = [
  { id: '1', name: 'Item 1', created_at: '2024-01-01T00:00:00Z' },
  { id: '2', name: 'Item 2', created_at: '2024-01-02T00:00:00Z' }
]

// Helper para delay
function delay(ms: number = 500): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Implementaciones mock
export const mockApi = {
  async getMyFeatureItems(): Promise<MyFeatureResponse[]> {
    await delay() // Simular latencia de red
    return [...mockItems]
  },

  async getMyFeatureItemById(id: string): Promise<MyFeatureResponse> {
    await delay()
    const item = mockItems.find(i => i.id === id)
    if (!item) throw new Error('Item not found')
    return { ...item }
  },

  async createMyFeatureItem(data: CreateMyFeatureRequest): Promise<MyFeatureResponse> {
    await delay()
    const newItem: MyFeatureResponse = {
      id: String(mockItems.length + 1),
      ...data,
      created_at: new Date().toISOString()
    }
    mockItems.push(newItem)
    return newItem
  }
}
```

### Mocks con Filtros

```typescript
async getMyFeatureItems(filters?: { status?: string }): Promise<MyFeatureResponse[]> {
  await delay()
  let filtered = [...mockItems]
  
  if (filters?.status) {
    filtered = filtered.filter(item => item.status === filters.status)
  }
  
  return filtered
}
```

## snake_case

### Trabajar con snake_case

El frontend trabaja directamente con `snake_case` del backend:

```typescript
// ✅ Correcto - Usar snake_case
interface MemberResponse {
  id: string
  first_name: string
  last_name: string
  created_at: string
}

// ❌ Incorrecto - No normalizar a camelCase
interface MemberResponse {
  id: string
  firstName: string  // No hacer esto
  lastName: string
  createdAt: string
}
```

### En Componentes

```vue
<template>
  <!-- ✅ Usar snake_case directamente -->
  <div>{{ member.first_name }} {{ member.last_name }}</div>
  <div>{{ formatDate(member.created_at) }}</div>
</template>
```

## Tipos TypeScript

### Tipos de Request

```typescript
export interface CreateMemberRequest {
  name: string
  email: string
  identification_number?: string
}

export interface UpdateMemberRequest {
  name?: string
  email?: string
  identification_number?: string
}
```

### Tipos de Response

```typescript
export interface MemberResponse {
  id: string
  name: string
  email: string
  status: string
  created_at: string
  updated_at?: string
}
```

### Tipos Compartidos

Para tipos usados en múltiples módulos, usar `src/api/types.ts`:

```typescript
// src/api/types.ts
export interface PaginatedResponse<T> {
  data: T[]
  page: number
  limit: number
  total: number
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}
```

## Best Practices

### 1. Un Cliente por Módulo

```typescript
// ✅ Bueno
// members.api.ts
// loans.api.ts
// meetings.api.ts

// ❌ Evitar
// api.ts - Todo en un archivo
```

### 2. Tipos Explícitos

```typescript
// ✅ Bueno
async getMember(id: string): Promise<Member> {
  const response = await apiClient.get<Member>(`/v2/members/${id}`)
  return response.data
}

// ❌ Evitar
async getMember(id: string) {
  const response = await apiClient.get(`/v2/members/${id}`)
  return response.data
}
```

### 3. Funciones Descriptivas

```typescript
// ✅ Bueno
async getMemberById(id: string)
async getMemberLoans(memberId: string)
async createMemberLoan(memberId: string, data: CreateLoanRequest)

// ❌ Evitar
async get(id: string)
async getLoans(id: string)
async post(data: any)
```

### 4. Manejo de Errores Consistente

```typescript
// ✅ Bueno - Siempre manejar errores
try {
  const data = await api.getData()
  return data
} catch (e) {
  console.error('Error:', e)
  throw e // Re-throw para que el store lo maneje
}
```

### 5. Mocks Realistas

```typescript
// ✅ Bueno - Datos realistas
const mockMembers: Member[] = [
  {
    id: '1',
    name: 'Juan Pérez',
    email: 'juan@example.com',
    status: 'active',
    created_at: '2024-01-15T10:30:00Z'
  }
]

// ❌ Evitar - Datos genéricos
const mockMembers = [{ id: '1', name: 'Test' }]
```

## Anti-Patrones

### ❌ Evitar: Normalización snake_case

```typescript
// ❌ Malo - No normalizar
function normalizeMember(member: any) {
  return {
    id: member.id,
    firstName: member.first_name, // No hacer esto
    lastName: member.last_name
  }
}

// ✅ Bueno - Usar directamente
const member: MemberResponse = response.data
member.first_name // Usar snake_case directamente
```

### ❌ Evitar: Lógica de Negocio en API Client

```typescript
// ❌ Malo
async getMembers() {
  const response = await apiClient.get('/v2/members')
  // No hacer cálculos aquí
  return response.data.map(m => ({
    ...m,
    fullName: `${m.first_name} ${m.last_name}`
  }))
}

// ✅ Bueno - Lógica en store o componente
async getMembers() {
  const response = await apiClient.get('/v2/members')
  return response.data
}
```

### ❌ Evitar: Mocks Sin Delay

```typescript
// ❌ Malo - Muy rápido, no simula red
async getItems() {
  return mockItems
}

// ✅ Bueno - Simula latencia
async getItems() {
  await delay(500)
  return mockItems
}
```

## Referencias

- [Guía de Stores](./STORES_GUIDE.md)
- [Guía de Features](./FEATURES_GUIDE.md)
- [Axios Documentation](https://axios-http.com/)

