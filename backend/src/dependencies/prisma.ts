import { PrismaClient } from "@prisma/client"

/**
 * Singleton database connection client wrapper instance.
 * Avoids spawning multiple connection pools in server processes.
 */
export const prisma = new PrismaClient()
