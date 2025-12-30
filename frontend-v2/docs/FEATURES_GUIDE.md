# Guía de Features

## Introducción

Esta guía explica cómo crear y estructurar nuevas features en el proyecto. Una feature representa un dominio de negocio completo y agrupa todo el código relacionado.

## ¿Qué es una Feature?

Una feature es un módulo autocontenido que incluye:
- Vistas (páginas)
- Componentes específicos
- Stores (estado)
- API clients (opcional)
- Tipos TypeScript

**Ejemplos de features:**
- `members` - Gestión de miembros
- `meetings` - Reuniones
- `loans` - Préstamos
- `dashboard` - Panel principal

## Estructura de una Feature

### Estructura Mínima

```
feature-name/
├── stores/
│   └── featureName.ts
└── views/
    └── FeatureNameView.vue
```

### Estructura Completa

```
feature-name/
├── api/                    # (opcional)
│   └── featureName.api.ts
├── components/             # Componentes específicos
│   ├── FeatureForm.vue
│   ├── FeatureList.vue
│   └── FeatureCard.vue
├── stores/
│   ├── featureName.ts      # Store principal
│   └── featureDetail.ts    # Store adicional (si es necesario)
├── views/
│   ├── FeatureNameView.vue # Lista/vista principal
│   └── FeatureDetailView.vue # Detalle
└── types.ts                # (opcional) Tipos específicos
```

## Paso a Paso: Crear una Nueva Feature

### Paso 1: Crear la Estructura de Carpetas

```bash
mkdir -p src/features/my-feature/{api,components,stores,views}
```

### Paso 2: Crear el API Client (si es necesario)

Si la feature necesita un API client específico (más allá de los existentes en `src/api/`):

```typescript
// src/features/my-feature/api/myFeature.api.ts
import apiClient from '@/api/client'
import type { MyFeatureResponse } from '../types'

export const myFeatureApi = {
  async getItems(): Promise<MyFeatureResponse[]> {
    const response = await apiClient.get<MyFeatureResponse[]>('/v2/my-feature')
    return response.data
  },

  async getItemById(id: string): Promise<MyFeatureResponse> {
    const response = await apiClient.get<MyFeatureResponse>(`/v2/my-feature/${id}`)
    return response.data
  },

  async createItem(data: CreateMyFeatureRequest): Promise<MyFeatureResponse> {
    const response = await apiClient.post<MyFeatureResponse>('/v2/my-feature', data)
    return response.data
  }
}
```

**Nota**: Si el API client puede ir en `src/api/`, úsalo allí en lugar de crear uno específico.

### Paso 3: Crear el Store

```typescript
// src/features/my-feature/stores/myFeature.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { myFeatureApi } from '../api/myFeature.api'
import type { MyFeatureResponse } from '../types'

export const useMyFeatureStore = defineStore('myFeature', () => {
  // State
  const items = ref<MyFeatureResponse[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  async function fetchItems() {
    loading.value = true
    error.value = null
    try {
      items.value = await myFeatureApi.getItems()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al cargar items'
      console.error('Error fetching items:', e)
    } finally {
      loading.value = false
    }
  }

  async function createItem(data: CreateMyFeatureRequest) {
    loading.value = true
    error.value = null
    try {
      const newItem = await myFeatureApi.createItem(data)
      items.value.push(newItem)
      return newItem
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al crear item'
      throw e
    } finally {
      loading.value = false
    }
  }

  // Getters (computed)
  const hasItems = computed(() => items.value.length > 0)
  const itemCount = computed(() => items.value.length)

  return {
    // State
    items,
    loading,
    error,
    // Actions
    fetchItems,
    createItem,
    // Getters
    hasItems,
    itemCount
  }
})
```

### Paso 4: Crear la Vista Principal

```vue
<!-- src/features/my-feature/views/MyFeatureView.vue -->
<template>
  <div class="my-feature-view">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold">Mi Feature</h1>
      <button @click="handleCreate" class="btn btn-primary">
        Crear Nuevo
      </button>
    </div>

    <LoadingSpinner :loading="store.loading" />
    <ErrorMessage :error="store.error" />

    <div v-if="store.hasItems" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <MyFeatureCard
        v-for="item in store.items"
        :key="item.id"
        :item="item"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </div>

    <div v-else-if="!store.loading" class="text-center py-12">
      <p class="text-base-content/60">No hay items disponibles</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMyFeatureStore } from '../stores/myFeature'
import MyFeatureCard from '../components/MyFeatureCard.vue'
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'
import ErrorMessage from '@/shared/components/ErrorMessage.vue'

const router = useRouter()
const store = useMyFeatureStore()

onMounted(() => {
  store.fetchItems()
})

function handleCreate() {
  router.push('/my-feature/new')
}

function handleEdit(id: string) {
  router.push(`/my-feature/${id}`)
}

async function handleDelete(id: string) {
  if (confirm('¿Estás seguro de eliminar este item?')) {
    await store.deleteItem(id)
    await store.fetchItems()
  }
}
</script>
```

### Paso 5: Crear Componentes Específicos (si es necesario)

```vue
<!-- src/features/my-feature/components/MyFeatureCard.vue -->
<template>
  <div class="card bg-base-100 shadow-lg">
    <div class="card-body">
      <h2 class="card-title">{{ item.name }}</h2>
      <p>{{ item.description }}</p>
      <div class="card-actions justify-end">
        <button @click="$emit('edit', item.id)" class="btn btn-sm btn-primary">
          Editar
        </button>
        <button @click="$emit('delete', item.id)" class="btn btn-sm btn-error">
          Eliminar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MyFeatureResponse } from '../types'

defineProps<{
  item: MyFeatureResponse
}>()

defineEmits<{
  edit: [id: string]
  delete: [id: string]
}>()
</script>
```

### Paso 6: Agregar Rutas

```typescript
// src/router/index.ts
{
  path: '/my-feature',
  name: 'my-feature',
  component: () => import('@/features/my-feature/views/MyFeatureView.vue')
},
{
  path: '/my-feature/:id',
  name: 'my-feature-detail',
  component: () => import('@/features/my-feature/views/MyFeatureDetailView.vue')
}
```

### Paso 7: Agregar Mocks (si es necesario)

```typescript
// src/api/mocks/index.ts
async getMyFeatureItems(): Promise<MyFeatureResponse[]> {
  await delay()
  return [
    { id: '1', name: 'Item 1', description: 'Description 1' },
    { id: '2', name: 'Item 2', description: 'Description 2' }
  ]
}
```

## Ejemplo Completo: Feature Simple

### Feature: Notifications

```
notifications/
├── stores/
│   └── notifications.ts
└── views/
    └── NotificationsView.vue
```

**Store:**
```typescript
export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([])
  const unreadCount = computed(() => 
    notifications.value.filter(n => !n.read).length
  )
  
  async function fetchNotifications() {
    // ...
  }
  
  return { notifications, unreadCount, fetchNotifications }
})
```

**View:**
```vue
<template>
  <div>
    <h1>Notificaciones ({{ store.unreadCount }})</h1>
    <!-- ... -->
  </div>
</template>
```

## Best Practices

### 1. Empieza Simple

Crea la estructura mínima primero:
- Store básico
- Vista básica
- Agrega complejidad cuando sea necesario

### 2. Reutiliza Componentes Compartidos

Usa componentes de `src/shared/components/` cuando sea posible:
- `DataTable` para listas
- `Modal` para diálogos
- `LoadingSpinner` para estados de carga
- `ErrorMessage` para errores

### 3. Separa Concerns

- **Store**: Lógica de negocio y estado
- **View**: Orquestación y presentación
- **Components**: UI reutilizable
- **API**: Comunicación HTTP

### 4. Usa TypeScript

Tipa todo:
- Props de componentes
- Estado del store
- Respuestas de API
- Parámetros de funciones

### 5. Maneja Estados de Carga y Error

Siempre incluye:
- Loading state
- Error state
- Empty state

## Anti-Patrones

### ❌ Evitar: Feature God Object

```typescript
// ❌ Malo - Todo en un archivo
// feature.ts con 1000 líneas

// ✅ Bueno - Separado
// stores/feature.ts
// views/FeatureView.vue
// components/FeatureCard.vue
```

### ❌ Evitar: Lógica en Views

```vue
<!-- ❌ Malo -->
<script setup>
async function fetchData() {
  const response = await axios.get('/api/data')
  items.value = response.data
}
</script>

<!-- ✅ Bueno -->
<script setup>
const store = useFeatureStore()
onMounted(() => store.fetchData())
</script>
```

### ❌ Evitar: Duplicar Código

```typescript
// ❌ Malo - Duplicar lógica de API en cada componente
// ✅ Bueno - Centralizar en store o composable
```

## Checklist

Antes de considerar una feature completa:

- [ ] Store creado con state, actions y getters
- [ ] Vista principal creada
- [ ] Componentes específicos creados (si es necesario)
- [ ] Rutas agregadas al router
- [ ] Tipos TypeScript definidos
- [ ] Mocks agregados (si es necesario)
- [ ] Estados de loading/error manejados
- [ ] Componentes compartidos usados cuando es posible
- [ ] Código tipado completamente
- [ ] Documentación de la feature (comentarios)

## Referencias

- [Estructura de Carpetas](./FOLDER_STRUCTURE.md)
- [Guía de Stores](./STORES_GUIDE.md)
- [Guía de Componentes](./COMPONENTS_GUIDE.md)
- [Guía de API](./API_GUIDE.md)
- [Checklist de Implementación](./IMPLEMENTATION_CHECKLIST.md)

