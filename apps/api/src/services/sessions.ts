import { db } from '../db'
import { learningSessions } from '../db/schema'
import { updateStreak } from './streak'

interface CompleteSessionInput {
  topicId: string
  lessonReadId?: string
  quizAttemptId?: string
}

export async function completeSession(userId: string, input: CompleteSessionInput) {
  const [session] = await db.insert(learningSessions).values({
    userId,
    topicId: input.topicId,
    lessonReadId: input.lessonReadId ?? null,
    quizAttemptId: input.quizAttemptId ?? null,
  }).returning()

  const { streak, longestStreak } = await updateStreak(userId)

  return {
    session,
    streak,
    longestStreak,
    achievements: [] as string[],
  }
}
