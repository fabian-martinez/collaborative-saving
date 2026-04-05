import { ref, type Ref } from 'vue'
import { ApiException } from '@/api/types'

export function useApi<T>() {
  const loading = ref(false)
  const error: Ref<ApiException | null> = ref(null)
  const data: Ref<T | null> = ref(null)

  async function execute(apiCall: () => Promise<T>) {
    loading.value = true
    error.value = null
    try {
      data.value = await apiCall()
      return data.value
    } catch (e) {
      error.value = e instanceof ApiException ? e : new ApiException('Error desconocido', 0)
      throw e
    } finally {
      loading.value = false
    }
  }

  function reset() {
    loading.value = false
    error.value = null
    data.value = null
  }

  return {
    loading,
    error,
    data,
    execute,
    reset
  }
}
