import { Request, Response, NextFunction } from "express"
import { supabaseAdmin } from "../integrations/supabase"
import { prisma } from "../dependencies/prisma"

// Extend the Express Request interface to include the authenticated user context
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        supabase_user_id: string
        email: string
        display_name: string | null
      }
      rawBody?: Buffer
    }
  }
}

/**
 * Authentication middleware that verifies client-side JWTs with Supabase.
 * Automatically provisions users into the PostgreSQL database if they don't exist.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ 
      error: {
        status: 401,
        message: "Unauthorized: Missing or invalid authorization header"
      } 
    })
    return
  }

  const token = authHeader.split(" ")[1]

  try {
    // Validate JWT signature and fetch active profile from Supabase Auth API
    const { data: { user: supabaseUser }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !supabaseUser) {
      res.status(401).json({ 
        error: {
          status: 401,
          message: `Unauthorized: ${authError?.message || "Invalid token credentials"}`
        } 
      })
      return
    }

    if (!supabaseUser.email) {
      res.status(401).json({ 
        error: {
          status: 401,
          message: "Unauthorized: Verified email address required"
        } 
      })
      return
    }

    // Check if user is already provisioned in our local users database
    let dbUser = await prisma.user.findUnique({
      where: { supabase_user_id: supabaseUser.id }
    })

    // Automatically provision user profile if missing
    if (!dbUser) {
      try {
        dbUser = await prisma.user.create({
          data: {
            supabase_user_id: supabaseUser.id,
            email: supabaseUser.email,
            display_name: supabaseUser.user_metadata?.display_name || supabaseUser.user_metadata?.full_name || null
          }
        })
      } catch (dbErr: any) {
        console.error("Database user provisioning failed:", dbErr)
        res.status(500).json({ 
          error: {
            status: 500,
            message: "Internal Server Error: Database provisioning failed"
          } 
        })
        return
      }
    }

    // Bind database user properties to request context
    req.user = {
      id: dbUser.id,
      supabase_user_id: dbUser.supabase_user_id,
      email: dbUser.email,
      display_name: dbUser.display_name
    }

    next()
  } catch (error: any) {
    console.error("Authentication middleware runtime error:", error)
    res.status(500).json({ 
      error: {
        status: 500,
        message: "Internal server authentication error"
      } 
    })
  }
}
