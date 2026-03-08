import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'
import type { AuthRequest } from '../types'
import * as topicsService from '../services/topics'

const router = Router()

// GET /api/topics — Return all topics grouped by category
router.get('/', async (_req, res, next) => {
  try {
    const categories = await topicsService.getAllTopicsGrouped()
    res.json({ data: categories })
  } catch (err) {
    next(err)
  }
})

// GET /api/topics/user — Return user's selected topics with progress
router.get('/user', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const userTopics = await topicsService.getUserTopicsWithProgress(req.user!.id)
    res.json({ data: userTopics })
  } catch (err) {
    next(err)
  }
})

const saveUserTopicsSchema = z.object({
  topics: z.array(z.object({
    topicId: z.string(),
    expertiseLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
    yearsExp: z.number().optional(),
  }))
})

// POST /api/topics/user — Save user's topic selections
router.post('/user', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const body = saveUserTopicsSchema.parse(req.body)
    const userTopics = await topicsService.saveUserTopics(req.user!.id, body.topics)
    res.json({ data: userTopics })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/topics/user/:topicId — Remove a user topic
router.delete('/user/:topicId', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    await topicsService.removeUserTopic(req.user!.id, req.params.topicId)
    res.json({ data: { success: true } })
  } catch (err) {
    next(err)
  }
})

export default router
