import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { ApiException } from './types'
import type { ApiError } from './types'
import { useAuthStore } from '@/features/auth/stores/authStore'
import { useToast } from '@/shared/composables/useToast'
import { useServerStatusStore } from '@/shared/stores/serverStatus'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Crear instancia de axios con timeout suficiente para tolerar cold starts en Render
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 60000
})

// Interceptor de request
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Notificar inicio de petición al monitor de estado del servidor
    const skipStatus = Boolean(config.headers?.['X-Skip-Server-Status'])
    const serverStatus = useServerStatusStore()
    serverStatus.startRequest(skipStatus)

    // Inject auth token
    const authStore = useAuthStore()
    const token = await authStore.getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Logging en desarrollo
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data
      })
    }
    return config
  },
  (error) => {
    const serverStatus = useServerStatusStore()
    serverStatus.endRequest()
    console.error('[API Request Error]', error)
    return Promise.reject(error)
  }
)

// Interceptor de response
apiClient.interceptors.response.use(
  (response) => {
    const skipStatus = Boolean(response.config?.headers?.['X-Skip-Server-Status'])
    const serverStatus = useServerStatusStore()
    serverStatus.endRequest(skipStatus)

    // Logging en desarrollo
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data
      })
    }
    return response
  },
  (error: AxiosError<ApiError>) => {
    const skipStatus = Boolean(error.config?.headers?.['X-Skip-Server-Status'])
    const serverStatus = useServerStatusStore()
    serverStatus.endRequest(skipStatus)

    // Manejo centralizado de errores
    if (error.response) {
      // El servidor respondió con un código de error
      const apiError: ApiException = new ApiException(
        error.response.data?.message || error.message || 'Error desconocido',
        error.response.status,
        error.response.data?.errors
      )
      
      // Los 404 son estados válidos en algunos casos (ej: no hay reunión activa)
      // Los registramos con debug en lugar de error
      if (error.response.status === 404) {
        console.debug('[API 404]', {
          url: error.config?.url,
          method: error.config?.method,
          message: apiError.message
        })
      } else {
        console.error('[API Error]', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response.status,
          message: apiError.message,
          errors: apiError.errors
        })
      }

      if (error.response.status === 401) {
        const authStore = useAuthStore()
        authStore.logout()
      } else if (error.response.status === 403) {
        const { error: showError } = useToast()
        showError(apiError.message || 'No tienes permisos para realizar esta acción.')
      }
      
      return Promise.reject(apiError)
    } else if (error.request) {
      // La petición fue hecha pero no hubo respuesta
      const apiError: ApiException = new ApiException(
        'No se pudo conectar con el servidor',
        0
      )
      console.error('[API Network Error]', error.request)
      return Promise.reject(apiError)
    } else {
      // Algo pasó al configurar la petición
      const apiError: ApiException = new ApiException(
        error.message || 'Error al realizar la petición',
        0
      )
      console.error('[API Config Error]', error)
      return Promise.reject(apiError)
    }
  }
)

export default apiClient

