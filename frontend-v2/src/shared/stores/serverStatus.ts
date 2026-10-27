/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { useToast } from '@/shared/composables/useToast'

export const DEBOUNCE_DELAY_MS = 1500
export const ESCAPE_TIMEOUT_MS = 45000

export const useServerStatusStore = defineStore('serverStatus', () => {
  const pendingRequests = ref<number>(0)
  const isDelayed = ref<boolean>(false)
  const isTimeout = ref<boolean>(false)
  const isDismissed = ref<boolean>(false)
  const isRetrying = ref<boolean>(false)

  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let escapeTimer: ReturnType<typeof setTimeout> | null = null

  const shouldShowOverlay = computed<boolean>(() => {
    return isDelayed.value && !isDismissed.value
  })

  function clearTimers(): void {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
    if (escapeTimer) {
      clearTimeout(escapeTimer)
      escapeTimer = null
    }
  }

  function startRequest(skipTracking = false): void {
    if (skipTracking) return

    if (pendingRequests.value === 0) {
      isDismissed.value = false
      isTimeout.value = false
      clearTimers()

      debounceTimer = setTimeout(() => {
        if (pendingRequests.value > 0) {
          isDelayed.value = true
        }
      }, DEBOUNCE_DELAY_MS)

      escapeTimer = setTimeout(() => {
        if (pendingRequests.value > 0) {
          isTimeout.value = true
        }
      }, ESCAPE_TIMEOUT_MS)
    }

    pendingRequests.value++
  }

  function endRequest(skipTracking = false): void {
    if (skipTracking) return

    pendingRequests.value = Math.max(0, pendingRequests.value - 1)

    if (pendingRequests.value === 0) {
      clearTimers()
      isDelayed.value = false
      isTimeout.value = false
      isDismissed.value = false
      isRetrying.value = false
    }
  }

  function dismiss(): void {
    isDismissed.value = true
  }

  function reset(): void {
    clearTimers()
    pendingRequests.value = 0
    isDelayed.value = false
    isTimeout.value = false
    isDismissed.value = false
    isRetrying.value = false
  }

  async function retry(): Promise<void> {
    if (isRetrying.value) return
    isRetrying.value = true

    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    const healthUrl = `${apiBaseUrl.replace(/\/+$/, '')}/health`

    try {
      const response = await axios.get(healthUrl, {
        timeout: 10000,
        headers: {
          'X-Skip-Server-Status': 'true'
        }
      })

      if (response.status === 200 && response.data?.status === 'ok') {
        window.location.reload()
      } else {
        throw new Error('El servidor respondió pero no reporta estado saludable')
      }
    } catch (err: unknown) {
      isRetrying.value = false
      const { error: showError } = useToast()
      showError('El servidor aún no responde. Por favor espera unos momentos e intenta de nuevo.')
      console.warn('[ServerStatus] Falló la verificación de salud en reintento:', err)
    }
  }

  return {
    pendingRequests,
    isDelayed,
    isTimeout,
    isDismissed,
    isRetrying,
    shouldShowOverlay,
    startRequest,
    endRequest,
    dismiss,
    retry,
    reset,
    clearTimers
  }
})
