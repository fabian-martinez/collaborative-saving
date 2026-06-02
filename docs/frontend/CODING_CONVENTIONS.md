# Convenciones de Código

## Naming

### Archivos y Carpetas

| Tipo | Convención | Ejemplos |
|---|---|---|
| Features (carpetas) | `kebab-case` | `member-detail`, `active-meeting` |
| Componentes Vue | `PascalCase.vue` | `MemberCard.vue`, `DataTable.vue` |
| Stores | `camelCase.ts` | `members.ts`, `memberDetail.ts` |
| API Clients | `[module].api.ts` | `members.api.ts`, `meetings.api.ts` |
| Utils/Composables | `camelCase.ts` | `formatters.ts`, `useApi.ts` |
| Tipos | `types.ts` | `types.ts`, `member.types.ts` |

### Variables, Funciones y Tipos

| Contexto | Convención | Ejemplos |
|---|---|---|
| Variables | `camelCase` | `memberName`, `isLoading` |
| Constantes globales | `UPPER_SNAKE_CASE` | `API_BASE_URL` |
| Funciones | `camelCase` con verbo | `fetchItems()`, `handleSubmit()` |
| Componentes en template | `PascalCase` | `<MemberCard />` |
| Stores | `use` + `PascalCase` | `useMemberStore` |
| Interfaces | `PascalCase` + sufijo | `MemberResponse`, `CreateItemRequest` |
| Types | `PascalCase` | `MemberStatus`, `LoanType` |
| Enums | `PascalCase` / `UPPER_SNAKE_CASE` valores | `MemberStatus.ACTIVE` |
| Props | `camelCase` | `memberId`, `isLoading` |
| Events | `kebab-case` | `@member-selected`, `@form-submitted` |

## Estructura de Componentes Vue

Orden obligatorio de secciones:

```vue
<template>
  <!-- 1. Template -->
</template>

<script setup lang="ts">
// 1. Imports (Vue → libs → stores → components → types → utils)
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

### Orden de Imports

```typescript
// 1. Vue
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
// 2. Librerías externas
import axios from 'axios'
// 3. Stores/Composables
import { useItemStore } from '../stores/items'
// 4. Componentes
import ItemCard from '../components/ItemCard.vue'
// 5. Tipos
import type { Item, CreateItemRequest } from '../types'
// 6. Utils
import { formatCurrency } from '../utils/formatters'
```

Usar siempre `@/` para imports desde `src/`:
```typescript
// ✅
import { useApi } from '@/shared/composables/useApi'
// ❌
import { useApi } from '../../../shared/composables/useApi'
```

## TypeScript

### Tipos Explícitos

Siempre tipar: props, parámetros de funciones, retornos y variables no obvias.

```typescript
// ✅
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(amount)
}

// ❌
function formatCurrency(amount) { /* ... */ }
```

### Interface vs Type

- **`interface`**: objetos extensibles, props, respuestas de API
- **`type`**: unions, intersections, mapeos

```typescript
interface Item { id: string; name: string }           // Objeto
type ItemStatus = 'active' | 'inactive' | 'pending'   // Union
type ItemMap = Record<string, Item>                    // Mapeo
```

### Generics

```typescript
function useApi<T>(apiCall: () => Promise<T>) {
  const data = ref<T | null>(null)
  // ...
}
```

## Formato

| Regla | Valor |
|---|---|
| Indentación | 2 espacios |
| Max línea | 100 caracteres |
| Punto y coma | Sí |
| Comillas | Simples (`'`) |
| Trailing comma | Sí |

Configurado en ESLint y Prettier.

## Comentarios

**Sí comentar:** lógica compleja, decisiones de diseño, TODOs con contexto.
**No comentar:** código autoexplicativo.

```typescript
// ✅ Explica el "por qué"
// Usamos snake_case directamente porque la API V2 lo requiere
const data = response.data

// ❌ Obvio
// Incrementa el contador
counter++
```

## Anti-Patrones Comunes

```typescript
// ❌ Mutar props
props.count++
// ✅ Copia local
const localCount = ref(props.count)

// ❌ Lógica en template
{{ items.filter(i => i.active).length }}
// ✅ Computed
const activeCount = computed(() => items.value.filter(i => i.active).length)

// ❌ Imports circulares (featureA ↔ featureB)
// ✅ Mover código compartido a shared/
```

## Referencias

- [Vue 3 Style Guide](https://vuejs.org/style-guide/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
