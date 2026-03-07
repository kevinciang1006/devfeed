import { db } from '../db'
import { streakLogs, users } from '../db/schema'
import { eq, and, sql } from 'drizzle-orm'

export async function updateStreak(userId: string): Promise<{ streak: number; longestStreak: number }> {
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  // Upsert today's streak log
  await db
    .insert(streakLogs)
    .values({ userId, date: today, sessionsCount: 1 })
    .onConflictDoUpdate({
      target: [streakLogs.userId, streakLogs.date],
      set: { sessionsCount: sql`${streakLogs.sessionsCount} + 1` },
    })

  // Get today's log (to check if first session)
  const [todayLog] = await db
    .select()
    .from(streakLogs)
    .where(and(eq(streakLogs.userId, userId), eq(streakLogs.date, today)))
    .limit(1)

  // Get current user
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!user) throw new Error('User not found')

  // If today's session count > 1, streak already updated today
  if (todayLog && todayLog.sessionsCount > 1) {
    return { streak: user.streak, longestStreak: user.longestStreak }
  }

  // Check yesterday
  const [yesterdayLog] = await db
    .select()
    .from(streakLogs)
    .where(and(eq(streakLogs.userId, userId), eq(streakLogs.date, yesterday)))
    .limit(1)

  let newStreak: number
  if (yesterdayLog) {
    newStreak = user.streak + 1
  } else {
    newStreak = 1
  }

  const newLongest = Math.max(newStreak, user.longestStreak)

  await db
    .update(users)
    .set({ streak: newStreak, longestStreak: newLongest, lastActiveAt: new Date() })
    .where(eq(users.id, userId))

  return { streak: newStreak, longestStreak: newLongest }
}
