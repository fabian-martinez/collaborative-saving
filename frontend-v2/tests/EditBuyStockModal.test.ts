/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EditBuyStockModal from '../src/features/meetings/components/active-meeting/EditBuyStockModal.vue'
import type { Stock } from '../src/api/stocks.api'
import type { Member } from '../src/api/members.api'

/**
 * @vitest-environment jsdom
 */

describe('EditBuyStockModal.vue', () => {
  const mockStocks = [
    { id: 'stock-1', type: 'Acción Ordinaria', value: 100000, max_quantity: 100 },
  ] as unknown as Stock[]

  const mockMembers = [
    { id: 'member-1', name: 'Juan Perez' },
  ] as unknown as Member[]

  it('displays 1.5% fixed interest help text when mixed payment is selected', async () => {
    const wrapper = mount(EditBuyStockModal, {
      props: {
        visible: true,
        isEditing: false,
        initialData: {
          memberId: 'member-1',
          stockId: 'stock-1',
          quantity: 2,
          cashAmount: 50000,
        },
        stocks: mockStocks,
        members: mockMembers,
      },
    })

    // Because cashAmount (50000) < total (200000), paymentMethod initializes to 'mixed'
    expect(wrapper.text()).toContain('1.5% interés fijo')
    expect(wrapper.text()).not.toContain('2% interés fijo')
  })

  it('emits save with interest_rate 0.015 and loan_type accion for mixed payment', async () => {
    const wrapper = mount(EditBuyStockModal, {
      props: {
        visible: true,
        isEditing: false,
        initialData: {
          memberId: 'member-1',
          stockId: 'stock-1',
          quantity: 2,
          cashAmount: 50000,
        },
        stocks: mockStocks,
        members: mockMembers,
      },
    })

    // Submit the form
    const form = wrapper.find('form')
    await form.trigger('submit.prevent')

    expect(wrapper.emitted('save')).toBeTruthy()
    const [emittedLine] = wrapper.emitted('save')![0] as [
      {
        loanDetails?: {
          interest_rate: number
          loan_type: string
        }
      }
    ]
    expect(emittedLine.loanDetails).toBeDefined()
    expect(emittedLine.loanDetails?.loan_type).toBe('accion')
    expect(emittedLine.loanDetails?.interest_rate).toBe(0.015)
  })
})
