import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'
import type { AuthRequest } from '../types'
import * as authService from '../services/auth'

const router = Router()

// POST /api/auth/sync — Upsert user from Supabase auth
router.post('/sync', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const user = await authService.syncUser(req.user!)
    res.json({ data: user })
  } catch (err) {
    next(err)
  }
})

// GET /api/auth/me — Return full user profile
router.get('/me', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const profile = await authService.getFullProfile(req.user!.supabaseId)
    if (!profile) throw new AppError('User not found', 404)
    res.json({ data: profile })
  } catch (err) {
    next(err)
  }
})

export default router
