import React from "react"
import { AuthProvider } from "@/contexts/AuthContext"
import { QueryProvider } from "@/providers/QueryProvider"

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryProvider>
  )
}
