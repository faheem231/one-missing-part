import type { ApiHealthResponse } from '@/types/api'

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000'

export class ApiError extends Error {
  status: number
  data?: unknown

  constructor(message: string, status: number, data?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export async function fetchJson<T>(
  endpoint: string,
  options?: RequestInit,
  timeoutMs: number = 5000
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(options?.headers || {}),
      },
      signal: controller.signal,
    })

    if (!response.ok) {
      let errorBody: unknown
      try {
        errorBody = await response.json()
      } catch {
        errorBody = await response.text()
      }
      throw new ApiError(
        `API request failed with status ${response.status}: ${response.statusText}`,
        response.status,
        errorBody
      )
    }

    return (await response.json()) as T
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      throw err
    }
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError(`Request timeout after ${timeoutMs}ms for ${endpoint}`, 408)
    }
    throw new ApiError(
      err instanceof Error ? err.message : 'Network error or backend unavailable',
      0
    )
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function checkBackendHealth(): Promise<{ isConnected: boolean; data?: ApiHealthResponse }> {
  try {
    const data = await fetchJson<ApiHealthResponse>('/api/health', undefined, 2500)
    return { isConnected: true, data }
  } catch {
    return { isConnected: false }
  }
}
