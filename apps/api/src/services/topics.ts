import { db } from '../db'
import { categories, domains, topics, userTopics, userTopicProgress, userLessonStates, lessons } from '../db/schema'
import { eq, and, asc } from 'drizzle-orm'
import type { ExpertiseLevel } from '@devfeed/shared'

export async function getAllTopicsGrouped() {
  const allCategories = await db.select().from(categories)
  const allDomains = await db.select().from(domains)
  const allTopics = await db.select().from(topics).where(eq(topics.isActive, true))

  return allCategories.map(cat => ({
    ...cat,
    domains: allDomains
      .filter(d => d.categoryId === cat.id)
      .map(d => ({
        ...d,
        topics: allTopics.filter(t => t.domainId === d.id)
      }))
  }))
}

export async function getUserTopicsWithProgress(userId: string) {
  const rows = await db.select().from(userTopics).where(eq(userTopics.userId, userId))

  return Promise.all(
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
}

interface SaveTopicInput {
  topicId: string
  expertiseLevel: ExpertiseLevel
  yearsExp?: number
}

export async function saveUserTopics(userId: string, topicInputs: SaveTopicInput[]) {
  const results = []

  for (const t of topicInputs) {
    const [existing] = await db
      .select()
      .from(userTopics)
      .where(and(eq(userTopics.userId, userId), eq(userTopics.topicId, t.topicId)))
      .limit(1)

    let userTopic
    if (existing) {
      ;[userTopic] = await db
        .update(userTopics)
        .set({ expertiseLevel: t.expertiseLevel, yearsExp: t.yearsExp ?? null })
        .where(eq(userTopics.id, existing.id))
        .returning()
    } else {
      ;[userTopic] = await db
        .insert(userTopics)
        .values({
          userId,
          topicId: t.topicId,
          expertiseLevel: t.expertiseLevel,
          yearsExp: t.yearsExp ?? null,
        })
        .returning()

      await db.insert(userTopicProgress).values({
        userId,
        topicId: t.topicId,
        currentLevel: t.expertiseLevel,
      }).onConflictDoNothing()

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

  return results
}

export async function removeUserTopic(userId: string, topicId: string) {
  await db
    .delete(userTopics)
    .where(and(eq(userTopics.userId, userId), eq(userTopics.topicId, topicId)))
}
