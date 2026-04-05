import { ref } from 'vue'

export type ToastType = 'info' | 'success' | 'warning' | 'error'

export interface Toast {
  id: number
  message: string
  type: ToastType
  duration?: number
}

const toasts = ref<Toast[]>([])
let nextId = 0

export function useToast() {
  function removeToast(id: number) {
    const index = toasts.value.findIndex((t) => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  function addToast(
    message: string,
    type: ToastType = 'info',
    duration = 3000
  ) {
    const id = nextId++
    const toast: Toast = { id, message, type, duration }
    toasts.value.push(toast)

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
  }

  function error(message: string, duration = 5000) {
    addToast(message, 'error', duration)
  }

  function success(message: string, duration = 3000) {
    addToast(message, 'success', duration)
  }

  function warning(message: string, duration = 4000) {
    addToast(message, 'warning', duration)
  }

  function info(message: string, duration = 3000) {
    addToast(message, 'info', duration)
  }

  return {
    toasts,
    addToast,
    removeToast,
    error,
    success,
    warning,
    info,
  }
}
