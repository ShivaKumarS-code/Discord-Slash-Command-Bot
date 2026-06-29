import { Request, Response, NextFunction } from "express"

/**
 * Centralized application error handling middleware.
 * Intercepts unhandled errors, logs the trace, and responds with standard JSON payload format.
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const statusCode = err.statusCode || err.status || 500
  const message = err.message || "Internal Server Error"

  const startTime = (req as any).startTime
  const duration = startTime ? `${Date.now() - startTime}ms` : "unknown"

  const isPrismaError = err.constructor?.name?.startsWith("Prisma") || err.code?.startsWith("P") || err.message?.includes("Prisma")
  if (isPrismaError) {
    console.error(
      `🚨 [DATABASE CONNECTIVITY FAILURE]\n` +
      `- Route: [${req.method}] ${req.url}\n` +
      `- Code: ${err.code || "N/A"}\n` +
      `- Detail: ${message}\n` +
      `- Request Duration: ${duration}\n` +
      `- Timestamp: ${new Date().toISOString()}`
    )
  } else {
    console.error(`[ERROR] [${req.method}] ${req.url} - Status: ${statusCode} - Detail: ${message}`)
    if (err.stack && process.env.NODE_ENV !== "production") {
      console.error(err.stack)
    }
  }

  res.status(statusCode).json({
    error: {
      status: statusCode,
      message,
      timestamp: new Date().toISOString()
    }
  })
}
