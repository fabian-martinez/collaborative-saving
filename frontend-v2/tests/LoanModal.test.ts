/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LoanModal from '../src/features/meetings/components/active-meeting/LoanModal.vue'
import type { Member } from '../src/api/members.api'

/**
 * @vitest-environment jsdom
 */

describe('LoanModal.vue', () => {
  const mockMember = {
    id: 'm-1',
    name: 'Juan Perez',
    email: 'juan@example.com',
  } as unknown as Member

  const baseProps = {
    show: true,
    member: mockMember,
    maxCapacity: 5000000,
  }

  it('renders default corriente loan type with 1.5% interest rate', () => {
    const wrapper = mount(LoanModal, {
      props: baseProps,
    })

    const select = wrapper.find('select')
    expect(select.element.value).toBe('corriente')

    // Check disabled interest rate input
    const interestInput = wrapper.findAll('input[disabled]').find(i => i.element.value.includes('%'))
    expect(interestInput?.element.value).toBe('1.5%')
  })

  it('updates interest rate to 1.5% when accion is selected or passed as prevLoan', async () => {
    const wrapper = mount(LoanModal, {
      props: {
        ...baseProps,
        prevLoan: {
          type: 'accion',
          approved: 1000000,
          delivered: 1000000,
        },
      },
    })

    const select = wrapper.find('select')
    expect(select.element.value).toBe('accion')

    const interestInput = wrapper.findAll('input[disabled]').find(i => i.element.value.includes('%'))
    expect(interestInput?.element.value).toBe('1.5%')
  })

  it('updates interest rate to 2% when agil is selected', async () => {
    const wrapper = mount(LoanModal, {
      props: baseProps,
    })

    const select = wrapper.find('select')
    await select.setValue('agil')

    const interestInput = wrapper.findAll('input[disabled]').find(i => i.element.value.includes('%'))
    expect(interestInput?.element.value).toBe('2%')
  })

  it('updates interest rate to 2% when prioritario is selected', async () => {
    const wrapper = mount(LoanModal, {
      props: baseProps,
    })

    const select = wrapper.find('select')
    await select.setValue('prioritario')

    const interestInput = wrapper.findAll('input[disabled]').find(i => i.element.value.includes('%'))
    expect(interestInput?.element.value).toBe('2%')
  })

  it('contains accion option in select dropdown', () => {
    const wrapper = mount(LoanModal, {
      props: baseProps,
    })

    const options = wrapper.findAll('option')
    const optionValues = options.map(o => o.attributes('value'))
    expect(optionValues).toContain('accion')
  })
})
