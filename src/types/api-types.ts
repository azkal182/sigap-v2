export type Pagination = {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export type APIResponse<T> = {
  success: true
  data: T
  message?: string
}

export type APIError = {
  success: false
  error: string
  issues?: Record<string, string[]>
}

export type APIResult<T> = APIResponse<T> | APIError

// Versi khusus yang pagination wajib
export type APIPaginatedResponse<T> = {
  success: true
  data: T
  pagination: Pagination
  message?: string
}

export type APIPaginatedResult<T> = APIPaginatedResponse<T> | APIError
