# Guía de Componentes

## Introducción

Esta guía explica cómo crear, estructurar y usar componentes Vue en el proyecto. Cubre componentes compartidos, específicos de features, y mejores prácticas.

## Tipos de Componentes

### 1. Componentes Compartidos (`src/shared/components/`)

Componentes reutilizables usados en múltiples features.

**Características:**
- Sin dependencias de features específicas
- Altamente configurables
- Documentados y tipados
- Ejemplos: `DataTable`, `Modal`, `LoadingSpinner`

### 2. Componentes de Feature (`src/features/*/components/`)

Componentes específicos de un dominio de negocio.

**Características:**
- Usados solo en su feature
- Pueden depender de stores de su feature
- Encapsulan lógica específica del dominio
- Ejemplos: `MemberForm`, `LoanCard`

### 3. Componentes de Layout (`src/shared/layout/`)

Componentes de estructura de la aplicación.

**Características:**
- Estructura general de la app
- Ejemplos: `AppSidebar`, `AppHeader`

## Estructura de un Componente

### Template Básico

```vue
<template>
  <!-- HTML aquí -->
</template>

<script setup lang="ts">
// 1. Imports
// 2. Props y emits
// 3. Composables
// 4. State
// 5. Computed
// 6. Methods
// 7. Lifecycle
</script>

<style scoped>
/* Estilos aquí */
</style>
```

## Crear un Componente Compartido

### Ejemplo: Button Component

```vue
<!-- src/shared/components/Button.vue -->
<template>
  <button
    :class="buttonClasses"
    :disabled="disabled"
    @click="handleClick"
  >
    <component v-if="icon" :is="icon" class="w-5 h-5 mr-2" />
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'

// Props
const props = withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  icon?: Component
}>(), {
  variant: 'primary',
  size: 'md',
  disabled: false
})

// Emits
const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

// Computed
const buttonClasses = computed(() => {
  const base = 'btn'
  const variant = `btn-${props.variant}`
  const size = `btn-${props.size}`
  return `${base} ${variant} ${size}`
})

// Methods
function handleClick(event: MouseEvent) {
  if (!props.disabled) {
    emit('click', event)
  }
}
</script>
```

**Uso:**
```vue
<Button variant="primary" size="lg" @click="handleSubmit">
  Enviar
</Button>
```

## Crear un Componente de Feature

### Ejemplo: MemberCard

```vue
<!-- src/features/members/components/MemberCard.vue -->
<template>
  <div class="card bg-base-100 shadow-lg">
    <div class="card-body">
      <h2 class="card-title">{{ member.name }}</h2>
      <p class="text-sm text-base-content/60">{{ member.email }}</p>
      
      <div class="card-actions justify-end mt-4">
        <button @click="handleView" class="btn btn-sm btn-primary">
          Ver
        </button>
        <button @click="handleEdit" class="btn btn-sm btn-secondary">
          Editar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Member } from '../types'

// Props
const props = defineProps<{
  member: Member
}>()

// Emits
const emit = defineEmits<{
  view: [id: string]
  edit: [id: string]
}>()

// Methods
function handleView() {
  emit('view', props.member.id)
}

function handleEdit() {
  emit('edit', props.member.id)
}
</script>
```

## Props y Emits

### Props con Defaults

```typescript
const props = withDefaults(defineProps<{
  title: string
  description?: string
  count?: number
}>(), {
  description: '',
  count: 0
})
```

### Emits Tipados

```typescript
const emit = defineEmits<{
  submit: [data: FormData]
  cancel: []
  update: [id: string, value: string]
}>()

// Uso
emit('submit', formData)
emit('cancel')
emit('update', '123', 'new value')
```

## Slots

### Slot Simple

```vue
<template>
  <div class="card">
    <div class="card-body">
      <slot />
    </div>
  </div>
</template>

<!-- Uso -->
<Card>
  <p>Contenido aquí</p>
</Card>
```

### Slots Nombrados

```vue
<template>
  <div class="modal">
    <div class="modal-header">
      <slot name="header">
        <h2>Título por defecto</h2>
      </slot>
    </div>
    <div class="modal-body">
      <slot name="body" />
    </div>
    <div class="modal-footer">
      <slot name="footer">
        <button class="btn">Cerrar</button>
      </slot>
    </div>
  </div>
</template>

<!-- Uso -->
<Modal>
  <template #header>
    <h2>Título Personalizado</h2>
  </template>
  <template #body>
    <p>Contenido del modal</p>
  </template>
</Modal>
```

### Scoped Slots

```vue
<template>
  <div>
    <div v-for="item in items" :key="item.id">
      <slot :item="item" :index="index" />
    </div>
  </div>
</template>

<!-- Uso -->
<ItemList :items="members">
  <template #default="{ item, index }">
    <div>{{ index }}: {{ item.name }}</div>
  </template>
</ItemList>
```

## Componentes con Estado vs Sin Estado

### Componente Sin Estado (Presentacional)

```vue
<template>
  <div class="stat-card">
    <h3>{{ title }}</h3>
    <p class="value">{{ value }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  value: string | number
}>()
</script>
```

**Características:**
- Solo recibe props
- No tiene estado interno
- No hace llamadas a API
- Fácil de testear

### Componente con Estado (Contenedor)

```vue
<template>
  <div>
    <LoadingSpinner :loading="loading" />
    <MemberList v-if="members" :members="members" />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useMemberStore } from '../stores/members'

const store = useMemberStore()
const loading = computed(() => store.loading)
const members = computed(() => store.members)

onMounted(() => {
  store.fetchMembers()
})
</script>
```

**Características:**
- Tiene estado interno o usa stores
- Puede hacer llamadas a API
- Orquesta otros componentes
- Más complejo

**Recomendación**: Preferir componentes sin estado cuando sea posible.

## Composables en Componentes

```vue
<script setup lang="ts">
import { useApi } from '@/shared/composables/useApi'
import { membersApi } from '@/api/members.api'

const { data, loading, error, execute } = useApi(() => 
  membersApi.getMembers()
)

onMounted(() => {
  execute()
})
</script>
```

## Estilos

### Scoped Styles

```vue
<style scoped>
.card {
  padding: 1rem;
}

.card-title {
  font-size: 1.5rem;
}
</style>
```

### Usando Tailwind (Recomendado)

```vue
<template>
  <div class="card bg-base-100 shadow-lg p-4">
    <h2 class="text-2xl font-bold mb-2">{{ title }}</h2>
  </div>
</template>
```

### Clases Dinámicas

```vue
<template>
  <div :class="[
    'card',
    {
      'bg-primary': isPrimary,
      'bg-secondary': !isPrimary
    }
  ]">
    <!-- ... -->
  </div>
</template>

<script setup lang="ts">
const isPrimary = computed(() => /* ... */)
</script>
```

## Validación de Props

### Runtime Validation (Opcional)

```typescript
import { PropType } from 'vue'

defineProps({
  status: {
    type: String as PropType<'active' | 'inactive'>,
    required: true,
    validator: (value: string) => ['active', 'inactive'].includes(value)
  }
})
```

**Nota**: Con TypeScript, la validación de tipos se hace en compile-time. La validación runtime es opcional.

## Componentes Reutilizables Comunes

### DataTable

```vue
<DataTable :data="members" :columns="columns">
  <template #actions="{ item }">
    <button @click="edit(item.id)">Editar</button>
  </template>
</DataTable>
```

### Modal

```vue
<Modal :show="isOpen" title="Editar Miembro" @close="isOpen = false">
  <MemberForm :member="selectedMember" @submit="handleSubmit" />
</Modal>
```

### LoadingSpinner

```vue
<LoadingSpinner :loading="isLoading" message="Cargando datos..." />
```

## Best Practices

### 1. Props Inmutables

```typescript
// ✅ Bueno - Props son readonly
const props = defineProps<{ member: Member }>()
// props.member.name = 'New' // Error en TypeScript

// ✅ Bueno - Crear copia si necesitas modificar
const localMember = ref({ ...props.member })
```

### 2. Eventos Descriptivos

```typescript
// ✅ Bueno
emit('member-selected', memberId)
emit('form-submitted', formData)

// ❌ Evitar
emit('click', data) // Muy genérico
```

### 3. Un Componente, Una Responsabilidad

```vue
<!-- ✅ Bueno - Componente enfocado -->
<MemberCard :member="member" />

<!-- ❌ Evitar - Demasiadas responsabilidades -->
<MemberCardWithFormAndListAndChart />
```

### 4. Usar Composables para Lógica Compleja

```typescript
// ✅ Bueno - Lógica extraída a composable
const { items, loading, fetchItems } = useMemberList()

// ❌ Evitar - Lógica compleja en componente
// 50 líneas de lógica en <script setup>
```

### 5. Documentar Props Complejas

```typescript
/**
 * Componente para mostrar información de un miembro
 * 
 * @example
 * <MemberCard 
 *   :member="{ id: '1', name: 'Juan' }"
 *   @view="handleView"
 * />
 */
defineProps<{
  member: Member
}>()
```

## Anti-Patrones

### ❌ Evitar: Props Mutables

```vue
<!-- ❌ Malo -->
<script setup>
const props = defineProps<{ count: number }>()
props.count++ // Error
</script>

<!-- ✅ Bueno -->
<script setup>
const props = defineProps<{ count: number }>()
const localCount = ref(props.count)
localCount.value++
</script>
```

### ❌ Evitar: Lógica en Template

```vue
<!-- ❌ Malo -->
<template>
  <div>{{ items.filter(i => i.active).length }}</div>
</template>

<!-- ✅ Bueno -->
<template>
  <div>{{ activeCount }}</div>
</template>

<script setup>
const activeCount = computed(() => 
  items.value.filter(i => i.active).length
)
</script>
```

### ❌ Evitar: Componentes Demasiado Grandes

```vue
<!-- ❌ Malo - 500+ líneas -->
<!-- ✅ Bueno - Dividir en componentes más pequeños -->
```

## Testing de Componentes

Ver [TESTING_GUIDE.md](./TESTING_GUIDE.md) para detalles completos.

**Resumen:**
- Testear props y eventos
- Testear slots
- Testear estados (loading, error)
- Usar Vue Test Utils

## Referencias

- [Vue 3 Components](https://vuejs.org/guide/essentials/component-basics.html)
- [Convenciones de Código](./CODING_CONVENTIONS.md)
- [Guía de Features](./FEATURES_GUIDE.md)

