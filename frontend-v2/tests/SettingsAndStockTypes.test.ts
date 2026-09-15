/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import SettingsView from '../src/features/settings/views/SettingsView.vue'
import StockTypeManagement from '../src/features/settings/components/StockTypeManagement.vue'
import { settingsApi, type StockType } from '../src/api/settings.api'

/**
 * @vitest-environment jsdom
 */

describe('SettingsView.vue - StockType Tab', () => {
  it('renders settings view and switches to StockTypeManagement tab', async () => {
    const wrapper = mount(SettingsView, {
      global: {
        stubs: {
          LoanTypeManagement: true,
          StockTypeManagement: true
        }
      }
    })

    const buttons = wrapper.findAll('button.tab')
    expect(buttons).toHaveLength(4)

    // Click Stock Types tab (index 1)
    await buttons[1].trigger('click')
    expect(buttons[1].classes()).toContain('tab-active')
    expect(wrapper.findComponent({ name: 'StockTypeManagement' }).exists()).toBe(true)
  })
})

describe('StockTypeManagement.vue', () => {
  const mockStockTypes: StockType[] = [
    {
      id: 'st-1',
      code: 'ordinaria',
      name: 'Acción Ordinaria',
      behavior: 'CAPITAL_APPRECIATION',
      is_guaranteed: false,
      guaranteed_yield: null,
      description: 'Acción común estándar',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'st-2',
      code: 'preferencial',
      name: 'Acción Preferencial',
      behavior: 'DIVIDEND_YIELD',
      is_guaranteed: true,
      guaranteed_yield: 0.02,
      description: 'Acción con dividendo fijo garantizado',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z'
    }
  ]

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('fetches and displays stock types correctly', async () => {
    vi.spyOn(settingsApi, 'getStockTypes').mockResolvedValue(mockStockTypes)

    const wrapper = mount(StockTypeManagement)
    await flushPromises()

    expect(settingsApi.getStockTypes).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('Acción Ordinaria')
    expect(wrapper.text()).toContain('ordinaria')
    expect(wrapper.text()).toContain('Apreciación de Capital')
    expect(wrapper.text()).toContain('Variable')

    expect(wrapper.text()).toContain('Acción Preferencial')
    expect(wrapper.text()).toContain('preferencial')
    expect(wrapper.text()).toContain('Rendimiento / Dividendos')
    expect(wrapper.text()).toContain('Garantizada')
    expect(wrapper.text()).toContain('2.00% mensual')
  })

  it('filters stock types based on search input', async () => {
    vi.spyOn(settingsApi, 'getStockTypes').mockResolvedValue(mockStockTypes)

    const wrapper = mount(StockTypeManagement)
    await flushPromises()

    const searchInput = wrapper.find('input[type="text"]')
    await searchInput.setValue('preferencial')

    expect(wrapper.text()).toContain('Acción Preferencial')
    expect(wrapper.text()).not.toContain('Acción Ordinaria')
  })

  it('opens create modal, toggles guarantee and creates stock type', async () => {
    vi.spyOn(settingsApi, 'getStockTypes').mockResolvedValue(mockStockTypes)
    vi.spyOn(settingsApi, 'createStockType').mockResolvedValue({
      id: 'st-3',
      code: 'cdt_nuevo',
      name: 'CDT Nuevo',
      behavior: 'DIVIDEND_YIELD',
      is_guaranteed: true,
      guaranteed_yield: 0.03,
      description: 'Ahorro a plazo',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z'
    })

    const wrapper = mount(StockTypeManagement)
    await flushPromises()

    // Click "Nuevo Tipo"
    const newBtn = wrapper.find('button[aria-label="Crear nuevo tipo de acción"]')
    await newBtn.trigger('click')

    const form = wrapper.find('form[data-testid="create-stock-type-form"]')
    expect(form.exists()).toBe(true)

    // Fill form
    const nameInput = wrapper.find('input[data-testid="stock-type-name-input"]')
    await nameInput.setValue('CDT Nuevo')

    const behaviorSelect = wrapper.find('select[data-testid="stock-type-behavior-select"]')
    await behaviorSelect.setValue('DIVIDEND_YIELD')

    const guaranteedCheckbox = wrapper.find('input[data-testid="stock-type-guaranteed-checkbox"]')
    await guaranteedCheckbox.setValue(true)

    // Yield input should now be visible
    const yieldInput = wrapper.find('input[data-testid="stock-type-yield-input"]')
    expect(yieldInput.exists()).toBe(true)
    await yieldInput.setValue(3.0)

    const descInput = wrapper.find('textarea[data-testid="stock-type-description-input"]')
    await descInput.setValue('Ahorro a plazo')

    // Submit
    await form.trigger('submit.prevent')
    await flushPromises()

    expect(settingsApi.createStockType).toHaveBeenCalledWith({
      name: 'CDT Nuevo',
      code: undefined,
      behavior: 'DIVIDEND_YIELD',
      is_guaranteed: true,
      guaranteed_yield: 0.03,
      description: 'Ahorro a plazo'
    })
  })

  it('opens edit modal and updates stock type', async () => {
    vi.spyOn(settingsApi, 'getStockTypes').mockResolvedValue(mockStockTypes)
    vi.spyOn(settingsApi, 'updateStockType').mockResolvedValue({
      ...mockStockTypes[0],
      name: 'Acción Ordinaria Modificada'
    })

    const wrapper = mount(StockTypeManagement)
    await flushPromises()

    // Click Edit on first item
    const editBtn = wrapper.find('button[aria-label="Editar"]')
    await editBtn.trigger('click')

    const form = wrapper.find('form[data-testid="edit-stock-type-form"]')
    expect(form.exists()).toBe(true)

    const nameInput = wrapper.find('input[data-testid="edit-stock-type-name-input"]')
    await nameInput.setValue('Acción Ordinaria Modificada')

    // Submit
    await form.trigger('submit.prevent')
    await flushPromises()

    expect(settingsApi.updateStockType).toHaveBeenCalledWith('st-1', {
      name: 'Acción Ordinaria Modificada',
      behavior: 'CAPITAL_APPRECIATION',
      is_guaranteed: false,
      guaranteed_yield: null,
      description: 'Acción común estándar'
    })
  })

  it('opens delete modal and confirms deletion', async () => {
    vi.spyOn(settingsApi, 'getStockTypes').mockResolvedValue(mockStockTypes)
    vi.spyOn(settingsApi, 'deleteStockType').mockResolvedValue()

    const wrapper = mount(StockTypeManagement)
    await flushPromises()

    // Click Delete on first item
    const deleteBtn = wrapper.find('button[aria-label="Eliminar"]')
    await deleteBtn.trigger('click')

    expect(wrapper.text()).toContain('¿Estás seguro de que deseas eliminar el tipo de acción')

    const confirmBtn = wrapper.find('button[data-testid="confirm-delete-stock-type-btn"]')
    await confirmBtn.trigger('click')
    await flushPromises()

    expect(settingsApi.deleteStockType).toHaveBeenCalledWith('st-1')
  })
})
