/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ServerLoadingOverlay from '../src/shared/components/ServerLoadingOverlay.vue'
import { useServerStatusStore } from '../src/shared/stores/serverStatus'

describe('ServerLoadingOverlay.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should not render anything when shouldShowOverlay is false', () => {
    const wrapper = mount(ServerLoadingOverlay)
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('should render connecting message when overlay is delayed but not timed out', async () => {
    const store = useServerStatusStore()
    store.isDelayed = true
    store.isTimeout = false

    const wrapper = mount(ServerLoadingOverlay)

    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Conectando con el servidor en la nube...')
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('should render timeout message with action buttons when isTimeout is true', async () => {
    const store = useServerStatusStore()
    store.isDelayed = true
    store.isTimeout = true

    const wrapper = mount(ServerLoadingOverlay)

    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('El servidor está tardando más de lo esperado')
    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(2)
    expect(buttons[0].text()).toContain('Reintentar')
    expect(buttons[1].text()).toContain('Cerrar')
  })

  it('should call store dismiss when Cerrar is clicked', async () => {
    const store = useServerStatusStore()
    store.isDelayed = true
    store.isTimeout = true
    const dismissSpy = vi.spyOn(store, 'dismiss')

    const wrapper = mount(ServerLoadingOverlay)
    const closeBtn = wrapper.findAll('button')[1]
    await closeBtn.trigger('click')

    expect(dismissSpy).toHaveBeenCalledTimes(1)
  })

  it('should call store retry when Reintentar is clicked', async () => {
    const store = useServerStatusStore()
    store.isDelayed = true
    store.isTimeout = true
    const retrySpy = vi.spyOn(store, 'retry').mockImplementation(async () => {})

    const wrapper = mount(ServerLoadingOverlay)
    const retryBtn = wrapper.findAll('button')[0]
    await retryBtn.trigger('click')

    expect(retrySpy).toHaveBeenCalledTimes(1)
  })
})
