import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'
import type { AuthRequest } from '../types'
import * as sessionService from '../services/sessions'

const router = Router()

const completeSessionSchema = z.object({
  topicId: z.string(),
  lessonReadId: z.string().optional(),
  quizAttemptId: z.string().optional(),
})

// POST /api/sessions/complete — Complete a learning session
router.post('/complete', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const body = completeSessionSchema.parse(req.body)
    const result = await sessionService.completeSession(req.user!.id, body)
    res.json({ data: result })
  } catch (err) {
    next(err)
  }
})

export default router
