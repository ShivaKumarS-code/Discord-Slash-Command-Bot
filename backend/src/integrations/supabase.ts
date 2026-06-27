import { createClient } from "@supabase/supabase-js"
import { env } from "../config/env"

if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase configuration variables SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
}

/**
 * Supabase Admin client instance initialized with the service role key.
 * Used for bypass-privileged administrative auth checks on the server-side.
 */
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
