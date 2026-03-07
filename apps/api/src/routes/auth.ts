import { Router } from 'express'
import { db } from '../db'
import { users, userTopics, userDomains, userInterests, topics, domains, categories } from '../db/schema'
import { eq } from 'drizzle-orm'
import { requireAuth } from '../middleware/auth'
import type { AuthRequest } from '../types'

const router = Router()

// POST /api/auth/sync — Upsert user from Supabase auth
router.post('/sync', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const authUser = req.user!

    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.supabaseId, authUser.supabaseId))
      .limit(1)

    let user
    if (existing) {
      ;[user] = await db
        .update(users)
        .set({
          email: authUser.email,
          name: authUser.name,
          avatarUrl: authUser.avatarUrl,
          lastActiveAt: new Date(),
        })
        .where(eq(users.id, existing.id))
        .returning()
    } else {
      ;[user] = await db
        .insert(users)
        .values({
          email: authUser.email,
          name: authUser.name,
          avatarUrl: authUser.avatarUrl,
          supabaseId: authUser.supabaseId,
        })
        .returning()
    }

    res.json({ user })
  } catch (err) {
    next(err)
  }
})

// GET /api/auth/me — Return full user profile
router.get('/me', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const authUser = req.user!

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.supabaseId, authUser.supabaseId))
      .limit(1)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const userTopicRows = await db
      .select()
      .from(userTopics)
      .where(eq(userTopics.userId, user.id))

    const topicDetails = await Promise.all(
      userTopicRows.map(async (ut) => {
        const [topic] = await db.select().from(topics).where(eq(topics.id, ut.topicId)).limit(1)
        return { ...ut, topic }
      })
    )

    const userDomainRows = await db
      .select()
      .from(userDomains)
      .where(eq(userDomains.userId, user.id))

    const domainDetails = await Promise.all(
      userDomainRows.map(async (ud) => {
        const [domain] = await db.select().from(domains).where(eq(domains.id, ud.domainId)).limit(1)
        return { domainId: ud.domainId, domain }
      })
    )

    const userInterestRows = await db
      .select()
      .from(userInterests)
      .where(eq(userInterests.userId, user.id))

    const interestDetails = await Promise.all(
      userInterestRows.map(async (ui) => {
        const [category] = await db.select().from(categories).where(eq(categories.id, ui.categoryId)).limit(1)
        return { categoryId: ui.categoryId, category }
      })
    )

    res.json({
      user: {
        ...user,
        userTopics: topicDetails,
        userDomains: domainDetails,
        userInterests: interestDetails,
      }
    })
  } catch (err) {
    next(err)
  }
})

export default router
