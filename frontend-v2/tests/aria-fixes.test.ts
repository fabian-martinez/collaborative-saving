import { mount } from '@vue/test-utils'
import ExpandableSection from '../src/shared/components/ExpandableSection.vue'
import PrintReceiptModal from '../src/shared/components/PrintReceiptModal.vue'
import DisbursementSummary from '../src/features/meetings/components/active-meeting/collection/DisbursementSummary.vue'
import { test, expect } from 'vitest'

/**
 * @vitest-environment jsdom
 */

test('ExpandableSection has aria-expanded on toggle button', async () => {
  const wrapper = mount(ExpandableSection, {
    props: {
      title: 'Test Section'
    }
  })

  const button = wrapper.find('button')
  expect(button.attributes('aria-expanded')).toBe('false')

  await button.trigger('click')
  expect(button.attributes('aria-expanded')).toBe('true')
})

test('PrintReceiptModal close button has aria-label', () => {
  const wrapper = mount(PrintReceiptModal, {
    props: {
      isOpen: true,
      memberName: 'John Doe',
      printDate: '2023-10-27',
      viewedOperations: [],
      viewedTotal: 0
    }
  })

  const closeButton = wrapper.find('.btn-circle')
  expect(closeButton.attributes('aria-label')).toBe('Cerrar modal')
})

test('DisbursementSummary has aria-pressed on Pin button', async () => {
  const wrapper = mount(DisbursementSummary, {
    props: {
      availableCash: 100,
      totalToDisburse: 50,
      sticky: true
    }
  })

  const button = wrapper.find('button')
  expect(button.attributes('aria-pressed')).toBe('true')

  await button.trigger('click')
  expect(button.attributes('aria-pressed')).toBe('false')
})
