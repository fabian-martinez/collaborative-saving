# Manejo de Errores

## Introducción

Esta guía explica la estrategia de manejo de errores en el frontend, desde errores de API hasta errores de UI.

## Estrategia General

### Niveles de Manejo de Errores

1. **API Level**: Interceptores de Axios
2. **Store Level**: Manejo en actions
3. **Component Level**: Mostrar errores al usuario
4. **Global Level**: Error boundaries (si se implementan)

## Manejo en API Client

### Cliente Base

El cliente base (`src/api/client.ts`) maneja errores automáticamente:

```typescript
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response) {
      // Error del servidor (4xx, 5xx)
      throw new ApiException(
        error.response.data?.message || 'Error desconocido',
        error.response.status,
        error.response.data?.errors
      )
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

### Tipos de Errores

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

## Manejo en Stores

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
      // Manejar errores específicos
      if (e.status === 404) {
        // Recurso no encontrado
      } else if (e.status === 403) {
        // Sin permisos
      }
    } else {
      error.value = 'Error desconocido'
    }
    console.error('Error fetching data:', e)
    throw e // Re-throw para que el componente pueda manejar
  } finally {
    loading.value = false
  }
}
```

### Errores Específicos por Código

```typescript
async function createItem(data: CreateRequest) {
  loading.value = true
  error.value = null
  try {
    const newItem = await api.createItem(data)
    items.value.push(newItem)
    return newItem
  } catch (e) {
    if (e instanceof ApiException) {
      switch (e.status) {
        case 400:
          error.value = 'Datos inválidos'
          break
        case 409:
          error.value = 'El item ya existe'
          break
        case 500:
          error.value = 'Error del servidor. Por favor intenta más tarde'
          break
        default:
          error.value = e.message
      }
    } else {
      error.value = 'Error al crear item'
    }
    throw e
  } finally {
    loading.value = false
  }
}
```

## Manejo en Componentes

### Mostrar Errores

```vue
<template>
  <div>
    <ErrorMessage :error="store.error" />
    <!-- Resto del contenido -->
  </div>
</template>

<script setup lang="ts">
import ErrorMessage from '@/shared/components/ErrorMessage.vue'
import { useFeatureStore } from '../stores/feature'

const store = useFeatureStore()
</script>
```

### Manejar Errores de Formularios

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <div v-if="formError" class="alert alert-error">
      {{ formError }}
    </div>
    <!-- Campos del formulario -->
  </form>
</template>

<script setup lang="ts">
const formError = ref<string | null>(null)

async function handleSubmit() {
  formError.value = null
  try {
    await store.createItem(formData.value)
    // Éxito
  } catch (e) {
    if (e instanceof ApiException) {
      formError.value = e.message
      // Mostrar errores de validación
      if (e.errors) {
        // Manejar errores de campo específicos
      }
    } else {
      formError.value = 'Error al enviar formulario'
    }
  }
}
</script>
```

## Tipos de Errores Comunes

### Errores de Red

```typescript
// Sin conexión
catch (e) {
  if (e instanceof ApiException && e.status === 0) {
    error.value = 'No hay conexión a internet'
  }
}
```

### Errores de Validación

```typescript
// 400 Bad Request
if (e.status === 400 && e.errors) {
  // Mostrar errores por campo
  Object.entries(e.errors).forEach(([field, messages]) => {
    fieldErrors.value[field] = messages[0]
  })
}
```

### Errores de Autenticación

```typescript
// 401 Unauthorized
if (e.status === 401) {
  // Redirigir a login
  router.push('/login')
}
```

### Errores de Permisos

```typescript
// 403 Forbidden
if (e.status === 403) {
  error.value = 'No tienes permisos para realizar esta acción'
}
```

### Errores de Recurso No Encontrado

```typescript
// 404 Not Found
if (e.status === 404) {
  error.value = 'El recurso solicitado no existe'
  router.push('/not-found')
}
```

## Mensajes de Error al Usuario

### Principios

1. **Claros y específicos**: Explicar qué salió mal
2. **Accionables**: Sugerir qué hacer
3. **No técnicos**: Evitar mensajes técnicos
4. **Útiles**: Ayudar al usuario a resolver

### Ejemplos

```typescript
// ✅ Bueno
'No se pudo cargar la lista de miembros. Por favor intenta recargar la página.'

// ❌ Evitar
'Error 500'
'Network request failed'
'Cannot read property of undefined'
```

### Mensajes por Tipo

```typescript
const errorMessages = {
  network: 'No hay conexión a internet. Verifica tu conexión e intenta nuevamente.',
  server: 'Error del servidor. Por favor intenta más tarde.',
  notFound: 'El recurso solicitado no existe.',
  validation: 'Por favor corrige los errores en el formulario.',
  permission: 'No tienes permisos para realizar esta acción.',
  unknown: 'Ocurrió un error inesperado. Por favor intenta nuevamente.'
}
```

## Logging de Errores

### En Desarrollo

```typescript
if (import.meta.env.DEV) {
  console.error('[API Error]', {
    url: error.config?.url,
    method: error.config?.method,
    status: error.response?.status,
    message: error.message,
    data: error.response?.data
  })
}
```

### En Producción (Futuro)

```typescript
// Integrar con servicio de logging (Sentry, LogRocket, etc.)
if (import.meta.env.PROD) {
  logErrorToService(error)
}
```

## Recuperación de Errores

### Retry Automático

```typescript
async function fetchWithRetry(
  apiCall: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall()
    } catch (e) {
      lastError = e as Error
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
      }
    }
  }
  
  throw lastError!
}
```

### Botón de Reintentar

```vue
<template>
  <div v-if="error" class="alert alert-error">
    <span>{{ error }}</span>
    <button @click="retry" class="btn btn-sm btn-ghost">
      Reintentar
    </button>
  </div>
</template>

<script setup lang="ts">
function retry() {
  error.value = null
  fetchData()
}
</script>
```

## Best Practices

### 1. Siempre Manejar Errores

```typescript
// ✅ Bueno
try {
  await apiCall()
} catch (e) {
  handleError(e)
}

// ❌ Evitar
await apiCall() // Sin manejo de error
```

### 2. Mensajes Específicos

```typescript
// ✅ Bueno
error.value = 'No se pudo cargar la lista de miembros'

// ❌ Evitar
error.value = 'Error'
```

### 3. Logging para Debugging

```typescript
// ✅ Bueno
console.error('Error fetching members:', e)
// Con contexto útil

// ❌ Evitar
console.log(e) // Sin contexto
```

### 4. No Exponer Detalles Técnicos

```typescript
// ✅ Bueno - Mensaje al usuario
error.value = 'No se pudo conectar con el servidor'

// ❌ Evitar - Detalles técnicos
error.value = 'AxiosError: Network Error at axios.js:123'
```

## Referencias

- [Guía de API](./API_GUIDE.md)
- [Guía de Stores](./STORES_GUIDE.md)

