# Manejo de Errores

## Estrategia por Capas

| Capa | Responsabilidad |
|---|---|
| **API** (interceptores) | Convierte errores HTTP en `ApiException` |
| **Store** (actions) | Captura `ApiException`, actualiza `error.value` |
| **Componente** (template) | Muestra errores al usuario |

## API Layer

### ApiException

```typescript
// src/api/types.ts
export class ApiException extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: Record<string, string[]>
  ) {
    super(message)
    this.name = 'ApiException'
  }
}
```

### Interceptor del Cliente Base

```typescript
// src/api/client.ts
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response) {
      throw new ApiException(
        error.response.data?.message || 'Error desconocido',
        error.response.status,
        error.response.data?.errors
      )
    } else if (error.request) {
      throw new ApiException('No se pudo conectar con el servidor', 0)
    } else {
      throw new ApiException(`Error: ${error.message}`, 0)
    }
  }
)
```

## Store Layer

### Patrón Estándar

```typescript
async function fetchData() {
  loading.value = true
  error.value = null
  try {
    data.value = await api.getData()
  } catch (e) {
    if (e instanceof ApiException) {
      error.value = e.message
    } else {
      error.value = 'Error desconocido'
    }
    console.error('Error fetching data:', e)
    throw e
  } finally {
    loading.value = false
  }
}
```

### Manejo por Código HTTP

| Status | Significado | Acción |
|---|---|---|
| `0` | Sin conexión | Mostrar "No hay conexión a internet" |
| `400` | Datos inválidos | Mostrar errores por campo si `e.errors` existe |
| `401` | No autenticado | Redirigir a login |
| `403` | Sin permisos | Mostrar "No tienes permisos" |
| `404` | No encontrado | Redirigir o mostrar "No existe" |
| `409` | Conflicto | Mostrar "El recurso ya existe" |
| `500` | Error servidor | Mostrar "Error del servidor, intenta más tarde" |

```typescript
async function createItem(data: CreateRequest) {
  try {
    return await api.createItem(data)
  } catch (e) {
    if (e instanceof ApiException) {
      switch (e.status) {
        case 400: error.value = 'Datos inválidos'; break
        case 409: error.value = 'El item ya existe'; break
        default: error.value = e.message
      }
    }
    throw e
  }
}
```

## Component Layer

### Mostrar Errores

```vue
<template>
  <ErrorMessage :error="store.error" />
</template>
```

### Errores de Formulario

```vue
<template>
  <div v-if="formError" class="alert alert-error">{{ formError }}</div>

  <div class="form-control">
    <input v-model="form.email" class="input input-bordered" :class="{ 'input-error': errors.email }" />
    <label v-if="errors.email" class="label"><span class="label-text-alt text-error">{{ errors.email }}</span></label>
  </div>
</template>
```

### Botón de Reintentar

```vue
<div v-if="error" class="alert alert-error">
  <span>{{ error }}</span>
  <button @click="error = null; fetchData()" class="btn btn-sm btn-ghost">Reintentar</button>
</div>
```

## Mensajes al Usuario

**Principios:** claros, accionables, no técnicos.

```typescript
// ✅
'No se pudo cargar la lista. Por favor intenta recargar la página.'
// ❌
'Error 500', 'Network request failed', 'Cannot read property of undefined'
```

## Logging

```typescript
// En desarrollo
if (import.meta.env.DEV) {
  console.error('[API Error]', { url: error.config?.url, status: error.response?.status, message: error.message })
}
```

## Reglas

- **Siempre** manejar errores en try/catch (nunca dejar promesas sin catch)
- Mensajes **específicos** por contexto (`'Error al cargar miembros'`, no `'Error'`)
- **Logging** con contexto útil para debugging
- **No exponer** detalles técnicos al usuario

## Referencias

- [Guía de API](./API_GUIDE.md)
- [Guía de Stores](./STORES_GUIDE.md)
