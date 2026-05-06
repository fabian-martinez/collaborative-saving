# Guía de Routing

## Introducción

Esta guía explica cómo configurar y usar Vue Router en el proyecto, incluyendo lazy loading, parámetros y navegación.

## Configuración de Rutas

### Estructura Básica

```typescript
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/features/dashboard/views/DashboardView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
```

## Lazy Loading

### ✅ Siempre Usar Lazy Loading

```typescript
// ✅ Bueno - Lazy loading
{
  path: '/members',
  name: 'members',
  component: () => import('@/features/members/views/MembersView.vue')
}

// ❌ Evitar - Import directo
import MembersView from '@/features/members/views/MembersView.vue'
{
  path: '/members',
  component: MembersView
}
```

**Beneficios:**
- Code splitting automático
- Mejor performance inicial
- Carga solo lo necesario

## Tipos de Rutas

### Ruta Simple

```typescript
{
  path: '/members',
  name: 'members',
  component: () => import('@/features/members/views/MembersView.vue')
}
```

### Ruta con Parámetros

```typescript
{
  path: '/members/:id',
  name: 'member-detail',
  component: () => import('@/features/members/views/MemberDetailView.vue')
}
```

### Ruta con Query Params

```typescript
{
  path: '/members',
  name: 'members',
  component: () => import('@/features/members/views/MembersView.vue')
  // Query: /members?status=active&page=1
}
```

### Ruta con Meta

```typescript
{
  path: '/admin',
  name: 'admin',
  component: () => import('@/features/admin/views/AdminView.vue'),
  meta: {
    requiresAuth: true,
    title: 'Administración'
  }
}
```

## Acceder a Parámetros y Queries

### En Componentes

```vue
<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

// Parámetros de ruta
const memberId = computed(() => route.params.id as string)

// Query parameters
const status = computed(() => route.query.status as string)
const page = computed(() => Number(route.query.page) || 1)
</script>
```

### En Stores

```typescript
import { useRoute } from 'vue-router'

export const useMemberDetailStore = defineStore('memberDetail', () => {
  const route = useRoute()
  const memberId = computed(() => route.params.id as string)
  
  async function fetchMember() {
    if (memberId.value) {
      await fetchMemberById(memberId.value)
    }
  }
  
  return { memberId, fetchMember }
})
```

## Navegación

### Navegación Declarativa

```vue
<template>
  <router-link to="/members">Miembros</router-link>
  <router-link :to="{ name: 'member-detail', params: { id: '123' } }">
    Ver Miembro
  </router-link>
</template>
```

### Navegación Programática

```typescript
import { useRouter } from 'vue-router'

const router = useRouter()

// Navegar a ruta
router.push('/members')
router.push({ name: 'members' })
router.push({ name: 'member-detail', params: { id: '123' } })

// Navegar con query
router.push({
  name: 'members',
  query: { status: 'active', page: '1' }
})

// Reemplazar (sin historial)
router.replace('/members')

// Ir atrás/adelante
router.back()
router.forward()
router.go(-1) // Ir atrás 1 página
```

### Navegación desde Stores

```typescript
import { useRouter } from 'vue-router'

export const useMemberStore = defineStore('members', () => {
  const router = useRouter()
  
  async function createMember(data: CreateMemberRequest) {
    const newMember = await membersApi.createMember(data)
    router.push({ name: 'member-detail', params: { id: newMember.id } })
    return newMember
  }
  
  return { createMember }
})
```

## Route Guards

### Before Each (Global)

```typescript
router.beforeEach((to, from, next) => {
  // Lógica antes de cada navegación
  if (to.meta.requiresAuth && !isAuthenticated()) {
    next({ name: 'login' })
  } else {
    next()
  }
})
```

### Before Enter (Por Ruta)

```typescript
{
  path: '/admin',
  component: () => import('@/features/admin/views/AdminView.vue'),
  beforeEnter: (to, from, next) => {
    if (hasAdminAccess()) {
      next()
    } else {
      next({ name: 'dashboard' })
    }
  }
}
```

## Organización de Rutas

### Por Feature

```typescript
const routes: RouteRecordRaw[] = [
  // Dashboard
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/features/dashboard/views/DashboardView.vue')
  },
  
  // Members
  {
    path: '/members',
    name: 'members',
    component: () => import('@/features/members/views/MembersView.vue')
  },
  {
    path: '/members/:id',
    name: 'member-detail',
    component: () => import('@/features/members/views/MemberDetailView.vue')
  },
  
  // Meetings
  {
    path: '/meetings',
    name: 'meetings',
    component: () => import('@/features/meetings/views/MeetingsView.vue')
  }
]
```

### Rutas Anidadas (Opcional)

```typescript
{
  path: '/members',
  component: () => import('@/features/members/views/MembersLayout.vue'),
  children: [
    {
      path: '',
      name: 'members',
      component: () => import('@/features/members/views/MembersView.vue')
    },
    {
      path: ':id',
      name: 'member-detail',
      component: () => import('@/features/members/views/MemberDetailView.vue')
    }
  ]
}
```

## Best Practices

### 1. Nombres de Rutas Consistentes

```typescript
// ✅ Bueno - Nombres descriptivos
'members'
'member-detail'
'meetings'
'active-meeting'

// ❌ Evitar - Nombres genéricos
'page1'
'view'
'detail'
```

### 2. Lazy Loading Siempre

```typescript
// ✅ Siempre
component: () => import('@/features/...')

// ❌ Nunca
import View from '@/features/...'
component: View
```

### 3. Usar Nombres en Lugar de Paths

```typescript
// ✅ Bueno - Más mantenible
router.push({ name: 'member-detail', params: { id: '123' } })

// ⚠️ Funciona pero menos mantenible
router.push('/members/123')
```

### 4. Validar Parámetros

```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

onMounted(() => {
  const id = route.params.id as string
  if (!id || !isValidId(id)) {
    router.push({ name: 'members' })
    return
  }
  // Cargar datos
})
</script>
```

## Ejemplos Completos

### Feature Completa con Rutas

```typescript
// Members feature routes
{
  path: '/members',
  name: 'members',
  component: () => import('@/features/members/views/MembersView.vue'),
  meta: { title: 'Miembros' }
},
{
  path: '/members/new',
  name: 'member-create',
  component: () => import('@/features/members/views/MemberCreateView.vue'),
  meta: { title: 'Nuevo Miembro' }
},
{
  path: '/members/:id',
  name: 'member-detail',
  component: () => import('@/features/members/views/MemberDetailView.vue'),
  meta: { title: 'Detalle del Miembro' }
},
{
  path: '/members/:id/edit',
  name: 'member-edit',
  component: () => import('@/features/members/views/MemberEditView.vue'),
  meta: { title: 'Editar Miembro' }
}
```

## Referencias

- [Vue Router Documentation](https://router.vuejs.org/)
- [Guía de Features](./FEATURES_GUIDE.md)

