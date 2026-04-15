import { mount } from '@vue/test-utils'
import AppHeader from '../src/shared/layout/AppHeader.vue'
import AppSidebar from '../src/shared/layout/AppSidebar.vue'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
/**
 * @vitest-environment jsdom
 */
import { test, expect, vi } from 'vitest'

// Mock firebase config
vi.mock('@/shared/firebase/config', () => ({
  auth: {}
}))

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', component: { template: '<div></div>' } }],
})

test('AppHeader has dynamic aria-labels on toggle buttons', () => {
  const pinia = createPinia()
  const wrapper = mount(AppHeader, {
    global: {
      plugins: [pinia, router]
    }
  })

  // The aria-label is dynamic based on isMobileOpen (default false -> Abrir menú)
  const hamburger = wrapper.find('[aria-label="Abrir menú"]')
  expect(hamburger.exists()).toBe(true)

  const notification = wrapper.find('[aria-label="Notificaciones"]')
  expect(notification.exists()).toBe(true)
})

test('AppSidebar has dynamic aria-labels on toggle button', () => {
  const pinia = createPinia()
  const wrapper = mount(AppSidebar, {
    global: {
      plugins: [pinia, router]
    }
  })

  // The aria-label is dynamic based on isCollapsed (default false -> Colapsar menú lateral)
  const toggle = wrapper.find('[aria-label="Colapsar menú lateral"]')
  expect(toggle.exists()).toBe(true)
})
