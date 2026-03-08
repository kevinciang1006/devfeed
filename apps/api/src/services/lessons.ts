import { db } from '../db'
import {
  lessons, userLessonStates, userTopics, lessonReads,
  quizzes, quizQuestions, userTopicProgress, prerequisites, topics
} from '../db/schema'
import { eq, and, asc } from 'drizzle-orm'
import { generateLesson, generateQuiz } from './ai'
import { unlockNextLessons } from './progression'
import { AppError } from '../middleware/errorHandler'

export async function getNextLesson(userId: string, topicId: string) {
  const [userTopic] = await db
    .select()
    .from(userTopics)
    .where(and(eq(userTopics.userId, userId), eq(userTopics.topicId, topicId)))
    .limit(1)

  const level = userTopic?.expertiseLevel ?? 'BEGINNER'

  const availableStates = await db
    .select()
    .from(userLessonStates)
    .where(and(
      eq(userLessonStates.userId, userId),
      eq(userLessonStates.state, 'AVAILABLE'),
    ))

  const availableLessonIds = availableStates.map(s => s.lessonId)

  if (availableLessonIds.length > 0) {
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

      const quiz = await getLessonQuiz(lesson.id)
      const lessonState = availableStates.find(s => s.lessonId === lesson.id)

      return {
        lesson: { ...lesson, quiz },
        userLessonState: { state: lessonState?.state ?? 'AVAILABLE' },
      }
    }
  }

  // No pre-generated lesson — generate with AI
  const [topic] = await db.select().from(topics).where(eq(topics.id, topicId)).limit(1)
  if (!topic) throw new AppError('Topic not found', 404)

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

  const existingLessons = await db
    .select()
    .from(lessons)
    .where(eq(lessons.topicId, topicId))
    .orderBy(asc(lessons.order))
  const maxOrder = existingLessons.length > 0 ? existingLessons[existingLessons.length - 1].order : 0

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

  await db.insert(userLessonStates).values({
    userId,
    lessonId: newLesson.id,
    state: 'AVAILABLE',
  }).onConflictDoNothing()

  return {
    lesson: {
      ...newLesson,
      quiz: { ...newQuiz, questions: newQuestions },
    },
    userLessonState: { state: 'AVAILABLE' as const },
  }
}

export async function getLessonById(lessonId: string) {
  const [lesson] = await db.select().from(lessons).where(eq(lessons.id, lessonId)).limit(1)
  if (!lesson) throw new AppError('Lesson not found', 404)

  const quiz = await getLessonQuiz(lesson.id)

  return { ...lesson, quiz }
}

export async function startLessonRead(userId: string, lessonId: string) {
  const [read] = await db.insert(lessonReads).values({
    userId,
    lessonId,
  }).returning()
  return read.id
}

interface CompleteLessonInput {
  lessonReadId: string
  readDurationSeconds?: number
}

export async function completeLessonRead(userId: string, lessonId: string, input: CompleteLessonInput) {
  await db
    .update(lessonReads)
    .set({
      completedAt: new Date(),
      readDurationSeconds: input.readDurationSeconds ?? null,
    })
    .where(eq(lessonReads.id, input.lessonReadId))

  await db
    .update(userLessonStates)
    .set({ state: 'COMPLETED', completedAt: new Date() })
    .where(and(
      eq(userLessonStates.userId, userId),
      eq(userLessonStates.lessonId, lessonId),
    ))

  const [lesson] = await db.select().from(lessons).where(eq(lessons.id, lessonId)).limit(1)
  if (!lesson) throw new AppError('Lesson not found', 404)

  await unlockNextLessons(userId, lessonId, lesson.topicId)

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

  return {
    progress: updatedProgress,
    nextLessonAvailable: !!nextAvailable,
  }
}

async function getLessonQuiz(lessonId: string) {
  const [quiz] = await db
    .select()
    .from(quizzes)
    .where(eq(quizzes.lessonId, lessonId))
    .limit(1)

  if (!quiz) return null

  const questions = await db
    .select()
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, quiz.id))
    .orderBy(asc(quizQuestions.order))

  return { ...quiz, questions }
}
