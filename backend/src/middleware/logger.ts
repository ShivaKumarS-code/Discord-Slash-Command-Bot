import { Request, Response, NextFunction } from "express"

/**
 * Middleware that logs HTTP method, requested route path, response status code,
 * and completion time duration.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now()
  ;(req as any).startTime = startTime

  res.on("finish", () => {
    const duration = Date.now() - startTime
    console.info(`[${req.method}] ${req.originalUrl || req.url} - Status: ${res.statusCode} - Duration: ${duration}ms`)
  })

  next()
}
