import React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

// Create global QueryClient optimized for caching and preventing refetches on window focus
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Prevent tab switching from triggering duplicate API calls
      refetchOnReconnect: false,   // Avoid reconnect-based refetching
      staleTime: 5 * 60 * 1000,    // Data is fresh for 5 minutes (prevents duplicate page load fetches)
      gcTime: 10 * 60 * 1000,      // Keep cached data in memory for 10 minutes before garbage collection
      retry: 1                     // Retry failed queries once
    }
  }
})

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
export default QueryProvider
