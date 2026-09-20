/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import OperationDetails from '../src/shared/components/OperationDetails.vue'

/**
 * @vitest-environment jsdom
 */

describe('OperationDetails.vue', () => {
  it('renders credit entries from ledger_entries for STOCK_PURCHASE', () => {
    const wrapper = mount(OperationDetails, {
      props: {
        operation: {
          id: 'op-1',
          type: 'STOCK_PURCHASE',
          date: '2026-09-20T10:00:00Z',
          description: 'Compra de 10 acciones',
          total_amount: 100,
          ledger_entries: [
            {
              id: 'e-1',
              account_type: 'CASH',
              amount: 50,
              description: 'Pago en efectivo',
            },
            {
              id: 'e-2',
              account_type: 'LOANS_RECEIVABLE',
              amount: 50,
              description: 'Préstamo para acciones',
            },
            {
              id: 'e-3',
              account_type: 'STOCK_CAPITAL',
              amount: -100,
              description: 'Capital social',
            },
          ],
        },
      },
    })

    expect(wrapper.text()).toContain('Caja')
    expect(wrapper.text()).toContain('Préstamos por Cobrar')
    expect(wrapper.text()).not.toContain('Capital Social (Acciones)')
  })

  it('falls back to entries if ledger_entries is not provided', () => {
    const wrapper = mount(OperationDetails, {
      props: {
        operation: {
          id: 'op-2',
          type: 'STOCK_TRANSFER',
          date: '2026-09-20T10:00:00Z',
          description: 'Transferencia de acciones',
          total_amount: 200,
          entries: [
            {
              id: 'e-4',
              account_type: 'STOCK_TRANSFER',
              amount: 200,
              description: 'Transferencia entre socios',
            },
          ],
        },
      },
    })

    expect(wrapper.text()).toContain('Transferencia de Acciones')
    expect(wrapper.text()).toContain('Transferencia entre socios')
  })

  it('displays fallback description and total amount when entries are empty', () => {
    const wrapper = mount(OperationDetails, {
      props: {
        operation: {
          id: 'op-3',
          type: 'STOCK_TRANSFER',
          date: '2026-09-20T10:00:00Z',
          description: 'Transferencia de 5 acciones',
          total_amount: 50,
          entries: [],
          ledger_entries: [],
        },
      },
    })

    expect(wrapper.text()).toContain('Transferencia de 5 acciones')
    expect(wrapper.text()).toContain('Monto total:')
  })

  it('displays fallback when no description or entries exist', () => {
    const wrapper = mount(OperationDetails, {
      props: {
        operation: {
          id: 'op-4',
          type: 'UNKNOWN',
          date: '2026-09-20T10:00:00Z',
          entries: [],
        },
      },
    })

    expect(wrapper.text()).toContain('Sin detalles disponibles')
  })
})
