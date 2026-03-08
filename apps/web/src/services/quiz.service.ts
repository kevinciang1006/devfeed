// Quiz service — submit attempts and generate quizzes
import { fetchAPI } from '../lib/api'
import type { SubmitQuizRequest, Quiz } from '@devfeed/shared'

export const submitQuizAttempt = (quizId: string, data: SubmitQuizRequest) =>
  fetchAPI<{ score: number; total: number; passed: boolean; correctAnswers: number[]; explanations: string[]; quizAttemptId: string }>(`/api/quiz/${quizId}/attempt`, { method: 'POST', body: JSON.stringify(data) })

export const generateQuiz = (lessonId: string) =>
  fetchAPI<Quiz>(`/api/quiz/generate/${lessonId}`, { method: 'POST' })
