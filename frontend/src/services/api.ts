/**
 * Simple API client placeholder for communicating with the FastAPI backend.
 * Uses environment variables configuration via Vite (import.meta.env).
 */

export const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || ""

export interface RequestOptions extends RequestInit {
  params?: Record<string, string>
}

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, ...customConfig } = options
  
  let url = `${API_BASE_URL}${endpoint}`
  if (params) {
    const searchParams = new URLSearchParams(params)
    url += `?${searchParams.toString()}`
  }

  const headers = {
    "Content-Type": "application/json",
    ...customConfig.headers,
  }

  const config: RequestInit = {
    ...customConfig,
    headers,
  }

  try {
    const response = await fetch(url, config)
    
    if (!response.ok) {
      const errorBody = await response.text().catch(() => "")
      throw new Error(`HTTP error! Status: ${response.status}. Detail: ${errorBody}`)
    }
    
    // Check if response is empty
    const text = await response.text()
    return text ? (JSON.parse(text) as T) : ({} as T)
  } catch (error) {
    console.error("API request failed:", error)
    throw error
  }
}
