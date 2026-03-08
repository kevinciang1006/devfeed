import type { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

export class AppError extends Error {
  statusCode: number

  constructor(message: string, statusCode: number = 500) {
    super(message)
    this.statusCode = statusCode
  }
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  const userId = (req as unknown as { user?: { id: string } }).user?.id ?? 'anonymous'
  console.error(`[${new Date().toISOString()}] Error in ${req.method} ${req.path} (user: ${userId}):`, err.message)
  console.error(err.stack)

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation error',
      details: err.errors.map(e => ({ path: e.path.join('.'), message: e.message })),
    })
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message })
  }

  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  })
}
