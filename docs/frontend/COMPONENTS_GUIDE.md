# Guía de Componentes

## Tipos de Componentes

| Tipo | Ubicación | Características |
|---|---|---|
| **Shared** | `src/shared/components/` | Sin dependencias de features, configurables, reutilizables |
| **Feature** | `src/features/*/components/` | Específicos de un dominio, pueden usar stores de su feature |
| **Layout** | `src/shared/layout/` | Estructura de la app (`AppSidebar`, `AppHeader`) |

## Estructura de un Componente

```vue
<template>
  <!-- HTML -->
</template>

<script setup lang="ts">
// 1. Imports → 2. Props/emits → 3. Composables → 4. State → 5. Computed → 6. Methods → 7. Lifecycle
</script>

<style scoped>
/* Estilos con Tailwind preferido */
</style>
```

> Ver [Convenciones de Código](./CODING_CONVENTIONS.md) para el orden detallado.

## Componente Shared (Ejemplo)

```vue
<!-- src/shared/components/ActionButton.vue -->
<template>
  <button :class="['btn', `btn-${variant}`, `btn-${size}`]" :disabled="disabled" @click="emit('click', $event)">
    <component v-if="icon" :is="icon" class="w-5 h-5 mr-2" />
    <slot />
  </button>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

const props = withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  icon?: Component
}>(), { variant: 'primary', size: 'md', disabled: false })

const emit = defineEmits<{ click: [event: MouseEvent] }>()
</script>
```

## Componente de Feature (Ejemplo)

```vue
<!-- src/features/items/components/ItemCard.vue -->
<template>
  <div class="card bg-base-100 shadow-lg">
    <div class="card-body">
      <h2 class="card-title">{{ item.name }}</h2>
      <div class="card-actions justify-end mt-4">
        <button @click="emit('view', item.id)" class="btn btn-sm btn-primary">Ver</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Item } from '../types'

defineProps<{ item: Item }>()
const emit = defineEmits<{ view: [id: string]; edit: [id: string] }>()
</script>
```

## Props y Emits

```typescript
// Props con defaults
const props = withDefaults(defineProps<{
  title: string
  count?: number
}>(), { count: 0 })

// Emits tipados
const emit = defineEmits<{
  submit: [data: FormData]
  cancel: []
}>()
```

## Slots

```vue
<!-- Slot simple -->
<div class="card"><div class="card-body"><slot /></div></div>

<!-- Slots nombrados -->
<div class="modal">
  <div class="modal-header"><slot name="header"><h2>Título</h2></slot></div>
  <div class="modal-body"><slot name="body" /></div>
</div>

<!-- Uso -->
<Modal>
  <template #header><h2>Personalizado</h2></template>
  <template #body><p>Contenido</p></template>
</Modal>
```

## Componentes con Estado vs Sin Estado

**Sin estado (presentacional)** — solo recibe props, fácil de testear:
```vue
<script setup lang="ts">
defineProps<{ title: string; value: string | number }>()
</script>
```

**Con estado (contenedor)** — usa stores, hace llamadas API, orquesta otros componentes:
```vue
<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useItemStore } from '../stores/items'

const store = useItemStore()
onMounted(() => store.fetchItems())
</script>
```

**Preferir componentes sin estado cuando sea posible.**

## Componentes Comunes (Shared)

```vue
<!-- DataTable -->
<DataTable :data="items" :columns="columns">
  <template #actions="{ item }"><button @click="edit(item.id)">Editar</button></template>
</DataTable>

<!-- Modal -->
<Modal :show="isOpen" title="Editar" @close="isOpen = false">
  <ItemForm :item="selected" @submit="handleSubmit" />
</Modal>

<!-- LoadingSpinner -->
<LoadingSpinner :loading="isLoading" message="Cargando datos..." />
```

## Reglas

- Props son **readonly**: si necesitas modificar, crea una copia local con `ref(props.value)`.
- Emits deben ser **descriptivos**: `member-selected` en vez de `click`.
- **Una responsabilidad por componente**. Si supera ~200 líneas, dividir.
- **Lógica compleja → composable**: extraer a `useXxx()`.
- **No poner lógica en templates**: usar `computed`.

> Ver [Testing](./TESTING_GUIDE.md) para testing de componentes.

## Referencias

- [Vue 3 Components](https://vuejs.org/guide/essentials/component-basics.html)
- [Convenciones de Código](./CODING_CONVENTIONS.md)
- [Guía de Estilos](./STYLING_GUIDE.md)
