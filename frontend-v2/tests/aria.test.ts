import { mount } from '@vue/test-utils'
import AppHeader from '../src/shared/layout/AppHeader.vue'
import AppSidebar from '../src/shared/layout/AppSidebar.vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { test, expect, vi } from 'vitest'

// Mock firebase config
vi.mock('@/shared/firebase/config', () => ({
  auth: {}
}))

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', component: { template: '<div></div>' } }],
})

test('AppHeader has aria-labels on icon buttons', () => {
  const pinia = createPinia()
  const wrapper = mount(AppHeader, {
    global: {
      plugins: [pinia, router]
    }
  })

  const hamburger = wrapper.find('[aria-label="Abrir menú"]')
  expect(hamburger.exists()).toBe(true)

  const notification = wrapper.find('[aria-label="Notificaciones"]')
  expect(notification.exists()).toBe(true)
})

test('AppSidebar has aria-labels on toggle button', () => {
  const pinia = createPinia()
  const wrapper = mount(AppSidebar, {
    global: {
      plugins: [pinia, router]
    }
  })

  const toggle = wrapper.find('[aria-label="Colapsar menú lateral"], [aria-label="Expandir menú lateral"]')
  expect(toggle.exists()).toBe(true)
})
