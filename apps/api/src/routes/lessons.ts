import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db'
import {
  lessons, userLessonStates, userTopics, lessonReads,
  quizzes, quizQuestions, userTopicProgress, prerequisites, topics
} from '../db/schema'
import { eq, and, asc } from 'drizzle-orm'
import { requireAuth } from '../middleware/auth'
import type { AuthRequest } from '../types'
import { generateLesson, generateQuiz } from '../services/ai'
import { unlockNextLessons } from '../services/progression'

const router = Router()

// GET /api/lessons/next/:topicId — Get next recommended lesson
router.get('/next/:topicId', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id
    const { topicId } = req.params

    // Get user's expertise level for this topic
    const [userTopic] = await db
      .select()
      .from(userTopics)
      .where(and(eq(userTopics.userId, userId), eq(userTopics.topicId, topicId)))
      .limit(1)

    const level = userTopic?.expertiseLevel ?? 'BEGINNER'

    // Get available lessons
    const availableStates = await db
      .select()
      .from(userLessonStates)
      .where(and(
        eq(userLessonStates.userId, userId),
        eq(userLessonStates.state, 'AVAILABLE'),
      ))

    const availableLessonIds = availableStates.map(s => s.lessonId)

    if (availableLessonIds.length > 0) {
      // Find matching lessons for this topic
      const topicLessons = await db
        .select()
        .from(lessons)
        .where(and(eq(lessons.topicId, topicId), eq(lessons.isActive, true)))
        .orderBy(asc(lessons.order))

      const difficultyRank = { BEGINNER: 0, INTERMEDIATE: 1, ADVANCED: 2 }
      const userRank = difficultyRank[level]

      for (const lesson of topicLessons) {
        if (!availableLessonIds.includes(lesson.id)) continue
        if (difficultyRank[lesson.difficulty] > userRank) continue

        // Check prerequisites
        const prereqs = await db
          .select()
          .from(prerequisites)
          .where(eq(prerequisites.lessonId, lesson.id))

        let allMet = true
        for (const prereq of prereqs) {
          const [state] = await db
            .select()
            .from(userLessonStates)
            .where(and(
              eq(userLessonStates.userId, userId),
              eq(userLessonStates.lessonId, prereq.requiresId),
              eq(userLessonStates.state, 'COMPLETED'),
            ))
            .limit(1)
          if (!state) { allMet = false; break }
        }

        if (!allMet) continue

        // Found a lesson — get its quiz
        const [quiz] = await db
          .select()
          .from(quizzes)
          .where(eq(quizzes.lessonId, lesson.id))
          .limit(1)

        let questions: typeof quizQuestions.$inferSelect[] = []
        if (quiz) {
          questions = await db
            .select()
            .from(quizQuestions)
            .where(eq(quizQuestions.quizId, quiz.id))
            .orderBy(asc(quizQuestions.order))
        }

        const state = availableStates.find(s => s.lessonId === lesson.id)

        return res.json({
          lesson: {
            ...lesson,
            quiz: quiz ? { ...quiz, questions } : null,
          },
          userLessonState: { state: state?.state ?? 'AVAILABLE' },
        })
      }
    }

    // No pre-generated lesson available — generate with AI
    const [topic] = await db.select().from(topics).where(eq(topics.id, topicId)).limit(1)
    if (!topic) return res.status(404).json({ error: 'Topic not found' })

    // Get previously completed concepts for context
    const completedStates = await db
      .select()
      .from(userLessonStates)
      .where(and(eq(userLessonStates.userId, userId), eq(userLessonStates.state, 'COMPLETED')))

    const completedLessonIds = completedStates.map(s => s.lessonId)
    let previousConcepts: string[] = []
    if (completedLessonIds.length > 0) {
      const completedLessons = await db.select().from(lessons).where(eq(lessons.topicId, topicId))
      previousConcepts = completedLessons
        .filter(l => completedLessonIds.includes(l.id))
        .map(l => l.concept)
    }

    const lessonData = await generateLesson(topic.name, level, previousConcepts)

    // Get max order for the topic
    const topicLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.topicId, topicId))
      .orderBy(asc(lessons.order))
    const maxOrder = topicLessons.length > 0 ? topicLessons[topicLessons.length - 1].order : 0

    const [newLesson] = await db.insert(lessons).values({
      topicId,
      title: lessonData.title,
      concept: lessonData.concept,
      explanation: lessonData.explanation,
      codeExample: lessonData.codeExample,
      keyTakeaway: lessonData.keyTakeaway,
      difficulty: level,
      order: maxOrder + 1,
      docRef: lessonData.docRef,
      isActive: true,
      source: 'AI_GENERATED',
    }).returning()

    // Generate quiz for the new lesson
    const quizData = await generateQuiz(lessonData)
    const [newQuiz] = await db.insert(quizzes).values({ lessonId: newLesson.id }).returning()

    const newQuestions = await Promise.all(
      quizData.questions.map((q, i) =>
        db.insert(quizQuestions).values({
          quizId: newQuiz.id,
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          order: i + 1,
        }).returning().then(r => r[0])
      )
    )

    // Create lesson state for user
    await db.insert(userLessonStates).values({
      userId,
      lessonId: newLesson.id,
      state: 'AVAILABLE',
    }).onConflictDoNothing()

    res.json({
      lesson: {
        ...newLesson,
        quiz: { ...newQuiz, questions: newQuestions },
      },
      userLessonState: { state: 'AVAILABLE' },
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/lessons/:lessonId — Get full lesson with quiz
router.get('/:lessonId', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { lessonId } = req.params

    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, lessonId)).limit(1)
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' })

    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.lessonId, lessonId)).limit(1)
    let questions: typeof quizQuestions.$inferSelect[] = []
    if (quiz) {
      questions = await db
        .select()
        .from(quizQuestions)
        .where(eq(quizQuestions.quizId, quiz.id))
        .orderBy(asc(quizQuestions.order))
    }

    res.json({
      lesson: {
        ...lesson,
        quiz: quiz ? { ...quiz, questions } : null,
      }
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/lessons/:lessonId/start — Start reading a lesson
router.post('/:lessonId/start', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id
    const { lessonId } = req.params

    const [read] = await db.insert(lessonReads).values({
      userId,
      lessonId,
    }).returning()

    res.json({ lessonReadId: read.id })
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
    const userId = req.user!.id
    const { lessonId } = req.params
    const body = completeLessonSchema.parse(req.body)

    // Update lesson read
    await db
      .update(lessonReads)
      .set({
        completedAt: new Date(),
        readDurationSeconds: body.readDurationSeconds ?? null,
      })
      .where(eq(lessonReads.id, body.lessonReadId))

    // Update user lesson state to COMPLETED
    await db
      .update(userLessonStates)
      .set({ state: 'COMPLETED', completedAt: new Date() })
      .where(and(
        eq(userLessonStates.userId, userId),
        eq(userLessonStates.lessonId, lessonId),
      ))

    // Get the lesson's topic
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, lessonId)).limit(1)
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' })

    // Unlock next lessons
    await unlockNextLessons(userId, lessonId, lesson.topicId)

    // Update userTopicProgress
    const [progress] = await db
      .select()
      .from(userTopicProgress)
      .where(and(
        eq(userTopicProgress.userId, userId),
        eq(userTopicProgress.topicId, lesson.topicId),
      ))
      .limit(1)

    if (progress) {
      await db
        .update(userTopicProgress)
        .set({
          lessonsCompleted: progress.lessonsCompleted + 1,
          lastStudiedAt: new Date(),
        })
        .where(eq(userTopicProgress.id, progress.id))
    }

    // Check if there's a next available lesson
    const [nextAvailable] = await db
      .select()
      .from(userLessonStates)
      .where(and(
        eq(userLessonStates.userId, userId),
        eq(userLessonStates.state, 'AVAILABLE'),
      ))
      .limit(1)

    const [updatedProgress] = await db
      .select()
      .from(userTopicProgress)
      .where(and(
        eq(userTopicProgress.userId, userId),
        eq(userTopicProgress.topicId, lesson.topicId),
      ))
      .limit(1)

    res.json({
      progress: updatedProgress,
      nextLessonAvailable: !!nextAvailable,
    })
  } catch (err) {
    next(err)
  }
})

export default router
