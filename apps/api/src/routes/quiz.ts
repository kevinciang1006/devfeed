import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'
import type { AuthRequest } from '../types'
import * as quizService from '../services/quiz'

const router = Router()

const submitQuizSchema = z.object({
  answers: z.array(z.number()),
})

// POST /api/quiz/:quizId/attempt — Submit quiz answers
router.post('/:quizId/attempt', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const body = submitQuizSchema.parse(req.body)
    const result = await quizService.submitAttempt(req.user!.id, req.params.quizId, body.answers)
    res.json({ data: result })
  } catch (err) {
    next(err)
  }
})

// POST /api/quiz/generate/:lessonId — Generate quiz for a lesson
router.post('/generate/:lessonId', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const quiz = await quizService.generateQuizForLesson(req.params.lessonId)
    res.json({ data: quiz })
  } catch (err) {
    next(err)
  }
})

export default router
