# Guía de Performance

## Code Splitting y Lazy Loading

> Ver [Routing](./ROUTING_GUIDE.md) para configuración de lazy loading en rutas.

Para componentes pesados individuales:

```typescript
import { defineAsyncComponent } from 'vue'

const HeavyChart = defineAsyncComponent(() => import('@/components/HeavyChart.vue'))
```

## Optimización de Componentes

### v-show vs v-if

```vue
<!-- v-show: toggle frecuente (el elemento siempre está en el DOM) -->
<div v-show="isVisible">Contenido</div>

<!-- v-if: renderizado condicional (mount/unmount) -->
<div v-if="hasData">Contenido</div>
```

### Computed (siempre cacheado)

```typescript
// ✅ Computed — se recalcula solo si cambian dependencias
const filtered = computed(() => items.value.filter(i => i.active))

// ❌ Función — se recalcula en cada render
function getFiltered() { return items.value.filter(i => i.active) }
```

### Keys Estables en Listas

```vue
<!-- ✅ Key estable -->
<div v-for="item in items" :key="item.id">

<!-- ❌ Index como key -->
<div v-for="(item, index) in items" :key="index">
```

### v-memo para Listas Grandes

```vue
<div v-for="item in items" :key="item.id" v-memo="[item.id, item.status]">
  <!-- Solo re-renderiza si id o status cambian -->
</div>
```

## Debounce en Búsquedas

```typescript
const searchQuery = ref('')
const debouncedQuery = useDebounce(searchQuery, 500)
watch(debouncedQuery, (query) => performSearch(query))
```

## Paginación

```typescript
async function fetchItems(page: number = 1) {
  const response = await api.getItems({ page, limit: 20 })
  // No cargar miles de items a la vez
}
```

## Virtual Scrolling

Para listas de 1000+ items, usar `vue-virtual-scroller`:

```vue
<VirtualList :items="items" :item-height="50">
  <template #default="{ item }"><ItemCard :item="item" /></template>
</VirtualList>
```

## Bundle

### Tree Shaking

```typescript
// ✅ Import específico
import { formatCurrency } from '@/shared/utils/formatters'

// ⚠️ Importa todo
import * as formatters from '@/shared/utils/formatters'
```

### Análisis

```bash
npm run build   # Revisar tamaños de chunks en dist/
```

## Monitoreo

- **Lighthouse** en Chrome DevTools: Performance score, FCP, TTI
- **Web Vitals**: LCP, FID, CLS

## Referencias

- [Vue Performance](https://vuejs.org/guide/best-practices/performance.html)
- [Vite Optimization](https://vitejs.dev/guide/performance.html)
