import dotenv from "dotenv"
import { z } from "zod"

// Load env variables
dotenv.config()

const envSchema = z.object({
  PORT: z.coerce.number().default(8000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  SUPABASE_URL: z.string().url().or(z.literal("")),
  SUPABASE_ANON_KEY: z.string().or(z.literal("")),
  SUPABASE_SERVICE_ROLE_KEY: z.string().or(z.literal("")),
  DISCORD_APPLICATION_ID: z.string().or(z.literal("")),
  DISCORD_PUBLIC_KEY: z.string().or(z.literal("")),
  DISCORD_BOT_TOKEN: z.string().or(z.literal("")),
  GROQ_API_KEY: z.string().or(z.literal("")),
  BACKEND_CORS_ORIGINS: z.preprocess((val) => {
    if (typeof val === "string") {
      try {
        return JSON.parse(val)
      } catch {
        return val.split(",").map((o) => o.trim())
      }
    }
    return val
  }, z.array(z.string()).default([]))
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables during startup:", parsedEnv.error.format())
  process.exit(1)
}

export const env = parsedEnv.data
