import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import type { AuthRequest } from '../types'
import * as progressService from '../services/progress'

const router = Router()

// GET /api/progress — Return full progress data
router.get('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const result = await progressService.getProgress(req.user!.id)
    res.json({ data: result })
  } catch (err) {
    next(err)
  }
})

export default router
