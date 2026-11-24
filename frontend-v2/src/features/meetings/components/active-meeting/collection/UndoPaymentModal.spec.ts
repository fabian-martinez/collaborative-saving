/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UndoPaymentModal from './UndoPaymentModal.vue'

describe('UndoPaymentModal', () => {
  it('requires at least 5 characters in reason before enabling confirm button', async () => {
    const wrapper = mount(UndoPaymentModal, {
      props: {
        visible: true,
        memberName: 'Juan Pérez',
        totalAmount: 150000,
        operationCount: 2,
        isSubmitting: false
      }
    })

    const confirmBtn = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Confirmar Anulación'))
    expect(confirmBtn).toBeDefined()
    expect(confirmBtn!.attributes('disabled')).toBeDefined()

    const textarea = wrapper.find('textarea')
    await textarea.setValue('abc')
    expect(wrapper.text()).toContain(
      'Ingresa al menos 5 caracteres para describir el motivo.'
    )
    expect(confirmBtn!.attributes('disabled')).toBeDefined()

    await textarea.setValue('  Cobro duplicado  ')
    expect(confirmBtn!.attributes('disabled')).toBeUndefined()

    await confirmBtn!.trigger('click')
    expect(wrapper.emitted('confirm')).toEqual([['Cobro duplicado']])
  })
})
