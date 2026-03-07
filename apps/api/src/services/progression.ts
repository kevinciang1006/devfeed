import { db } from '../db'
import { lessons, userLessonStates, prerequisites } from '../db/schema'
import { eq, and, asc } from 'drizzle-orm'

export async function unlockNextLessons(userId: string, completedLessonId: string, topicId: string) {
  // Get the completed lesson's order
  const [completedLesson] = await db
    .select()
    .from(lessons)
    .where(eq(lessons.id, completedLessonId))
    .limit(1)

  if (!completedLesson) return

  // Find the next lesson(s) by order in this topic
  const nextLessons = await db
    .select()
    .from(lessons)
    .where(and(
      eq(lessons.topicId, topicId),
      eq(lessons.isActive, true),
    ))
    .orderBy(asc(lessons.order))

  for (const lesson of nextLessons) {
    if (lesson.order <= completedLesson.order) continue

    // Check if this lesson has all prerequisites completed
    const prereqs = await db
      .select()
      .from(prerequisites)
      .where(eq(prerequisites.lessonId, lesson.id))

    let allPrereqsMet = true
    for (const prereq of prereqs) {
      const [prereqState] = await db
        .select()
        .from(userLessonStates)
        .where(and(
          eq(userLessonStates.userId, userId),
          eq(userLessonStates.lessonId, prereq.requiresId),
          eq(userLessonStates.state, 'COMPLETED'),
        ))
        .limit(1)

      if (!prereqState) {
        allPrereqsMet = false
        break
      }
    }

    if (allPrereqsMet) {
      // Check if already has a state
      const [existingState] = await db
        .select()
        .from(userLessonStates)
        .where(and(
          eq(userLessonStates.userId, userId),
          eq(userLessonStates.lessonId, lesson.id),
        ))
        .limit(1)

      if (!existingState) {
        await db.insert(userLessonStates).values({
          userId,
          lessonId: lesson.id,
          state: 'AVAILABLE',
        })
      } else if (existingState.state === 'LOCKED') {
        await db
          .update(userLessonStates)
          .set({ state: 'AVAILABLE', unlockedAt: new Date() })
          .where(eq(userLessonStates.id, existingState.id))
      }
    }
  }
}
