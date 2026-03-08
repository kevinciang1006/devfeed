// Lesson service — fetch, start, and complete lessons
import { fetchAPI } from '../lib/api'
import type { Lesson, CompleteLessonRequest, UserTopicProgress } from '@devfeed/shared'

export const getNextLesson = (topicId: string) =>
  fetchAPI<{ lesson: Lesson; userLessonState: { state: string } }>(`/api/lessons/next/${topicId}`)

export const getLessonById = (id: string) =>
  fetchAPI<Lesson>(`/api/lessons/${id}`)

export const startLesson = (lessonId: string) =>
  fetchAPI<{ lessonReadId: string }>(`/api/lessons/${lessonId}/start`, { method: 'POST' })

export const completeLesson = (lessonId: string, data: CompleteLessonRequest) =>
  fetchAPI<{ progress: UserTopicProgress; nextLessonAvailable: boolean }>(`/api/lessons/${lessonId}/complete`, { method: 'POST', body: JSON.stringify(data) })
