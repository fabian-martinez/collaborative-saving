# Guía de Routing

## Configuración

```typescript
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/dashboard' },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/features/dashboard/views/DashboardView.vue')
  }
]

const router = createRouter({ history: createWebHistory(), routes })
export default router
```

## Lazy Loading

**Siempre** usar lazy loading para code splitting automático:

```typescript
// ✅ Siempre
component: () => import('@/features/items/views/ItemsView.vue')

// ❌ Nunca
import ItemsView from '@/features/items/views/ItemsView.vue'
component: ItemsView
```

## Tipos de Rutas

```typescript
// Simple
{ path: '/items', name: 'items', component: () => import('...') }

// Con parámetros
{ path: '/items/:id', name: 'item-detail', component: () => import('...') }

// Con meta
{ path: '/admin', name: 'admin', component: () => import('...'), meta: { requiresAuth: true, title: 'Admin' } }
```

Query params no requieren configuración especial: `/items?status=active&page=1`.

## Acceder a Parámetros

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const itemId = computed(() => route.params.id as string)
const status = computed(() => route.query.status as string)
const page = computed(() => Number(route.query.page) || 1)
</script>
```

## Navegación

```typescript
import { useRouter } from 'vue-router'
const router = useRouter()

// Por nombre (preferido)
router.push({ name: 'item-detail', params: { id: '123' } })
router.push({ name: 'items', query: { status: 'active' } })

// Reemplazar (sin historial)
router.replace('/items')

// Historial
router.back()
router.go(-1)
```

```vue
<!-- Declarativa -->
<router-link :to="{ name: 'item-detail', params: { id: '123' } }">Ver Item</router-link>
```

## Route Guards

```typescript
// Global
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    next({ name: 'login' })
  } else {
    next()
  }
})

// Por ruta
{
  path: '/admin',
  component: () => import('...'),
  beforeEnter: (to, from, next) => {
    hasAdminAccess() ? next() : next({ name: 'dashboard' })
  }
}
```

## Organización de Rutas

Agrupar por feature con lazy loading:

```typescript
const routes: RouteRecordRaw[] = [
  // Dashboard
  { path: '/dashboard', name: 'dashboard', component: () => import('@/features/dashboard/views/DashboardView.vue') },

  // Items
  { path: '/items', name: 'items', component: () => import('@/features/items/views/ItemsView.vue') },
  { path: '/items/:id', name: 'item-detail', component: () => import('@/features/items/views/ItemDetailView.vue') },
]
```

## Reglas

- **Nombres descriptivos**: `items`, `item-detail` — no `page1`, `view`
- **Siempre lazy loading**
- **Navegar por nombre**, no por path (más mantenible)
- **Validar parámetros** antes de usarlos

## Referencias

- [Vue Router](https://router.vuejs.org/)
- [Guía de Features](./FEATURES_GUIDE.md)
