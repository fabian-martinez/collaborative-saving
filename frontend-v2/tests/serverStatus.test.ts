/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import axios from 'axios'
import {
  useServerStatusStore,
  DEBOUNCE_DELAY_MS,
  ESCAPE_TIMEOUT_MS
} from '../src/shared/stores/serverStatus'

vi.mock('axios')

describe('useServerStatusStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with default idle state', () => {
    const store = useServerStatusStore()

    expect(store.pendingRequests).toBe(0)
    expect(store.isDelayed).toBe(false)
    expect(store.isTimeout).toBe(false)
    expect(store.isDismissed).toBe(false)
    expect(store.isRetrying).toBe(false)
    expect(store.shouldShowOverlay).toBe(false)
  })

  it('should NOT trigger overlay for fast requests (< 1.5s)', () => {
    const store = useServerStatusStore()

    store.startRequest()
    expect(store.pendingRequests).toBe(1)

    // Advance by 1000ms (< 1500ms debounce threshold)
    vi.advanceTimersByTime(1000)
    expect(store.isDelayed).toBe(false)
    expect(store.shouldShowOverlay).toBe(false)

    // Request completes
    store.endRequest()
    expect(store.pendingRequests).toBe(0)

    // Advance further past debounce threshold
    vi.advanceTimersByTime(1000)
    expect(store.isDelayed).toBe(false)
    expect(store.shouldShowOverlay).toBe(false)
  })

  it('should trigger overlay when request exceeds debounce threshold (>= 1.5s)', () => {
    const store = useServerStatusStore()

    store.startRequest()
    vi.advanceTimersByTime(DEBOUNCE_DELAY_MS)

    expect(store.isDelayed).toBe(true)
    expect(store.isTimeout).toBe(false)
    expect(store.shouldShowOverlay).toBe(true)

    // When request finishes, overlay is removed
    store.endRequest()
    expect(store.isDelayed).toBe(false)
    expect(store.shouldShowOverlay).toBe(false)
  })

  it('should trigger escape timeout after 45s of continuous delay', () => {
    const store = useServerStatusStore()

    store.startRequest()
    vi.advanceTimersByTime(DEBOUNCE_DELAY_MS)
    expect(store.isDelayed).toBe(true)
    expect(store.isTimeout).toBe(false)

    // Advance up to 45s total
    vi.advanceTimersByTime(ESCAPE_TIMEOUT_MS - DEBOUNCE_DELAY_MS)
    expect(store.isTimeout).toBe(true)
    expect(store.shouldShowOverlay).toBe(true)

    // Completing request cleans up both
    store.endRequest()
    expect(store.isDelayed).toBe(false)
    expect(store.isTimeout).toBe(false)
    expect(store.shouldShowOverlay).toBe(false)
  })

  it('should coordinate multiple concurrent requests and clear only when all complete', () => {
    const store = useServerStatusStore()

    store.startRequest()
    store.startRequest()
    expect(store.pendingRequests).toBe(2)

    vi.advanceTimersByTime(DEBOUNCE_DELAY_MS)
    expect(store.isDelayed).toBe(true)

    // First request finishes, one still active
    store.endRequest()
    expect(store.pendingRequests).toBe(1)
    expect(store.isDelayed).toBe(true)
    expect(store.shouldShowOverlay).toBe(true)

    // Second request finishes
    store.endRequest()
    expect(store.pendingRequests).toBe(0)
    expect(store.isDelayed).toBe(false)
    expect(store.shouldShowOverlay).toBe(false)
  })

  it('should allow user to dismiss the overlay and reset dismissal on next cycle', () => {
    const store = useServerStatusStore()

    store.startRequest()
    vi.advanceTimersByTime(DEBOUNCE_DELAY_MS)
    expect(store.shouldShowOverlay).toBe(true)

    store.dismiss()
    expect(store.isDismissed).toBe(true)
    expect(store.shouldShowOverlay).toBe(false)

    // Finish current request
    store.endRequest()
    expect(store.isDismissed).toBe(false)

    // New request after finish should start clean
    store.startRequest()
    expect(store.isDismissed).toBe(false)
  })

  it('should ignore requests marked with skipTracking', () => {
    const store = useServerStatusStore()

    store.startRequest(true)
    expect(store.pendingRequests).toBe(0)

    vi.advanceTimersByTime(DEBOUNCE_DELAY_MS + 100)
    expect(store.isDelayed).toBe(false)

    store.endRequest(true)
    expect(store.pendingRequests).toBe(0)
  })

  it('should execute retry by pinging /health and reloading window when healthy', async () => {
    const store = useServerStatusStore()
    const reloadMock = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true
    })

    vi.mocked(axios.get).mockResolvedValueOnce({
      status: 200,
      data: { status: 'ok', uptime: 50, timestamp: '2026-10-14T12:00:00.000Z' }
    } as unknown as import('axios').AxiosResponse)

    await store.retry()

    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('/health'),
      expect.objectContaining({
        timeout: 10000,
        headers: { 'X-Skip-Server-Status': 'true' }
      })
    )
    expect(reloadMock).toHaveBeenCalledTimes(1)
  })

  it('should handle retry error gracefully without reloading', async () => {
    const store = useServerStatusStore()
    const reloadMock = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true
    })

    vi.mocked(axios.get).mockRejectedValueOnce(new Error('Network Error'))

    await store.retry()

    expect(reloadMock).not.toHaveBeenCalled()
    expect(store.isRetrying).toBe(false)
  })
})
