# Guía de Testing

## Introducción

Esta guía explica la estrategia de testing para el frontend, aunque actualmente no hay un framework de testing configurado. Esta guía establece las bases para cuando se implemente testing.

## Estrategia de Testing

### Pirámide de Testing

```
        /\
       /  \      E2E Tests (pocos)
      /____\
     /      \    Integration Tests (algunos)
    /________\
   /          \   Unit Tests (muchos)
  /____________\
```

### Prioridades

1. **Unit Tests**: Componentes, stores, composables, utils
2. **Integration Tests**: Features completas, flujos de usuario
3. **E2E Tests**: Flujos críticos end-to-end

## Testing de Componentes

### Setup (Futuro)

```typescript
// test/setup.ts
import { config } from '@vue/test-utils'

config.global.stubs = {
  RouterLink: true,
  RouterView: true
}
```

### Ejemplo: Test de Componente Simple

```typescript
// Component.test.ts
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import MemberCard from '../components/MemberCard.vue'

describe('MemberCard', () => {
  it('renders member name', () => {
    const member = {
      id: '1',
      name: 'Juan Pérez',
      email: 'juan@example.com'
    }
    
    const wrapper = mount(MemberCard, {
      props: { member }
    })
    
    expect(wrapper.text()).toContain('Juan Pérez')
  })
  
  it('emits edit event on button click', async () => {
    const member = { id: '1', name: 'Juan' }
    const wrapper = mount(MemberCard, {
      props: { member }
    })
    
    await wrapper.find('button').trigger('click')
    
    expect(wrapper.emitted('edit')).toBeTruthy()
    expect(wrapper.emitted('edit')[0]).toEqual(['1'])
  })
})
```

## Testing de Stores

### Ejemplo: Test de Store

```typescript
// stores/members.test.ts
import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach } from 'vitest'
import { useMembersStore } from './members'
import { membersApi } from '@/api/members.api'

// Mock API
vi.mock('@/api/members.api', () => ({
  membersApi: {
    getMembers: vi.fn()
  }
}))

describe('Members Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('fetches members', async () => {
    const mockMembers = [
      { id: '1', name: 'Juan' }
    ]
    
    vi.mocked(membersApi.getMembers).mockResolvedValue(mockMembers)
    
    const store = useMembersStore()
    await store.fetchMembers()
    
    expect(store.members).toEqual(mockMembers)
    expect(store.loading).toBe(false)
  })
  
  it('handles errors', async () => {
    vi.mocked(membersApi.getMembers).mockRejectedValue(new Error('API Error'))
    
    const store = useMembersStore()
    await store.fetchMembers()
    
    expect(store.error).toBeTruthy()
    expect(store.members).toEqual([])
  })
})
```

## Testing de Composables

### Ejemplo: Test de Composable

```typescript
// composables/useApi.test.ts
import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/vue'
import { useApi } from './useApi'

describe('useApi', () => {
  it('executes API call and updates state', async () => {
    const mockApiCall = vi.fn().mockResolvedValue({ data: 'test' })
    
    const { result } = renderHook(() => useApi())
    
    await result.current.execute(mockApiCall)
    
    expect(result.current.data.value).toEqual({ data: 'test' })
    expect(result.current.loading.value).toBe(false)
    expect(result.current.error.value).toBeNull()
  })
  
  it('handles errors', async () => {
    const mockApiCall = vi.fn().mockRejectedValue(new Error('API Error'))
    
    const { result } = renderHook(() => useApi())
    
    await result.current.execute(mockApiCall)
    
    expect(result.current.error.value).toBeTruthy()
    expect(result.current.loading.value).toBe(false)
  })
})
```

## Testing de Utils

### Ejemplo: Test de Utilidad

```typescript
// utils/formatters.test.ts
import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate } from './formatters'

describe('formatters', () => {
  describe('formatCurrency', () => {
    it('formats number as currency', () => {
      expect(formatCurrency(1000000)).toBe('$1.000.000')
    })
    
    it('handles zero', () => {
      expect(formatCurrency(0)).toBe('$0')
    })
  })
  
  describe('formatDate', () => {
    it('formats date string', () => {
      const date = '2024-01-15T10:30:00Z'
      expect(formatDate(date)).toMatch(/15\/01\/2024/)
    })
  })
})
```

## Mocks y Fixtures

### Fixtures de Datos

```typescript
// test/fixtures/members.ts
export const mockMember = {
  id: '1',
  name: 'Juan Pérez',
  email: 'juan@example.com',
  status: 'active',
  created_at: '2024-01-15T10:30:00Z'
}

export const mockMembers = [
  mockMember,
  {
    id: '2',
    name: 'María García',
    email: 'maria@example.com',
    status: 'active',
    created_at: '2024-02-20T14:20:00Z'
  }
]
```

### Mock de API

```typescript
// test/mocks/api.ts
import { vi } from 'vitest'

export const mockMembersApi = {
  getMembers: vi.fn(),
  getMemberById: vi.fn(),
  createMember: vi.fn()
}
```

## Best Practices

### 1. Testear Comportamiento, No Implementación

```typescript
// ✅ Bueno - Testea comportamiento
expect(wrapper.text()).toContain('Juan Pérez')

// ❌ Evitar - Testea implementación
expect(wrapper.vm.member.name).toBe('Juan Pérez')
```

### 2. Usar Datos Realistas

```typescript
// ✅ Bueno
const member = {
  id: '1',
  name: 'Juan Pérez',
  email: 'juan@example.com'
}

// ❌ Evitar
const member = { id: '1', name: 'Test' }
```

### 3. Aislar Tests

```typescript
// ✅ Bueno - Cada test es independiente
beforeEach(() => {
  setActivePinia(createPinia())
})

// ❌ Evitar - Tests dependen unos de otros
```

### 4. Nombrar Tests Descriptivamente

```typescript
// ✅ Bueno
it('displays error message when API call fails', () => { })

// ❌ Evitar
it('test error', () => { })
```

## Cobertura de Testing

### Objetivos de Cobertura

- **Componentes críticos**: 80%+
- **Stores**: 80%+
- **Utils**: 90%+
- **Composables**: 80%+

### Verificar Cobertura

```bash
npm run test:coverage
```

## Testing Manual

Mientras no hay tests automatizados:

### Checklist de Testing Manual

- [ ] Componente renderiza correctamente
- [ ] Props funcionan como se espera
- [ ] Eventos se emiten correctamente
- [ ] Estados de loading/error se muestran
- [ ] Navegación funciona
- [ ] Formularios validan correctamente
- [ ] Responsive funciona en diferentes tamaños
- [ ] No hay errores en consola

## Referencias

- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Vitest](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)

