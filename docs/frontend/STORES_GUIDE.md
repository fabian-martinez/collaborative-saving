# Guía de Stores (Pinia)

## Introducción

Esta guía explica cómo usar Pinia para el manejo de estado en el proyecto. Pinia es el estado oficial de Vue 3 y reemplaza a Vuex.

## ¿Cuándo Usar Stores?

### ✅ Usar Stores Para:

- Estado compartido entre múltiples componentes
- Estado que persiste entre navegaciones
- Lógica de negocio compleja
- Datos que vienen de API
- Estado global de la aplicación

### ❌ No Usar Stores Para:

- Estado local de un componente → `ref()` o `reactive()`
- Props simples → Props y emits
- Estado temporal → Estado local
- Formularios simples → Estado local del componente

## Estructura de un Store

### Setup Syntax (Recomendado)

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useFeatureStore = defineStore('feature', () => {
  // 1. State (refs)
  const items = ref<Item[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const selectedId = ref<string | null>(null)

  // 2. Getters (computed)
  const hasItems = computed(() => items.value.length > 0)
  const selectedItem = computed(() => 
    items.value.find(item => item.id === selectedId.value)
  )

  // 3. Actions (functions)
  async function fetchItems() {
    loading.value = true
    error.value = null
    try {
      items.value = await api.getItems()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error'
    } finally {
      loading.value = false
    }
  }

  function selectItem(id: string) {
    selectedId.value = id
  }

  // 4. Return
  return {
    // State
    items,
    loading,
    error,
    selectedId,
    // Getters
    hasItems,
    selectedItem,
    // Actions
    fetchItems,
    selectItem
  }
})
```

## Patrones Comunes

### 1. Store con API Calls

```typescript
export const useMembersStore = defineStore('members', () => {
  const members = ref<Member[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchMembers() {
    loading.value = true
    error.value = null
    try {
      members.value = await membersApi.getMembers()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al cargar miembros'
      console.error('Error fetching members:', e)
    } finally {
      loading.value = false
    }
  }

  async function createMember(data: CreateMemberRequest) {
    loading.value = true
    error.value = null
    try {
      const newMember = await membersApi.createMember(data)
      members.value.push(newMember)
      return newMember
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al crear miembro'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    members,
    loading,
    error,
    fetchMembers,
    createMember
  }
})
```

### 2. Store con Estado Derivado

```typescript
export const useDashboardStore = defineStore('dashboard', () => {
  const metrics = ref<Metrics | null>(null)
  const monthlyMovements = ref<MonthlyMovements | null>(null)

  // Getters computados
  const totalRevenue = computed(() => 
    monthlyMovements.value?.collected.reduce((sum, val) => sum + val, 0) || 0
  )

  const growthRate = computed(() => {
    if (!monthlyMovements.value) return 0
    const collected = monthlyMovements.value.collected
    if (collected.length < 2) return 0
    const last = collected[collected.length - 1]
    const previous = collected[collected.length - 2]
    return ((last - previous) / previous) * 100
  })

  return {
    metrics,
    monthlyMovements,
    totalRevenue,
    growthRate
  }
})
```

### 3. Store con Múltiples Recursos

```typescript
export const useMemberDetailStore = defineStore('memberDetail', () => {
  // Múltiples recursos relacionados
  const member = ref<Member | null>(null)
  const loans = ref<Loan[]>([])
  const payments = ref<Payment[]>([])
  
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchMemberData(memberId: string) {
    loading.value = true
    error.value = null
    try {
      // Fetch en paralelo
      const [memberData, loansData, paymentsData] = await Promise.all([
        membersApi.getMemberById(memberId),
        loansApi.getMemberLoans(memberId),
        membersApi.getMemberPayments(memberId)
      ])
      
      member.value = memberData
      loans.value = loansData
      payments.value = paymentsData
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error al cargar datos'
    } finally {
      loading.value = false
    }
  }

  return {
    member,
    loans,
    payments,
    loading,
    error,
    fetchMemberData
  }
})
```

## Usar Stores en Componentes

### Básico

```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { useMembersStore } from '../stores/members'

const store = useMembersStore()

onMounted(() => {
  store.fetchMembers()
})
</script>

<template>
  <div v-if="store.loading">Cargando...</div>
  <div v-else-if="store.error">{{ store.error }}</div>
  <div v-else>
    <div v-for="member in store.members" :key="member.id">
      {{ member.name }}
    </div>
  </div>
</template>
```

### Con Destructuring (Cuidado)

```typescript
// ⚠️ Destructuring pierde reactividad
const { members, loading } = useMembersStore() // No reactivo

// ✅ Usar storeToRefs para mantener reactividad
import { storeToRefs } from 'pinia'

const store = useMembersStore()
const { members, loading, error } = storeToRefs(store) // Reactivo

// ✅ O acceder directamente
const store = useMembersStore()
store.members // Reactivo
```

### Con Computed

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useMembersStore } from '../stores/members'

const store = useMembersStore()

const activeMembers = computed(() => 
  store.members.filter(m => m.status === 'active')
)
</script>
```

## Actions vs Getters

### Actions

- Funciones que modifican estado
- Pueden ser asíncronas
- Llaman a APIs
- Mutan el estado del store

```typescript
async function fetchMembers() {
  loading.value = true
  members.value = await api.getMembers()
  loading.value = false
}
```

### Getters (Computed)

- Valores derivados del estado
- Siempre síncronos
- No mutan estado
- Se recalculan automáticamente

```typescript
const activeMembers = computed(() => 
  members.value.filter(m => m.status === 'active')
)
```

## Composición de Stores

### Store que Usa Otro Store

```typescript
export const useDashboardStore = defineStore('dashboard', () => {
  const membersStore = useMembersStore()
  const loansStore = useLoansStore()

  const totalMembers = computed(() => membersStore.members.length)
  const totalLoans = computed(() => loansStore.loans.length)

  return {
    totalMembers,
    totalLoans
  }
})
```

## Resetear Estado

```typescript
export const useFeatureStore = defineStore('feature', () => {
  const items = ref<Item[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  function reset() {
    items.value = []
    loading.value = false
    error.value = null
  }

  return {
    items,
    loading,
    error,
    reset
  }
})

// Uso
const store = useFeatureStore()
store.reset()
```

## Manejo de Errores

### Patrón Estándar

```typescript
async function fetchData() {
  loading.value = true
  error.value = null
  try {
    data.value = await api.getData()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error desconocido'
    console.error('Error fetching data:', e)
    // Opcional: re-throw para que el componente pueda manejar
    throw e
  } finally {
    loading.value = false
  }
}
```

### Errores Específicos

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
      error.value = e.message
      // Manejar errores específicos
      if (e.status === 409) {
        error.value = 'El item ya existe'
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

## Best Practices

### 1. Un Store por Feature

```typescript
// ✅ Bueno
// stores/members.ts
export const useMembersStore = defineStore('members', () => { /* ... */ })

// ❌ Evitar
// stores/all.ts - Todo en un store gigante
```

### 2. Estado Inmutable

```typescript
// ✅ Bueno - Crear nuevo array
items.value = [...items.value, newItem]

// ❌ Evitar - Mutación directa (aunque funcione)
items.value.push(newItem) // Funciona pero menos claro
```

### 3. Actions Descriptivas

```typescript
// ✅ Bueno
async function fetchMembers() { /* ... */ }
async function createMember() { /* ... */ }
function selectMember() { /* ... */ }

// ❌ Evitar
async function get() { /* ... */ }
async function post() { /* ... */ }
```

### 4. Getters para Datos Derivados

```typescript
// ✅ Bueno - Getter
const activeMembers = computed(() => 
  members.value.filter(m => m.status === 'active')
)

// ❌ Evitar - Action para datos derivados
function getActiveMembers() {
  return members.value.filter(m => m.status === 'active')
}
```

### 5. Loading States Separados

```typescript
// ✅ Bueno - Loading específico
const loadingMembers = ref(false)
const loadingLoans = ref(false)

// ❌ Evitar - Loading genérico (si hay múltiples operaciones)
const loading = ref(false) // ¿Qué está cargando?
```

## Anti-Patrones

### ❌ Evitar: Mutar Props en Store

```typescript
// ❌ Malo
const store = useStore()
store.updateProps(props) // No mutar props

// ✅ Bueno
const store = useStore()
store.updateData(data) // Usar datos, no props
```

### ❌ Evitar: Lógica de UI en Store

```typescript
// ❌ Malo
function showModal() {
  isModalOpen.value = true // UI state en store
}

// ✅ Bueno
// UI state en componente
const isModalOpen = ref(false)
```

### ❌ Evitar: Stores Demasiado Grandes

```typescript
// ❌ Malo - 500+ líneas
// ✅ Bueno - Dividir en múltiples stores relacionados
// stores/members.ts
// stores/memberDetail.ts
```

## Testing Stores

Ver [TESTING_GUIDE.md](./TESTING_GUIDE.md) para detalles.

**Resumen:**
- Testear state inicial
- Testear actions
- Testear getters
- Mockear API calls

## Referencias

- [Pinia Documentation](https://pinia.vuejs.org/)
- [Guía de Features](./FEATURES_GUIDE.md)
- [Guía de API](./API_GUIDE.md)

