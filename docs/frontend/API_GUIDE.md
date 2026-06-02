# Guía de API

## Estructura

El cliente base (`src/api/client.ts`) configura Axios con: base URL, interceptores de logging (dev), manejo centralizado de errores y timeout.

Cada módulo tiene su propio cliente en `src/api/[module].api.ts`:

```typescript
// src/api/items.api.ts
import apiClient from './client'
import type { Item, CreateItemRequest } from './types'

export const itemsApi = {
  async getItems(): Promise<Item[]> {
    const response = await apiClient.get<Item[]>('/v2/items')
    return response.data
  },
  async getItemById(id: string): Promise<Item> {
    const response = await apiClient.get<Item>(`/v2/items/${id}`)
    return response.data
  },
  async createItem(data: CreateItemRequest): Promise<Item> {
    const response = await apiClient.post<Item>('/v2/items', data)
    return response.data
  },
  async updateItem(id: string, data: Partial<CreateItemRequest>): Promise<Item> {
    const response = await apiClient.patch<Item>(`/v2/items/${id}`, data)
    return response.data
  },
  async deleteItem(id: string): Promise<void> {
    await apiClient.delete(`/v2/items/${id}`)
  }
}
```

## Crear un Nuevo API Client

### 1. Definir Tipos

```typescript
// src/api/types.ts
export interface ItemResponse {
  id: string
  name: string
  created_at: string
}

export interface CreateItemRequest {
  name: string
  description?: string
}
```

### 2. Crear el Cliente (como el ejemplo de arriba)

### 3. Agregar Mocks

```typescript
// src/api/mocks/index.ts
function delay(ms = 500): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const mockApi = {
  async getItems(): Promise<ItemResponse[]> {
    await delay()
    return [
      { id: '1', name: 'Item 1', created_at: '2024-01-01T00:00:00Z' },
      { id: '2', name: 'Item 2', created_at: '2024-01-02T00:00:00Z' }
    ]
  }
}
```

### 4. Integrar Mocks

```typescript
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

export const itemsApi = {
  async getItems(): Promise<ItemResponse[]> {
    if (USE_MOCKS) return mockApi.getItems()
    const response = await apiClient.get<ItemResponse[]>('/v2/items')
    return response.data
  }
}
```

## Patrones Comunes

### Query Parameters

```typescript
async getItems(filters?: { status?: string; page?: number }): Promise<Item[]> {
  const params = new URLSearchParams()
  if (filters?.status) params.append('status', filters.status)
  if (filters?.page) params.append('page', filters.page.toString())
  const url = `/v2/items${params.toString() ? `?${params}` : ''}`
  const response = await apiClient.get<Item[]>(url)
  return response.data
}
```

### Nested Resources

```typescript
async getItemDetails(itemId: string): Promise<Detail[]> {
  const response = await apiClient.get<Detail[]>(`/v2/items/${itemId}/details`)
  return response.data
}
```

### Paginación

```typescript
interface PaginatedResponse<T> {
  data: T[]
  page: number
  limit: number
  total: number
}
```

## snake_case

El frontend trabaja directamente con `snake_case` del backend. **No normalizar a camelCase.**

```typescript
// ✅
interface ItemResponse { id: string; first_name: string; created_at: string }

// ❌
interface ItemResponse { id: string; firstName: string; createdAt: string }
```

## Sistema de Mocks

```env
# .env.local
VITE_USE_MOCKS=true   # Usar mocks
VITE_USE_MOCKS=false  # Usar API real
```

Los mocks deben incluir `delay()` para simular latencia de red.

## Reglas

- Un cliente por módulo (`items.api.ts`, `orders.api.ts`)
- Tipos explícitos en todas las funciones (`Promise<Item>`, no `Promise<any>`)
- Nombres descriptivos: `getItemById()`, `createItemOrder()` — no `get()`, `post()`
- No poner lógica de negocio en API clients (cálculos → store o componente)
- Mocks con datos realistas y delay

> Ver [Manejo de Errores](./ERROR_HANDLING.md) para interceptores y manejo de errores en API.

## Referencias

- [Guía de Stores](./STORES_GUIDE.md)
- [Axios Documentation](https://axios-http.com/)
