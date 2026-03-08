import { supabase } from './supabase'
import type {
  User,
  UserTopic,
  SaveUserTopicsRequest,
  CompleteLessonRequest,
  SubmitQuizRequest,
  Lesson,
  Quiz,
  UserTopicProgress,
  LearningSession,
  GetProgressResponse,
  GetMeResponse,
  GetAllTopicsResponse,
} from '@devfeed/shared'

const API_URL = import.meta.env.VITE_API_URL

async function fetchAPI<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(body.error || `HTTP ${res.status}`)
  }

  const json = await res.json()
  // API wraps all responses in { data: ... } — unwrap for consumers
  return json.data !== undefined ? json.data : json
}

// Auth
export const syncUser = () =>
  fetchAPI<User>('/api/auth/sync', { method: 'POST' })
export const getMe = () =>
  fetchAPI<GetMeResponse['user']>('/api/auth/me')

// Topics
export const getAllTopics = () =>
  fetchAPI<GetAllTopicsResponse['categories']>('/api/topics')
export const getUserTopics = () =>
  fetchAPI<UserTopic[]>('/api/topics/user')
export const saveUserTopics = (data: SaveUserTopicsRequest) =>
  fetchAPI<UserTopic[]>('/api/topics/user', { method: 'POST', body: JSON.stringify(data) })
export const removeUserTopic = (topicId: string) =>
  fetchAPI<{ success: boolean }>(`/api/topics/user/${topicId}`, { method: 'DELETE' })

// Lessons
export const getNextLesson = (topicId: string) =>
  fetchAPI<{ lesson: Lesson; userLessonState: { state: string } }>(`/api/lessons/next/${topicId}`)
export const getLessonById = (id: string) =>
  fetchAPI<Lesson>(`/api/lessons/${id}`)
export const startLesson = (lessonId: string) =>
  fetchAPI<{ lessonReadId: string }>(`/api/lessons/${lessonId}/start`, { method: 'POST' })
export const completeLesson = (lessonId: string, data: CompleteLessonRequest) =>
  fetchAPI<{ progress: UserTopicProgress; nextLessonAvailable: boolean }>(`/api/lessons/${lessonId}/complete`, { method: 'POST', body: JSON.stringify(data) })

// Quiz
export const submitQuizAttempt = (quizId: string, data: SubmitQuizRequest) =>
  fetchAPI<{ score: number; total: number; passed: boolean; correctAnswers: number[]; explanations: string[]; quizAttemptId: string }>(`/api/quiz/${quizId}/attempt`, { method: 'POST', body: JSON.stringify(data) })
export const generateQuiz = (lessonId: string) =>
  fetchAPI<Quiz>(`/api/quiz/generate/${lessonId}`, { method: 'POST' })

// Sessions
export const completeSession = (data: { topicId: string; lessonReadId?: string; quizAttemptId?: string }) =>
  fetchAPI<{ session: LearningSession; streak: number; longestStreak: number; achievements: string[] }>('/api/sessions/complete', { method: 'POST', body: JSON.stringify(data) })

// Progress
export const getProgress = () =>
  fetchAPI<GetProgressResponse>('/api/progress')
