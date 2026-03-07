import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db'
import { quizzes, quizQuestions, quizAttempts, userTopicProgress, lessons } from '../db/schema'
import { eq, and, asc } from 'drizzle-orm'
import { requireAuth } from '../middleware/auth'
import type { AuthRequest } from '../types'
import { generateQuiz } from '../services/ai'

const router = Router()

const submitQuizSchema = z.object({
  answers: z.array(z.number()),
})

// POST /api/quiz/:quizId/attempt — Submit quiz answers
router.post('/:quizId/attempt', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id
    const { quizId } = req.params
    const body = submitQuizSchema.parse(req.body)

    // Get quiz questions
    const questions = await db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, quizId))
      .orderBy(asc(quizQuestions.order))

    if (questions.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' })
    }

    // Calculate score
    let score = 0
    const correctAnswers: number[] = []
    const explanations: string[] = []

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      correctAnswers.push(q.correctIndex)
      explanations.push(q.explanation)
      if (body.answers[i] === q.correctIndex) {
        score++
      }
    }

    const total = questions.length
    const passed = score >= Math.ceil(total * 2 / 3)

    // Create quiz attempt
    const [attempt] = await db.insert(quizAttempts).values({
      userId,
      quizId,
      score,
      total,
      passed,
      answers: body.answers,
    }).returning()

    // Get the lesson's topicId via quiz
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, quizId)).limit(1)
    if (quiz) {
      const [lesson] = await db.select().from(lessons).where(eq(lessons.id, quiz.lessonId)).limit(1)
      if (lesson) {
        // Update userTopicProgress accuracy (rolling average)
        const [progress] = await db
          .select()
          .from(userTopicProgress)
          .where(and(
            eq(userTopicProgress.userId, userId),
            eq(userTopicProgress.topicId, lesson.topicId),
          ))
          .limit(1)

        if (progress) {
          const totalAttempts = progress.quizzesPassed + (passed ? 0 : 1) + (passed ? 1 : 0)
          const newAccuracy = totalAttempts > 0
            ? ((progress.accuracy * (totalAttempts - 1)) + (score / total * 100)) / totalAttempts
            : (score / total * 100)

          await db
            .update(userTopicProgress)
            .set({
              accuracy: Math.round(newAccuracy * 100) / 100,
              quizzesPassed: passed ? progress.quizzesPassed + 1 : progress.quizzesPassed,
              lastStudiedAt: new Date(),
            })
            .where(eq(userTopicProgress.id, progress.id))
        }
      }
    }

    res.json({
      score,
      total,
      passed,
      correctAnswers,
      explanations,
      quizAttemptId: attempt.id,
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/quiz/generate/:lessonId — Generate quiz for a lesson
router.post('/generate/:lessonId', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { lessonId } = req.params

    // Check if quiz already exists
    const [existingQuiz] = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.lessonId, lessonId))
      .limit(1)

    if (existingQuiz) {
      const questions = await db
        .select()
        .from(quizQuestions)
        .where(eq(quizQuestions.quizId, existingQuiz.id))
        .orderBy(asc(quizQuestions.order))

      return res.json({ quiz: { ...existingQuiz, questions } })
    }

    // Get lesson
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, lessonId)).limit(1)
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' })

    // Generate quiz via AI
    const quizData = await generateQuiz({
      title: lesson.title,
      concept: lesson.concept,
      explanation: lesson.explanation,
      codeExample: lesson.codeExample,
    })

    // Save to DB
    const [quiz] = await db.insert(quizzes).values({ lessonId }).returning()

    const questions = await Promise.all(
      quizData.questions.map((q, i) =>
        db.insert(quizQuestions).values({
          quizId: quiz.id,
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          order: i + 1,
        }).returning().then(r => r[0])
      )
    )

    res.json({ quiz: { ...quiz, questions } })
  } catch (err) {
    next(err)
  }
})

export default router
