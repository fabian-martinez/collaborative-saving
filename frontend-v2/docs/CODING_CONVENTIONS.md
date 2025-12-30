# Convenciones de Código

## Introducción

Este documento establece las convenciones de código que todos los desarrolladores deben seguir para mantener consistencia y legibilidad en el proyecto.

## Naming Conventions

### Archivos y Carpetas

**Features:**
- Carpetas: `kebab-case`
- Ejemplos: `member-detail`, `active-meeting`, `loan-simulation`

**Componentes Vue:**
- Archivos: `PascalCase.vue`
- Ejemplos: `MemberCard.vue`, `DataTable.vue`, `LoadingSpinner.vue`

**Stores:**
- Archivos: `camelCase.ts`
- Ejemplos: `members.ts`, `memberDetail.ts`, `dashboard.ts`

**API Clients:**
- Archivos: `[module].api.ts`
- Ejemplos: `members.api.ts`, `meetings.api.ts`

**Utils y Composables:**
- Archivos: `camelCase.ts`
- Ejemplos: `formatters.ts`, `validators.ts`, `useApi.ts`

**Tipos:**
- Archivos: `types.ts` o `[feature].types.ts`
- Ejemplos: `types.ts`, `member.types.ts`

### Variables y Funciones

**Variables:**
- `camelCase` para variables y constantes
- `UPPER_SNAKE_CASE` solo para constantes verdaderamente constantes
- Ejemplos: `const memberName`, `const isLoading`, `const API_BASE_URL`

**Funciones:**
- `camelCase` con verbos descriptivos
- Ejemplos: `fetchMembers()`, `handleSubmit()`, `formatCurrency()`

**Componentes Vue:**
- `PascalCase` en templates y JSX
- Ejemplos: `<MemberCard />`, `<DataTable />`

**Stores:**
- Prefijo `use` + `PascalCase`
- Ejemplos: `useMemberStore`, `useDashboardStore`

### Tipos e Interfaces

**Interfaces:**
- `PascalCase` con sufijo descriptivo
- Ejemplos: `MemberResponse`, `CreateMemberRequest`, `MemberPayment`

**Types:**
- `PascalCase`
- Ejemplos: `MemberStatus`, `LoanType`, `PaymentType`

**Enums:**
- `PascalCase` para el enum, `UPPER_SNAKE_CASE` para valores
- Ejemplos:
```typescript
enum MemberStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}
```

### Props y Events

**Props:**
- `camelCase`
- Ejemplos: `memberId`, `isLoading`, `onSubmit`

**Events:**
- `kebab-case` (convención Vue)
- Ejemplos: `@member-selected`, `@form-submitted`, `@close-modal`

## Estructura de Componentes Vue

### Orden de Secciones

```vue
<template>
  <!-- Template primero -->
</template>

<script setup lang="ts">
// 1. Imports
// 2. Props y emits
// 3. Composables y stores
// 4. Reactive state
// 5. Computed properties
// 6. Methods
// 7. Lifecycle hooks
</script>

<style scoped>
/* Styles al final */
</style>
```

### Ejemplo Completo

```vue
<template>
  <div class="member-card">
    <h3>{{ member.name }}</h3>
    <p>{{ member.email }}</p>
    <button @click="handleEdit">Editar</button>
  </div>
</template>

<script setup lang="ts">
// 1. Imports
import { computed, onMounted } from 'vue'
import type { Member } from '../types'

// 2. Props y emits
const props = defineProps<{
  member: Member
}>()

const emit = defineEmits<{
  edit: [id: string]
}>()

// 3. Composables y stores
// const store = useMemberStore()

// 4. Reactive state
const isEditing = ref(false)

// 5. Computed properties
const displayName = computed(() => props.member.name.toUpperCase())

// 6. Methods
function handleEdit() {
  emit('edit', props.member.id)
}

// 7. Lifecycle hooks
onMounted(() => {
  console.log('Member card mounted')
})
</script>

<style scoped>
.member-card {
  padding: 1rem;
}
</style>
```

## TypeScript Conventions

### Tipos Explícitos

**Siempre tipar:**
- Props de componentes
- Parámetros de funciones
- Valores de retorno de funciones
- Variables cuando el tipo no es obvio

**Ejemplos:**
```typescript
// ✅ Bueno
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP'
  }).format(amount)
}

// ❌ Evitar
function formatCurrency(amount) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP'
  }).format(amount)
}
```

### Interfaces vs Types

**Usar `interface` para:**
- Objetos que pueden extenderse
- Props de componentes
- Respuestas de API

**Usar `type` para:**
- Unions e intersections
- Tipos primitivos
- Mapeos

**Ejemplos:**
```typescript
// Interface para objetos
interface Member {
  id: string
  name: string
  email: string
}

// Type para unions
type MemberStatus = 'active' | 'inactive' | 'pending'

// Type para mapeos
type MemberMap = Record<string, Member>
```

### Generics

Usar generics cuando sea apropiado:

```typescript
// ✅ Bueno
function useApi<T>() {
  const data = ref<T | null>(null)
  // ...
  return { data }
}

// Uso
const { data } = useApi<Member[]>()
```

## Imports

### Orden de Imports

1. Imports de Vue
2. Imports de librerías externas
3. Imports de stores/composables
4. Imports de componentes
5. Imports de tipos
6. Imports relativos

**Ejemplo:**
```typescript
// 1. Vue
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

// 2. Librerías externas
import axios from 'axios'

// 3. Stores/Composables
import { useMemberStore } from '../stores/members'
import { useApi } from '@/shared/composables/useApi'

// 4. Componentes
import MemberCard from '../components/MemberCard.vue'
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'

// 5. Tipos
import type { Member, CreateMemberRequest } from '../types'

// 6. Relativos
import { formatCurrency } from '../utils/formatters'
```

### Path Aliases

Usar `@/` para imports desde `src/`:

```typescript
// ✅ Bueno
import { useApi } from '@/shared/composables/useApi'
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'

// ❌ Evitar
import { useApi } from '../../../shared/composables/useApi'
```

## Formato de Código

### Indentación

- 2 espacios (no tabs)
- Configurado en `.editorconfig` y Prettier

### Líneas

- Máximo 100 caracteres por línea
- Break líneas largas de manera legible

### Punto y Coma

- Usar punto y coma al final de statements
- Configurado en ESLint/Prettier

### Comillas

- Comillas simples (`'`) para strings
- Comillas dobles (`"`) solo cuando sea necesario (ej: dentro de strings)

### Espaciado

```typescript
// ✅ Bueno
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0)
}

// ❌ Evitar
function calculateTotal(items:Item[]):number{
  return items.reduce((sum,item)=>sum+item.price,0)
}
```

## Comentarios

### Cuándo Comentar

- **Sí comentar:**
  - Lógica compleja o no obvia
  - Decisiones de diseño importantes
  - TODOs y FIXMEs
  - Funciones públicas complejas

- **No comentar:**
  - Código autoexplicativo
  - Lo que el código ya dice claramente

### Estilo de Comentarios

```typescript
// ✅ Bueno - Explica el "por qué"
// Usamos snake_case directamente porque la API V2 lo requiere
const memberData = response.data

// ✅ Bueno - Explica lógica compleja
// Calcula el interés compuesto usando la fórmula: A = P(1 + r/n)^(nt)
const compoundInterest = principal * Math.pow(1 + rate / periods, periods * time)

// ❌ Evitar - Obvio
// Incrementa el contador
counter++

// ✅ Bueno - TODO con contexto
// TODO: Implementar caché cuando el backend soporte ETags
async function fetchMembers() {
  // ...
}
```

## Manejo de Errores

### Try-Catch

Siempre manejar errores explícitamente:

```typescript
// ✅ Bueno
async function fetchData() {
  try {
    const data = await api.getData()
    return data
  } catch (error) {
    console.error('Error fetching data:', error)
    throw new Error('Failed to fetch data')
  }
}

// ❌ Evitar
async function fetchData() {
  const data = await api.getData() // Sin manejo de error
  return data
}
```

### Error Messages

Mensajes de error claros y útiles:

```typescript
// ✅ Bueno
if (!memberId) {
  throw new Error('Member ID is required')
}

// ❌ Evitar
if (!memberId) {
  throw new Error('Error')
}
```

## Best Practices

### 1. Prefer Composition API

```typescript
// ✅ Bueno - Composition API
<script setup lang="ts">
import { ref, computed } from 'vue'
const count = ref(0)
const doubled = computed(() => count.value * 2)
</script>

// ❌ Evitar - Options API (solo si es necesario)
<script>
export default {
  data() {
    return { count: 0 }
  },
  computed: {
    doubled() {
      return this.count * 2
    }
  }
}
</script>
```

### 2. Usar `ref` y `reactive` Apropiadamente

```typescript
// ✅ ref para primitivos y objetos simples
const count = ref(0)
const member = ref<Member | null>(null)

// ✅ reactive para objetos complejos que no se reemplazan
const form = reactive({
  name: '',
  email: ''
})
```

### 3. Destructuring Props

```typescript
// ✅ Bueno - Destructuring cuando sea útil
const { member, isLoading } = toRefs(props)

// ✅ También válido - Acceso directo
props.member.name
```

### 4. Evitar Mutaciones Directas

```typescript
// ✅ Bueno - Usar métodos del store
store.updateMember(id, data)

// ❌ Evitar - Mutación directa
store.members[0].name = 'New Name'
```

## Anti-Patrones

### ❌ Evitar: Props Mutables

```typescript
// ❌ Malo
const props = defineProps<{ count: number }>()
props.count++ // Error: props son readonly

// ✅ Bueno
const props = defineProps<{ count: number }>()
const localCount = ref(props.count)
localCount.value++
```

### ❌ Evitar: Lógica en Templates

```vue
<!-- ❌ Malo -->
<template>
  <div>{{ members.filter(m => m.active).length }}</div>
</template>

<!-- ✅ Bueno -->
<template>
  <div>{{ activeMembersCount }}</div>
</template>

<script setup lang="ts">
const activeMembersCount = computed(() => 
  members.value.filter(m => m.active).length
)
</script>
```

### ❌ Evitar: Imports Circulares

```typescript
// ❌ Malo - featureA.ts importa featureB.ts que importa featureA.ts
// ✅ Bueno - Mover código compartido a shared/
```

## Referencias

- [Vue 3 Style Guide](https://vuejs.org/style-guide/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [ESLint Rules](https://eslint.org/docs/rules/)

