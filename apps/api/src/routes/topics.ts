import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db'
import { categories, domains, topics, userTopics, userTopicProgress, userLessonStates, lessons } from '../db/schema'
import { eq, and, asc } from 'drizzle-orm'
import { requireAuth } from '../middleware/auth'
import type { AuthRequest } from '../types'
import type { ExpertiseLevel } from '@devfeed/shared'

const router = Router()

// GET /api/topics — Return all topics grouped by category
router.get('/', async (_req, res, next) => {
  try {
    const allCategories = await db.select().from(categories)
    const allDomains = await db.select().from(domains)
    const allTopics = await db.select().from(topics).where(eq(topics.isActive, true))

    const result = allCategories.map(cat => ({
      ...cat,
      domains: allDomains
        .filter(d => d.categoryId === cat.id)
        .map(d => ({
          ...d,
          topics: allTopics.filter(t => t.domainId === d.id)
        }))
    }))

    res.json({ categories: result })
  } catch (err) {
    next(err)
  }
})

// GET /api/topics/user — Return user's selected topics with progress
router.get('/user', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id
    const rows = await db.select().from(userTopics).where(eq(userTopics.userId, userId))

    const result = await Promise.all(
      rows.map(async (ut) => {
        const [topic] = await db.select().from(topics).where(eq(topics.id, ut.topicId)).limit(1)
        const [progress] = await db
          .select()
          .from(userTopicProgress)
          .where(and(eq(userTopicProgress.userId, userId), eq(userTopicProgress.topicId, ut.topicId)))
          .limit(1)
        return { ...ut, topic, progress }
      })
    )

    res.json({ userTopics: result })
  } catch (err) {
    next(err)
  }
})

const saveTopicsSchema = z.object({
  topics: z.array(z.object({
    topicId: z.string(),
    expertiseLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
    yearsExp: z.number().optional(),
  }))
})

// POST /api/topics/user — Save user's topic selections
router.post('/user', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id
    const body = saveTopicsSchema.parse(req.body)

    const results = []

    for (const t of body.topics) {
      // Upsert userTopic
      const [existing] = await db
        .select()
        .from(userTopics)
        .where(and(eq(userTopics.userId, userId), eq(userTopics.topicId, t.topicId)))
        .limit(1)

      let userTopic
      if (existing) {
        ;[userTopic] = await db
          .update(userTopics)
          .set({ expertiseLevel: t.expertiseLevel as ExpertiseLevel, yearsExp: t.yearsExp ?? null })
          .where(eq(userTopics.id, existing.id))
          .returning()
      } else {
        ;[userTopic] = await db
          .insert(userTopics)
          .values({
            userId,
            topicId: t.topicId,
            expertiseLevel: t.expertiseLevel as ExpertiseLevel,
            yearsExp: t.yearsExp ?? null,
          })
          .returning()

        // Initialize userTopicProgress
        await db.insert(userTopicProgress).values({
          userId,
          topicId: t.topicId,
          currentLevel: t.expertiseLevel as ExpertiseLevel,
        }).onConflictDoNothing()

        // Initialize userLessonStates for first 3 lessons
        const topicLessons = await db
          .select()
          .from(lessons)
          .where(and(eq(lessons.topicId, t.topicId), eq(lessons.isActive, true)))
          .orderBy(asc(lessons.order))
          .limit(3)

        for (const lesson of topicLessons) {
          await db.insert(userLessonStates).values({
            userId,
            lessonId: lesson.id,
            state: 'AVAILABLE',
          }).onConflictDoNothing()
        }
      }

      results.push(userTopic)
    }

    res.json({ userTopics: results })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/topics/user/:topicId — Remove a user topic
router.delete('/user/:topicId', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id
    const { topicId } = req.params

    await db
      .delete(userTopics)
      .where(and(eq(userTopics.userId, userId), eq(userTopics.topicId, topicId)))

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

export default router
