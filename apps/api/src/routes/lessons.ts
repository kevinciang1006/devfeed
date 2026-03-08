import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'
import type { AuthRequest } from '../types'
import * as lessonService from '../services/lessons'

const router = Router()

// GET /api/lessons/next/:topicId — Get next recommended lesson
router.get('/next/:topicId', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const result = await lessonService.getNextLesson(req.user!.id, req.params.topicId)
    res.json({ data: result })
  } catch (err) {
    next(err)
  }
})

// GET /api/lessons/:lessonId — Get full lesson with quiz
router.get('/:lessonId', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const lesson = await lessonService.getLessonById(req.params.lessonId)
    res.json({ data: lesson })
  } catch (err) {
    next(err)
  }
})

// POST /api/lessons/:lessonId/start — Start reading a lesson
router.post('/:lessonId/start', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const lessonReadId = await lessonService.startLessonRead(req.user!.id, req.params.lessonId)
    res.json({ data: { lessonReadId } })
  } catch (err) {
    next(err)
  }
})

const completeLessonSchema = z.object({
  lessonReadId: z.string(),
  readDurationSeconds: z.number().optional(),
})

// POST /api/lessons/:lessonId/complete — Complete a lesson
router.post('/:lessonId/complete', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const body = completeLessonSchema.parse(req.body)
    const result = await lessonService.completeLessonRead(req.user!.id, req.params.lessonId, body)
    res.json({ data: result })
  } catch (err) {
    next(err)
  }
})

export default router
