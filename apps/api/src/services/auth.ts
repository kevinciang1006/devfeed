import { db } from '../db'
import { users, userTopics, userDomains, userInterests, topics, domains, categories } from '../db/schema'
import { eq } from 'drizzle-orm'
import type { AuthUser } from '../types'

export async function syncUser(authUser: AuthUser) {
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.supabaseId, authUser.supabaseId))
    .limit(1)

  if (existing) {
    const [user] = await db
      .update(users)
      .set({
        email: authUser.email,
        name: authUser.name,
        avatarUrl: authUser.avatarUrl,
        lastActiveAt: new Date(),
      })
      .where(eq(users.id, existing.id))
      .returning()
    return user
  }

  const [user] = await db
    .insert(users)
    .values({
      email: authUser.email,
      name: authUser.name,
      avatarUrl: authUser.avatarUrl,
      supabaseId: authUser.supabaseId,
    })
    .returning()
  return user
}

export async function getFullProfile(supabaseId: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.supabaseId, supabaseId))
    .limit(1)

  if (!user) return null

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

  return {
    ...user,
    userTopics: topicDetails,
    userDomains: domainDetails,
    userInterests: interestDetails,
  }
}
