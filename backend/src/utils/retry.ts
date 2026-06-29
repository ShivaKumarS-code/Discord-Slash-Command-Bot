/**
 * Executes a database or network query operation with exponential backoff.
 * Only safe for read-only (idempotent) database actions or queries.
 */
export async function retry<T>(
  operation: () => Promise<T>,
  retries = 3,
  delay = 500,
  backoffFactor = 2
): Promise<T> {
  let attempt = 0
  while (attempt < retries) {
    try {
      return await operation()
    } catch (error: any) {
      attempt++
      const isTransient =
        error.code === "P1001" ||
        error.code === "P2024" ||
        error.message?.includes("timeout") ||
        error.message?.includes("connect") ||
        error.constructor?.name?.includes("Timeout")

      if (!isTransient || attempt >= retries) {
        throw error
      }

      const currentDelay = delay * Math.pow(backoffFactor, attempt - 1)
      console.warn(`⚠️ Transient database connectivity issue encountered. Retrying in ${currentDelay}ms... (Attempt ${attempt}/${retries})`)
      await new Promise((resolve) => setTimeout(resolve, currentDelay))
    }
  }
  throw new Error("Retry operation failed unexpectedly")
}
