export interface Member {
  id: string
  name: string
  email: string
  identificationNumber: string
  deletedAt?: string | null // null = activo, fecha = inactivo
} 