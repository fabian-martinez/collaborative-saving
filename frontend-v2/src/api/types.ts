// Tipos base para respuestas de API
export interface PaginatedResponse<T> {
  data: T[]
  page: number
  limit: number
  total: number
}

export interface ApiError {
  message: string
  status: number
  errors?: Record<string, string[]>
}

export class ApiException extends Error {
  constructor(
    public message: string,
    public status: number,
    public errors?: Record<string, string[]>
  ) {
    super(message)
    this.name = 'ApiException'
  }
}

