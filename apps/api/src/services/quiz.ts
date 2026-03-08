import { db } from '../db'
import { quizzes, quizQuestions, quizAttempts, userTopicProgress, lessons } from '../db/schema'
import { eq, and, asc } from 'drizzle-orm'
import { generateQuiz as aiGenerateQuiz } from './ai'
import { AppError } from '../middleware/errorHandler'

export async function submitAttempt(userId: string, quizId: string, answers: number[]) {
  const questions = await db
    .select()
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, quizId))
    .orderBy(asc(quizQuestions.order))

  if (questions.length === 0) {
    throw new AppError('Quiz not found', 404)
  }

  let score = 0
  const correctAnswers: number[] = []
  const explanations: string[] = []

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    correctAnswers.push(q.correctIndex)
    explanations.push(q.explanation)
    if (answers[i] === q.correctIndex) {
      score++
    }
  }

  const total = questions.length
  const passed = score >= Math.ceil(total * 2 / 3)

  const [attempt] = await db.insert(quizAttempts).values({
    userId,
    quizId,
    score,
    total,
    passed,
    answers,
  }).returning()

  // Update topic progress accuracy
  const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, quizId)).limit(1)
  if (quiz) {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, quiz.lessonId)).limit(1)
    if (lesson) {
      const [progress] = await db
        .select()
        .from(userTopicProgress)
        .where(and(
          eq(userTopicProgress.userId, userId),
          eq(userTopicProgress.topicId, lesson.topicId),
        ))
        .limit(1)

      if (progress) {
        const totalAttempts = progress.quizzesPassed + 1
        const newAccuracy = ((progress.accuracy * (totalAttempts - 1)) + (score / total * 100)) / totalAttempts

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

  return {
    score,
    total,
    passed,
    correctAnswers,
    explanations,
    quizAttemptId: attempt.id,
  }
}

export async function generateQuizForLesson(lessonId: string) {
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

    return { ...existingQuiz, questions }
  }

  const [lesson] = await db.select().from(lessons).where(eq(lessons.id, lessonId)).limit(1)
  if (!lesson) throw new AppError('Lesson not found', 404)

  const quizData = await aiGenerateQuiz({
    title: lesson.title,
    concept: lesson.concept,
    explanation: lesson.explanation,
    codeExample: lesson.codeExample,
  })

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

  return { ...quiz, questions }
}
