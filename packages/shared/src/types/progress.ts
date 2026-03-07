export interface LessonRead {
  id: string
  userId: string
  lessonId: string
  startedAt: string
  completedAt: string | null
  readDurationSeconds: number | null
}

export interface QuizAttempt {
  id: string
  userId: string
  quizId: string
  score: number
  total: number
  passed: boolean
  attemptedAt: string
  answers: number[]
}

export interface LearningSession {
  id: string
  userId: string
  topicId: string
  lessonReadId: string | null
  quizAttemptId: string | null
  completedAt: string
  topic?: import('./content').Topic
  lessonRead?: LessonRead
  quizAttempt?: QuizAttempt
}

export interface StreakLog {
  id: string
  userId: string
  date: string
  sessionsCount: number
}

export interface Achievement {
  id: string
  key: string
  label: string
  description: string
  icon: string
}

export interface UserAchievement {
  id: string
  userId: string
  achievementId: string
  earnedAt: string
  achievement?: Achievement
}
