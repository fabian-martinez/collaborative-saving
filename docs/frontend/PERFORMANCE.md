# Guía de Performance

## Introducción

Esta guía explica cómo optimizar el rendimiento del frontend, incluyendo lazy loading, code splitting, y mejores prácticas.

## Lazy Loading de Rutas

### Configuración

Todas las rutas usan lazy loading automático:

```typescript
{
  path: '/members',
  name: 'members',
  component: () => import('@/features/members/views/MembersView.vue')
}
```

**Beneficios:**
- Code splitting automático
- Carga solo lo necesario
- Mejor tiempo de carga inicial

### Verificar Lazy Loading

En DevTools → Network:
- Al navegar a una ruta, se carga un nuevo chunk
- Chunks tienen nombres descriptivos

## Code Splitting

### Automático con Vite

Vite hace code splitting automático:
- Cada ruta lazy-loaded es un chunk
- Imports dinámicos crean chunks

### Code Splitting Manual

```typescript
// Lazy load componente pesado
const HeavyComponent = defineAsyncComponent(() =>
  import('@/components/HeavyComponent.vue')
)
```

## Optimización de Componentes

### v-show vs v-if

```vue
<!-- ✅ v-show - Mejor para toggle frecuente -->
<div v-show="isVisible">Contenido</div>

<!-- ✅ v-if - Mejor para renderizado condicional -->
<div v-if="hasData">Contenido</div>
```

### Computed vs Methods

```vue
<script setup>
// ✅ Computed - Cacheado
const filteredItems = computed(() => 
  items.value.filter(i => i.active)
)

// ❌ Methods - Se recalcula cada vez
function getFilteredItems() {
  return items.value.filter(i => i.active)
}
</script>
```

### v-memo (Vue 3.2+)

```vue
<!-- Para listas grandes -->
<div v-for="item in items" :key="item.id" v-memo="[item.id, item.status]">
  <!-- Solo re-renderiza si item.id o item.status cambian -->
</div>
```

## Optimización de Imágenes

### Lazy Loading

```vue
<template>
  <img 
    src="/image.jpg" 
    loading="lazy" 
    alt="Description"
  />
</template>
```

### Formatos Modernos

- Usar WebP cuando sea posible
- Usar tamaños apropiados
- Considerar `srcset` para responsive

## Memoización

### useMemo (si se implementa)

```typescript
import { computed } from 'vue'

// Computed ya es memoizado automáticamente
const expensiveValue = computed(() => {
  // Cálculo costoso
  return heavyCalculation(data.value)
})
```

## Virtual Scrolling

Para listas muy grandes (1000+ items):

```vue
<!-- Considerar librería como vue-virtual-scroller -->
<VirtualList :items="items" :item-height="50">
  <template #default="{ item }">
    <ItemCard :item="item" />
  </template>
</VirtualList>
```

## Bundle Optimization

### Analizar Bundle

```bash
npm run build
# Revisar output en dist/
# Ver tamaños de chunks
```

### Tree Shaking

Vite hace tree shaking automático:
- Solo importa lo que usas
- Elimina código muerto

### Evitar Imports Completos

```typescript
// ✅ Bueno - Tree shaking funciona
import { formatCurrency } from '@/shared/utils/formatters'

// ⚠️ Cuidado - Puede importar todo
import * as formatters from '@/shared/utils/formatters'
```

## Performance en Stores

### Evitar Computaciones Pesadas

```typescript
// ✅ Bueno - Computed cacheado
const expensiveValue = computed(() => {
  return heavyCalculation(data.value)
})

// ❌ Evitar - En action (se ejecuta cada vez)
async function fetchData() {
  const result = heavyCalculation(data.value) // Malo
}
```

### Paginación y Lazy Loading

```typescript
// Para listas grandes, cargar por páginas
async function fetchMembers(page: number = 1) {
  const response = await api.getMembers({ page, limit: 20 })
  // ...
}
```

## Best Practices

### 1. Lazy Load Rutas

```typescript
// ✅ Siempre
component: () => import('@/features/...')

// ❌ Nunca
import View from '@/features/...'
component: View
```

### 2. Usar Computed para Datos Derivados

```typescript
// ✅ Bueno
const activeMembers = computed(() => 
  members.value.filter(m => m.status === 'active')
)

// ❌ Evitar
function getActiveMembers() {
  return members.value.filter(m => m.status === 'active')
}
```

### 3. Evitar Re-renders Innecesarios

```vue
<!-- ✅ Bueno - Key estable -->
<div v-for="item in items" :key="item.id">

<!-- ❌ Evitar - Key que cambia -->
<div v-for="(item, index) in items" :key="index">
```

### 4. Debounce en Búsquedas

```typescript
import { useDebounce } from '@/shared/composables/useDebounce'

const searchQuery = ref('')
const debouncedQuery = useDebounce(searchQuery, 500)

watch(debouncedQuery, (query) => {
  // Búsqueda solo después de 500ms sin cambios
  performSearch(query)
})
```

### 5. Paginación para Listas Grandes

```typescript
// No cargar todos los items a la vez
async function fetchItems(page: number) {
  const response = await api.getItems({ page, limit: 20 })
  // ...
}
```

## Monitoreo de Performance

### Lighthouse

Ejecutar Lighthouse en Chrome DevTools:
- Performance score
- First Contentful Paint
- Time to Interactive
- Bundle size

### Web Vitals

Monitorear métricas clave:
- LCP (Largest Contentful Paint)
- FID (First Input Delay)
- CLS (Cumulative Layout Shift)

## Referencias

- [Vue Performance](https://vuejs.org/guide/best-practices/performance.html)
- [Vite Optimization](https://vitejs.dev/guide/performance.html)

