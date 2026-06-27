import { Request, Response, NextFunction } from "express"

/**
 * Middleware placeholder enforcing authentication checks.
 * Will extract JWT tokens and verify them using Supabase Auth keys.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Token parsing and validation logic will be placed here
  next()
}
