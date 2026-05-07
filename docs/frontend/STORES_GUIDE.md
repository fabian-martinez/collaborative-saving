# Guía de Stores (Pinia)

## Cuándo Usar Stores

| ✅ Usar Store | ❌ No Usar Store |
|---|---|
| Estado compartido entre componentes | Estado local de un solo componente → `ref()` |
| Estado que persiste entre navegaciones | Props simples → props/emits |
| Datos de API | Formularios simples → estado local |
| Lógica de negocio compleja | Estado temporal de UI |

## Patrón Estándar (Setup Syntax)

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useFeatureStore = defineStore('feature', () => {
  // State
  const items = ref<Item[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const hasItems = computed(() => items.value.length > 0)
  const selectedItem = computed(() => items.value.find(i => i.id === selectedId.value))

  // Actions
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

  return { items, loading, error, hasItems, selectedItem, fetchItems }
})
```

## Patrones Comunes

### Store con Múltiples Recursos (fetch paralelo)

```typescript
async function fetchItemData(itemId: string) {
  loading.value = true
  error.value = null
  try {
    const [itemData, relatedData] = await Promise.all([
      api.getItemById(itemId),
      api.getItemRelated(itemId)
    ])
    item.value = itemData
    related.value = relatedData
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Error al cargar datos'
  } finally {
    loading.value = false
  }
}
```

### Store que Usa Otro Store

```typescript
export const useDashboardStore = defineStore('dashboard', () => {
  const itemsStore = useItemsStore()
  const totalItems = computed(() => itemsStore.items.length)
  return { totalItems }
})
```

### Reset de Estado

```typescript
function reset() {
  items.value = []
  loading.value = false
  error.value = null
}
```

## Uso en Componentes

```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { useItemStore } from '../stores/items'

const store = useItemStore()
onMounted(() => store.fetchItems())
</script>

<template>
  <div v-if="store.loading">Cargando...</div>
  <div v-else-if="store.error">{{ store.error }}</div>
  <div v-for="item in store.items" :key="item.id">{{ item.name }}</div>
</template>
```

### Destructuring Reactivo

```typescript
// ⚠️ Pierde reactividad
const { items } = useItemStore()

// ✅ Mantiene reactividad
import { storeToRefs } from 'pinia'
const store = useItemStore()
const { items, loading } = storeToRefs(store)

// ✅ También válido
store.items // acceso directo
```

## Reglas

- **Un store por feature**, dividir si la lógica es muy diferente (ej: `items.ts` + `itemDetail.ts`)
- **Actions**: funciones que mutan estado (pueden ser async)
- **Getters**: `computed` para datos derivados (siempre síncronos, no mutan estado)
- **Nombres descriptivos**: `fetchItems()`, `createItem()` — no `get()`, `post()`
- **No poner estado de UI** en stores (modals, tooltips → estado local del componente)
- Si hay múltiples operaciones independientes, usar **loading states separados**

> Ver [Manejo de Errores](./ERROR_HANDLING.md) para patrones detallados de error handling en stores.

## Referencias

- [Pinia Documentation](https://pinia.vuejs.org/)
- [Guía de API](./API_GUIDE.md)
- [Testing](./TESTING_GUIDE.md)
