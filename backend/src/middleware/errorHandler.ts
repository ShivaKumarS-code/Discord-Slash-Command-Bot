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

  console.error(`[ERROR] [${req.method}] ${req.url} - Status: ${statusCode} - Detail: ${message}`)
  if (err.stack && process.env.NODE_ENV !== "production") {
    console.error(err.stack)
  }

  res.status(statusCode).json({
    error: {
      status: statusCode,
      message,
      timestamp: new Date().toISOString()
    }
  })
}
