/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import SettingsView from '../src/features/settings/views/SettingsView.vue'
import LoanTypeManagement from '../src/features/settings/components/LoanTypeManagement.vue'
import { settingsApi, type LoanType } from '../src/api/settings.api'

/**
 * @vitest-environment jsdom
 */

describe('SettingsView.vue', () => {
  it('renders settings view title and navigation tabs', () => {
    const wrapper = mount(SettingsView, {
      global: {
        stubs: {
          LoanTypeManagement: true
        }
      }
    })

    expect(wrapper.text()).toContain('Configuración del Sistema')
    expect(wrapper.text()).toContain('Tipos de Préstamo')
    expect(wrapper.text()).toContain('Penalizaciones y Moras')
    expect(wrapper.text()).toContain('Parámetros Generales')
  })

  it('switches between tabs and shows upcoming placeholder content', async () => {
    const wrapper = mount(SettingsView, {
      global: {
        stubs: {
          LoanTypeManagement: true
        }
      }
    })

    const buttons = wrapper.findAll('button.tab')
    expect(buttons).toHaveLength(3)

    // Click Penalties tab
    await buttons[1].trigger('click')
    expect(wrapper.text()).toContain('Penalizaciones y Moras')
    expect(wrapper.text()).toContain('Issue #61')

    // Click General parameters tab
    await buttons[2].trigger('click')
    expect(wrapper.text()).toContain('Parámetros Generales')
    expect(wrapper.text()).toContain('Issue #62')
  })
})

describe('LoanTypeManagement.vue', () => {
  const mockLoanTypes: LoanType[] = [
    {
      id: 'lt-1',
      code: 'corriente',
      name: 'Corriente',
      interest_rate: 0.015,
      description: 'Préstamo ordinario corriente',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'lt-2',
      code: 'agil',
      name: 'Ágil',
      interest_rate: 0.02,
      description: 'Préstamo de desembolso rápido',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z'
    }
  ]

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('fetches and lists loan types correctly', async () => {
    vi.spyOn(settingsApi, 'getLoanTypes').mockResolvedValue(mockLoanTypes)

    const wrapper = mount(LoanTypeManagement)
    await flushPromises()

    expect(settingsApi.getLoanTypes).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('Corriente')
    expect(wrapper.text()).toContain('corriente')
    expect(wrapper.text()).toContain('1.50% mensual')
    expect(wrapper.text()).toContain('Ágil')
    expect(wrapper.text()).toContain('agil')
    expect(wrapper.text()).toContain('2.00% mensual')
  })

  it('filters loan types via search input', async () => {
    vi.spyOn(settingsApi, 'getLoanTypes').mockResolvedValue(mockLoanTypes)

    const wrapper = mount(LoanTypeManagement)
    await flushPromises()

    const searchInput = wrapper.find('input[aria-label="Buscar tipos de préstamo"]')
    await searchInput.setValue('Ágil')

    expect(wrapper.text()).toContain('Ágil')
    expect(wrapper.text()).not.toContain('Corriente')
  })

  it('creates a new loan type and refreshes the list', async () => {
    vi.spyOn(settingsApi, 'getLoanTypes').mockResolvedValue(mockLoanTypes)
    const createSpy = vi.spyOn(settingsApi, 'createLoanType').mockResolvedValue({
      id: 'lt-3',
      code: 'especial',
      name: 'Especial',
      interest_rate: 0.018,
      description: 'Préstamo especial',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z'
    })

    const wrapper = mount(LoanTypeManagement)
    await flushPromises()

    // Open create modal
    const newBtn = wrapper.find('button[aria-label="Crear nuevo tipo de préstamo"]')
    await newBtn.trigger('click')

    // Find inputs in modal
    const nameInput = wrapper.find('input[placeholder="ej. Préstamo Ágil"]')
    const rateInput = wrapper.find('input[placeholder="ej. 1.5"]')
    const codeInput = wrapper.find('input[placeholder="ej. agil (opcional, se autogenera)"]')

    await nameInput.setValue('Especial')
    await rateInput.setValue('1.8')
    await codeInput.setValue('especial')

    // Submit form
    const form = wrapper.find('form[data-testid="create-loan-type-form"]')
    await form.trigger('submit.prevent')
    await flushPromises()

    expect(createSpy).toHaveBeenCalledWith({
      name: 'Especial',
      code: 'especial',
      interest_rate: 0.018,
      description: null
    })
    expect(settingsApi.getLoanTypes).toHaveBeenCalledTimes(2)
  })

  it('updates an existing loan type', async () => {
    vi.spyOn(settingsApi, 'getLoanTypes').mockResolvedValue(mockLoanTypes)
    const updateSpy = vi.spyOn(settingsApi, 'updateLoanType').mockResolvedValue({
      ...mockLoanTypes[0],
      name: 'Corriente VIP',
      interest_rate: 0.012
    })

    const wrapper = mount(LoanTypeManagement)
    await flushPromises()

    // Click edit button for first item
    const editBtn = wrapper.find('button[aria-label="Editar"]')
    await editBtn.trigger('click')

    // Find the edit modal form
    const editForm = wrapper.find('form[data-testid="edit-loan-type-form"]')

    const nameInput = editForm.find('input[type="text"]:not([disabled])')
    await nameInput.setValue('Corriente VIP')

    await editForm.trigger('submit.prevent')
    await flushPromises()

    expect(updateSpy).toHaveBeenCalledWith('lt-1', {
      name: 'Corriente VIP',
      interest_rate: 0.015,
      description: 'Préstamo ordinario corriente'
    })
    expect(settingsApi.getLoanTypes).toHaveBeenCalledTimes(2)
  })

  it('deletes a loan type on confirmation', async () => {
    vi.spyOn(settingsApi, 'getLoanTypes').mockResolvedValue(mockLoanTypes)
    const deleteSpy = vi.spyOn(settingsApi, 'deleteLoanType').mockResolvedValue()

    const wrapper = mount(LoanTypeManagement)
    await flushPromises()

    // Click delete button
    const deleteBtn = wrapper.find('button[aria-label="Eliminar"]')
    await deleteBtn.trigger('click')

    expect(wrapper.text()).toContain('¿Estás seguro de que deseas eliminar el tipo de préstamo')

    // Confirm deletion
    const confirmBtn = wrapper.findAll('button').find((b) => b.text().includes('Eliminar') && b.classes().includes('btn-error'))
    expect(confirmBtn).toBeDefined()
    await confirmBtn!.trigger('click')
    await flushPromises()

    expect(deleteSpy).toHaveBeenCalledWith('lt-1')
    expect(settingsApi.getLoanTypes).toHaveBeenCalledTimes(2)
  })
})
