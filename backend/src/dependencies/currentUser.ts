import { Request } from "express"

/**
 * Dependency utility that extracts authenticated user profiles 
 * injected by authorization middlewares.
 */
export function getCurrentUser(req: Request) {
  // Will be implemented later with Supabase session metadata resolver logic
  return null
}
