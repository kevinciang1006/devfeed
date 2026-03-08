// Session service — complete learning sessions
import { fetchAPI } from '../lib/api'
import type { LearningSession } from '@devfeed/shared'

export const completeSession = (data: { topicId: string; lessonReadId?: string; quizAttemptId?: string }) =>
  fetchAPI<{ session: LearningSession; streak: number; longestStreak: number; achievements: string[] }>('/api/sessions/complete', { method: 'POST', body: JSON.stringify(data) })
