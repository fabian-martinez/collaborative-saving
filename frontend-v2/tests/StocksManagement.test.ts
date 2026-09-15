/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'

import { useStocksStore } from '../src/features/stocks/stores/stocks'
import StockForm from '../src/features/stocks/components/StockForm.vue'
import StocksView from '../src/features/stocks/views/StocksView.vue'
import StockDetailView from '../src/features/stocks/views/StockDetailView.vue'
import { stocksApi, type Stock } from '../src/api/stocks.api'
import { settingsApi, type StockType } from '../src/api/settings.api'

/**
 * @vitest-environment jsdom
 */

const mockStockTypes: StockType[] = [
  {
    id: 'st-ord',
    code: 'ordinaria',
    name: 'Acción Ordinaria',
    behavior: 'CAPITAL_APPRECIATION',
    is_guaranteed: false,
    guaranteed_yield: null,
    description: 'Acción común',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'st-pref',
    code: 'preferencial',
    name: 'Acción Preferencial',
    behavior: 'DIVIDEND_YIELD',
    is_guaranteed: true,
    guaranteed_yield: 0.025,
    description: 'Acción preferente con dividendo',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z'
  }
]

const mockStocks: Stock[] = [
  {
    id: 'stock-1',
    name: 'Acción Ahorro Ordinaria',
    type: 'Acción Ahorro Ordinaria',
    stock_type_id: 'st-ord',
    stock_type: mockStockTypes[0],
    value: 100000,
    monthly_contribution: 50000,
    is_guaranteed: false,
    guaranteed_yield: null,
    behavior: 'CAPITAL_APPRECIATION',
    created_at: '2026-01-15T10:00:00.000Z'
  },
  {
    id: 'stock-2',
    name: 'Acción Preferencial Rendimiento',
    type: 'Acción Preferencial Rendimiento',
    stock_type_id: 'st-pref',
    stock_type: mockStockTypes[1],
    value: 250000,
    monthly_contribution: 100000,
    is_guaranteed: true,
    guaranteed_yield: 0.025,
    behavior: 'DIVIDEND_YIELD',
    created_at: '2026-02-01T10:00:00.000Z'
  }
]

describe('useStocksStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
  })

  it('fetches stocks and sets state', async () => {
    vi.spyOn(stocksApi, 'getStocks').mockResolvedValue(mockStocks)

    const store = useStocksStore()
    expect(store.stocks).toEqual([])

    await store.fetchStocks()
    expect(stocksApi.getStocks).toHaveBeenCalledTimes(1)
    expect(store.stocks).toHaveLength(2)
    expect(store.stocks[0].name).toBe('Acción Ahorro Ordinaria')
  })

  it('creates stock and appends to state', async () => {
    const newStock: Stock = {
      id: 'stock-3',
      name: 'Acción Serie C',
      type: 'Acción Serie C',
      stock_type_id: null,
      value: 150000,
      monthly_contribution: 60000,
      is_guaranteed: false,
      guaranteed_yield: null,
      behavior: 'CAPITAL_APPRECIATION',
      created_at: '2026-03-01T10:00:00.000Z'
    }
    vi.spyOn(stocksApi, 'createStock').mockResolvedValue(newStock)

    const store = useStocksStore()
    const result = await store.createStock({
      name: 'Acción Serie C',
      value: 150000,
      monthly_contribution: 60000
    })

    expect(stocksApi.createStock).toHaveBeenCalledTimes(1)
    expect(result).toEqual(newStock)
    expect(store.stocks).toContainEqual(newStock)
  })

  it('updates stock in state', async () => {
    const updatedStock: Stock = {
      ...mockStocks[0],
      name: 'Acción Ahorro Modificada',
      value: 120000
    }
    vi.spyOn(stocksApi, 'updateStock').mockResolvedValue(updatedStock)

    const store = useStocksStore()
    store.stocks = [...mockStocks]

    const result = await store.updateStock('stock-1', {
      name: 'Acción Ahorro Modificada',
      value: 120000
    })

    expect(stocksApi.updateStock).toHaveBeenCalledWith('stock-1', {
      name: 'Acción Ahorro Modificada',
      value: 120000
    })
    expect(result.name).toBe('Acción Ahorro Modificada')
    expect(store.stocks[0].name).toBe('Acción Ahorro Modificada')
  })

  it('deletes stock from state', async () => {
    vi.spyOn(stocksApi, 'deleteStock').mockResolvedValue()

    const store = useStocksStore()
    store.stocks = [...mockStocks]

    await store.deleteStock('stock-1')

    expect(stocksApi.deleteStock).toHaveBeenCalledWith('stock-1')
    expect(store.stocks).toHaveLength(1)
    expect(store.stocks[0].id).toBe('stock-2')
  })
})

describe('StockForm.vue', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.restoreAllMocks()
    vi.spyOn(settingsApi, 'getStockTypes').mockResolvedValue(mockStockTypes)
  })

  it('renders form in create mode and loads stock types', async () => {
    const wrapper = mount(StockForm, {
      props: {
        show: true,
        stock: null
      },
      global: {
        plugins: [pinia]
      }
    })
    await flushPromises()

    expect(settingsApi.getStockTypes).toHaveBeenCalled()
    expect(wrapper.text()).toContain('Nueva Acción')

    const typeSelect = wrapper.find('select[data-testid="stock-type-select"]')
    expect(typeSelect.exists()).toBe(true)
    const options = typeSelect.findAll('option')
    expect(options.length).toBe(3) // 1 placeholder + 2 types
  })

  it('autofills behavior, guaranteed, and yield when stock type is selected', async () => {
    const wrapper = mount(StockForm, {
      props: {
        show: true,
        stock: null
      },
      global: {
        plugins: [pinia]
      }
    })
    await flushPromises()

    const typeSelect = wrapper.find('select[data-testid="stock-type-select"]')
    await typeSelect.setValue('st-pref')
    await typeSelect.trigger('change')

    const behaviorSelect = wrapper.find('select[data-testid="stock-behavior-select"]')
    expect((behaviorSelect.element as HTMLSelectElement).value).toBe('DIVIDEND_YIELD')

    const guaranteedCheckbox = wrapper.find('input[data-testid="stock-guaranteed-checkbox"]')
    expect((guaranteedCheckbox.element as HTMLInputElement).checked).toBe(true)

    const yieldInput = wrapper.find('input[data-testid="stock-yield-input"]')
    expect(yieldInput.exists()).toBe(true)
    expect((yieldInput.element as HTMLInputElement).value).toBe('2.5')
  })

  it('validates required fields and shows error', async () => {
    const wrapper = mount(StockForm, {
      props: {
        show: true,
        stock: null
      },
      global: {
        plugins: [pinia]
      }
    })
    await flushPromises()

    // Submit empty
    const form = wrapper.find('form[data-testid="stock-form"]')
    await form.trigger('submit.prevent')

    expect(wrapper.find('[data-testid="stock-form-error"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('El nombre de la acción es obligatorio')
  })

  it('creates stock on valid submit and emits saved', async () => {
    const store = useStocksStore()
    const createdStock: Stock = {
      id: 'stock-new',
      name: 'Nueva Acción Test',
      type: 'Nueva Acción Test',
      stock_type_id: 'st-ord',
      value: 100000,
      monthly_contribution: 50000,
      is_guaranteed: false,
      guaranteed_yield: null,
      behavior: 'CAPITAL_APPRECIATION',
      created_at: '2026-03-01T00:00:00.000Z'
    }
    vi.spyOn(store, 'createStock').mockResolvedValue(createdStock)

    const wrapper = mount(StockForm, {
      props: {
        show: true,
        stock: null
      },
      global: {
        plugins: [pinia]
      }
    })
    await flushPromises()

    await wrapper.find('input[data-testid="stock-name-input"]').setValue('Nueva Acción Test')
    await wrapper.find('input[data-testid="stock-value-input"]').setValue(100000)
    await wrapper.find('input[data-testid="stock-monthly-contribution-input"]').setValue(50000)
    await wrapper.find('select[data-testid="stock-type-select"]').setValue('st-ord')

    const form = wrapper.find('form[data-testid="stock-form"]')
    await form.trigger('submit.prevent')
    await flushPromises()

    expect(store.createStock).toHaveBeenCalledWith({
      name: 'Nueva Acción Test',
      stock_type_id: 'st-ord',
      value: 100000,
      monthly_contribution: 50000,
      behavior: 'CAPITAL_APPRECIATION',
      is_guaranteed: false,
      guaranteed_yield: null
    })
    expect(wrapper.emitted('saved')).toBeTruthy()
    expect(wrapper.emitted('saved')![0]).toEqual([createdStock])
  })

  it('edits stock and emits saved', async () => {
    const store = useStocksStore()
    const updatedStock: Stock = {
      ...mockStocks[0],
      name: 'Acción Editada'
    }
    vi.spyOn(store, 'updateStock').mockResolvedValue(updatedStock)

    const wrapper = mount(StockForm, {
      props: {
        show: true,
        stock: mockStocks[0]
      },
      global: {
        plugins: [pinia]
      }
    })
    await flushPromises()

    expect(wrapper.text()).toContain('Editar Acción')
    const nameInput = wrapper.find('input[data-testid="stock-name-input"]')
    expect((nameInput.element as HTMLInputElement).value).toBe('Acción Ahorro Ordinaria')

    await nameInput.setValue('Acción Editada')

    const form = wrapper.find('form[data-testid="stock-form"]')
    await form.trigger('submit.prevent')
    await flushPromises()

    expect(store.updateStock).toHaveBeenCalledWith('stock-1', expect.objectContaining({
      name: 'Acción Editada'
    }))
    expect(wrapper.emitted('saved')).toBeTruthy()
  })
})

describe('StocksView.vue', () => {
  let pinia: ReturnType<typeof createPinia>
  let router: ReturnType<typeof createRouter>

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div>Home</div>' } },
        { path: '/stocks', component: { template: '<div>Stocks</div>' } },
        { path: '/stocks/:id', component: { template: '<div>Detail</div>' } }
      ]
    })
    await router.push('/stocks')
    await router.isReady()
    vi.restoreAllMocks()
    vi.spyOn(stocksApi, 'getStocks').mockResolvedValue(mockStocks)
    vi.spyOn(settingsApi, 'getStockTypes').mockResolvedValue(mockStockTypes)
  })

  it('renders list of stocks with name and type', async () => {
    const wrapper = mount(StocksView, {
      global: {
        plugins: [pinia, router],
        stubs: {
          StockForm: true
        }
      }
    })
    await flushPromises()

    expect(stocksApi.getStocks).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('Acciones')
    expect(wrapper.text()).toContain('Acción Ahorro Ordinaria')
    expect(wrapper.text()).toContain('Acción Preferencial Rendimiento')
    expect(wrapper.text()).toContain('Garantizada')
    expect(wrapper.text()).toContain('Variable')
  })

  it('filters stocks with search input', async () => {
    vi.useFakeTimers()
    const wrapper = mount(StocksView, {
      global: {
        plugins: [pinia, router],
        stubs: {
          StockForm: true
        }
      }
    })
    await flushPromises()

    const searchInput = wrapper.find('input[data-testid="stock-search-input"]')
    await searchInput.setValue('Preferencial')
    vi.advanceTimersByTime(350)
    await flushPromises()
    vi.useRealTimers()

    expect(wrapper.text()).toContain('Acción Preferencial Rendimiento')
    expect(wrapper.text()).not.toContain('Acción Ahorro Ordinaria')
  })

  it('opens create modal when clicking Nueva Acción button', async () => {
    const wrapper = mount(StocksView, {
      global: {
        plugins: [pinia, router]
      }
    })
    await flushPromises()

    const createBtn = wrapper.find('button[data-testid="create-stock-btn"]')
    expect(createBtn.exists()).toBe(true)
    await createBtn.trigger('click')

    expect(wrapper.findComponent(StockForm).props('show')).toBe(true)
    expect(wrapper.findComponent(StockForm).props('stock')).toBeNull()
  })

  it('confirms and deletes stock', async () => {
    vi.spyOn(stocksApi, 'deleteStock').mockResolvedValue()

    const wrapper = mount(StocksView, {
      global: {
        plugins: [pinia, router],
        stubs: {
          StockForm: true
        }
      }
    })
    await flushPromises()

    const deleteBtn = wrapper.find('button[data-testid="delete-stock-btn"]')
    await deleteBtn.trigger('click')

    expect(wrapper.text()).toContain('¿Está seguro de que desea eliminar la acción')
    const confirmBtn = wrapper.find('button[data-testid="confirm-delete-stock-btn"]')
    await confirmBtn.trigger('click')
    await flushPromises()

    expect(stocksApi.deleteStock).toHaveBeenCalledWith('stock-1')
  })
})

describe('StockDetailView.vue', () => {
  let pinia: ReturnType<typeof createPinia>
  let router: ReturnType<typeof createRouter>

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/stocks/:id', component: StockDetailView }
      ]
    })
    await router.push('/stocks/stock-1')
    await router.isReady()
    vi.restoreAllMocks()
    vi.spyOn(stocksApi, 'getStockById').mockResolvedValue(mockStocks[0])
    vi.spyOn(settingsApi, 'getStockTypes').mockResolvedValue(mockStockTypes)
  })

  it('renders stock detail and opens edit modal', async () => {
    const wrapper = mount(StockDetailView, {
      global: {
        plugins: [pinia, router],
        stubs: {
          StockForm: true
        }
      }
    })
    await flushPromises()

    expect(stocksApi.getStockById).toHaveBeenCalledWith('stock-1')
    expect(wrapper.text()).toContain('Detalle de Acción')
    expect(wrapper.text()).toContain('Acción Ahorro Ordinaria')
    expect(wrapper.text()).toContain('Acción Ordinaria')

    const editBtn = wrapper.find('button[data-testid="edit-stock-detail-btn"]')
    expect(editBtn.exists()).toBe(true)
    await editBtn.trigger('click')

    expect(wrapper.findComponent({ name: 'StockForm' }).props('show')).toBe(true)
  })
})
