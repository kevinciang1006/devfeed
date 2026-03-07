import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db'
import { learningSessions } from '../db/schema'
import { requireAuth } from '../middleware/auth'
import type { AuthRequest } from '../types'
import { updateStreak } from '../services/streak'

const router = Router()

const completeSessionSchema = z.object({
  topicId: z.string(),
  lessonReadId: z.string().optional(),
  quizAttemptId: z.string().optional(),
})

// POST /api/sessions/complete — Complete a learning session
router.post('/complete', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id
    const body = completeSessionSchema.parse(req.body)

    const [session] = await db.insert(learningSessions).values({
      userId,
      topicId: body.topicId,
      lessonReadId: body.lessonReadId ?? null,
      quizAttemptId: body.quizAttemptId ?? null,
    }).returning()

    const { streak, longestStreak } = await updateStreak(userId)

    res.json({
      session,
      streak,
      longestStreak,
      achievements: [],
    })
  } catch (err) {
    next(err)
  }
})

export default router
