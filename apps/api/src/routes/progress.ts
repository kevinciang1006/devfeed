import { Router } from 'express'
import { db } from '../db'
import {
  users, userTopicProgress, topics, lessonReads,
  quizAttempts, quizQuestions, learningSessions, streakLogs, lessons, quizzes
} from '../db/schema'
import { eq, and, desc, sql, gte } from 'drizzle-orm'
import { requireAuth } from '../middleware/auth'
import type { AuthRequest } from '../types'

const router = Router()

// GET /api/progress — Return full progress data
router.get('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id

    // Get user
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    if (!user) return res.status(404).json({ error: 'User not found' })

    // Total lessons completed
    const completedReads = await db
      .select()
      .from(lessonReads)
      .where(and(eq(lessonReads.userId, userId), sql`${lessonReads.completedAt} IS NOT NULL`))
    const totalLessons = completedReads.length

    // Total quizzes and scores
    const allAttempts = await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, userId))
    const totalQuizzes = allAttempts.length
    const correctAnswers = allAttempts.reduce((sum, a) => sum + a.score, 0)
    const totalQuestions = allAttempts.reduce((sum, a) => sum + a.total, 0)
    const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0

    // Topic breakdown
    const topicProgressRows = await db
      .select()
      .from(userTopicProgress)
      .where(eq(userTopicProgress.userId, userId))

    const topicBreakdown = await Promise.all(
      topicProgressRows.map(async (tp) => {
        const [topic] = await db.select().from(topics).where(eq(topics.id, tp.topicId)).limit(1)
        return {
          topicId: tp.topicId,
          topicName: topic?.name ?? 'Unknown',
          topicIcon: topic?.icon ?? '',
          topicColor: topic?.color ?? '#666',
          lessonsCompleted: tp.lessonsCompleted,
          accuracy: tp.accuracy,
        }
      })
    )

    // Recent sessions (last 10)
    const recentSessionRows = await db
      .select()
      .from(learningSessions)
      .where(eq(learningSessions.userId, userId))
      .orderBy(desc(learningSessions.completedAt))
      .limit(10)

    const recentSessions = await Promise.all(
      recentSessionRows.map(async (s) => {
        const [topic] = await db.select().from(topics).where(eq(topics.id, s.topicId)).limit(1)

        let lessonTitle: string | undefined
        if (s.lessonReadId) {
          const [read] = await db.select().from(lessonReads).where(eq(lessonReads.id, s.lessonReadId)).limit(1)
          if (read) {
            const [lesson] = await db.select().from(lessons).where(eq(lessons.id, read.lessonId)).limit(1)
            lessonTitle = lesson?.title
          }
        }

        let quizScore: number | undefined
        let quizTotal: number | undefined
        if (s.quizAttemptId) {
          const [attempt] = await db.select().from(quizAttempts).where(eq(quizAttempts.id, s.quizAttemptId)).limit(1)
          if (attempt) {
            quizScore = attempt.score
            quizTotal = attempt.total
          }
        }

        return {
          ...s,
          topic: topic!,
          lessonTitle,
          quizScore,
          quizTotal,
        }
      })
    )

    // Weekly activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

    const streakRows = await db
      .select()
      .from(streakLogs)
      .where(and(
        eq(streakLogs.userId, userId),
        gte(streakLogs.date, sevenDaysAgoStr),
      ))

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const weeklyActivity = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const log = streakRows.find(r => r.date === dateStr)
      weeklyActivity.push({
        date: dateStr,
        label: dayNames[d.getDay()],
        count: log?.sessionsCount ?? 0,
      })
    }

    res.json({
      streak: user.streak,
      longestStreak: user.longestStreak,
      totalLessons,
      totalQuizzes,
      correctAnswers,
      totalQuestions,
      accuracy,
      topicBreakdown,
      recentSessions,
      weeklyActivity,
    })
  } catch (err) {
    next(err)
  }
})

export default router
