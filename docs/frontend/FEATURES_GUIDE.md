# Guía de Features

Una feature es un módulo autocontenido que representa un dominio de negocio. Agrupa vistas, componentes, stores y opcionalmente API clients y tipos.

## Estructura

> Ver [Estructura de Carpetas](./FOLDER_STRUCTURE.md) para convenciones detalladas.

```
feature-name/
├── api/                    # (opcional)
│   └── featureName.api.ts
├── components/
│   └── FeatureCard.vue
├── stores/
│   └── featureName.ts
├── views/
│   └── FeatureNameView.vue
└── types.ts                # (opcional)
```

## Paso a Paso

### 1. Crear carpetas

```bash
mkdir -p src/features/my-feature/{components,stores,views}
```

### 2. Crear el Store

> Ver [Guía de Stores](./STORES_GUIDE.md) para el patrón completo.

```typescript
// src/features/my-feature/stores/myFeature.ts
export const useMyFeatureStore = defineStore('myFeature', () => {
  const items = ref<Item[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchItems() { /* patrón estándar de loading/error/try-catch */ }
  const hasItems = computed(() => items.value.length > 0)

  return { items, loading, error, fetchItems, hasItems }
})
```

### 3. Crear la Vista Principal

```vue
<!-- src/features/my-feature/views/MyFeatureView.vue -->
<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">Mi Feature</h1>

    <LoadingSpinner :loading="store.loading" />
    <ErrorMessage :error="store.error" />

    <div v-if="store.hasItems" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <FeatureCard v-for="item in store.items" :key="item.id" :item="item" />
    </div>

    <p v-else-if="!store.loading" class="text-center text-base-content/60 py-12">
      No hay items disponibles
    </p>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useMyFeatureStore } from '../stores/myFeature'
import FeatureCard from '../components/FeatureCard.vue'
import LoadingSpinner from '@/shared/components/LoadingSpinner.vue'
import ErrorMessage from '@/shared/components/ErrorMessage.vue'

const store = useMyFeatureStore()
onMounted(() => store.fetchItems())
</script>
```

### 4. Crear componentes específicos

> Ver [Guía de Componentes](./COMPONENTS_GUIDE.md) para patrones de props, emits y slots.

### 5. Agregar rutas

> Ver [Guía de Routing](./ROUTING_GUIDE.md).

```typescript
// src/router/index.ts
{ path: '/my-feature', name: 'my-feature', component: () => import('@/features/my-feature/views/MyFeatureView.vue') }
```

### 6. Agregar mocks (si aplica)

> Ver [Guía de API](./API_GUIDE.md#sistema-de-mocks).

## Reglas

- **Store**: lógica de negocio y estado. **View**: orquestación y presentación. **Components**: UI.
- Usar componentes de `src/shared/components/` cuando sea posible.
- Tipar todo con TypeScript.
- Siempre incluir estados de loading, error y vacío.

## Checklist

- [ ] Store con state, actions y getters
- [ ] Vista principal con loading/error/empty states
- [ ] Rutas con lazy loading
- [ ] Tipos TypeScript definidos
- [ ] Mocks agregados (si aplica)
- [ ] Componentes compartidos reutilizados

## Referencias

- [Estructura de Carpetas](./FOLDER_STRUCTURE.md)
- [Stores](./STORES_GUIDE.md)
- [Componentes](./COMPONENTS_GUIDE.md)
- [API](./API_GUIDE.md)
- [Checklist](./IMPLEMENTATION_CHECKLIST.md)
