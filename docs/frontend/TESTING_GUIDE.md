# Guía de Testing

## Estrategia

```
     /\        E2E (pocos — flujos críticos)
    /  \
   /____\      Integration (algunos — features completas)
  /______\
 /________\    Unit (muchos — componentes, stores, utils)
```

Framework: **Vitest** + **Vue Test Utils**.

## Testing de Componentes

```typescript
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import ItemCard from '../components/ItemCard.vue'

describe('ItemCard', () => {
  const item = { id: '1', name: 'Item Test', email: 'test@example.com' }

  it('renders item name', () => {
    const wrapper = mount(ItemCard, { props: { item } })
    expect(wrapper.text()).toContain('Item Test')
  })

  it('emits edit event on click', async () => {
    const wrapper = mount(ItemCard, { props: { item } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('edit')).toBeTruthy()
    expect(wrapper.emitted('edit')![0]).toEqual(['1'])
  })
})
```

## Testing de Stores

```typescript
import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useItemStore } from './items'
import { itemsApi } from '@/api/items.api'

vi.mock('@/api/items.api', () => ({
  itemsApi: { getItems: vi.fn() }
}))

describe('Item Store', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('fetches items', async () => {
    vi.mocked(itemsApi.getItems).mockResolvedValue([{ id: '1', name: 'Test' }])
    const store = useItemStore()
    await store.fetchItems()
    expect(store.items).toHaveLength(1)
    expect(store.loading).toBe(false)
  })

  it('handles errors', async () => {
    vi.mocked(itemsApi.getItems).mockRejectedValue(new Error('API Error'))
    const store = useItemStore()
    await store.fetchItems()
    expect(store.error).toBeTruthy()
    expect(store.items).toEqual([])
  })
})
```

## Testing de Utils

```typescript
import { describe, it, expect } from 'vitest'
import { formatCurrency } from './formatters'

describe('formatCurrency', () => {
  it('formats number', () => expect(formatCurrency(1000000)).toBe('$1.000.000'))
  it('handles zero', () => expect(formatCurrency(0)).toBe('$0'))
})
```

## Fixtures y Mocks

```typescript
// test/fixtures/items.ts
export const mockItem = { id: '1', name: 'Item Test', status: 'active', created_at: '2024-01-15T10:30:00Z' }
export const mockItems = [mockItem, { id: '2', name: 'Item 2', status: 'active', created_at: '2024-02-20T14:20:00Z' }]
```

## Reglas

- Testear **comportamiento**, no implementación: `expect(wrapper.text()).toContain(...)` no `expect(wrapper.vm.prop)`
- **Aislar** tests: `beforeEach(() => setActivePinia(createPinia()))`
- Nombres **descriptivos**: `'displays error when API fails'` no `'test error'`
- Datos **realistas** en fixtures

### Cobertura Objetivo

| Capa | Objetivo |
|---|---|
| Utils | 90%+ |
| Stores | 80%+ |
| Componentes críticos | 80%+ |
| Composables | 80%+ |

## Testing Manual (mientras no hay tests automatizados)

- [ ] Componente renderiza correctamente
- [ ] Estados loading/error/empty se muestran
- [ ] Navegación funciona
- [ ] Formularios validan correctamente
- [ ] Responsive en diferentes tamaños
- [ ] Sin errores en consola

## Referencias

- [Vitest](https://vitest.dev/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
