import type { User, UserTopic, UserTopicProgress, ExpertiseLevel } from './user'
import type { Topic, Domain, Category, Lesson, Quiz } from './content'
import type { LearningSession, QuizAttempt } from './progress'

// Auth
export interface SyncUserResponse {
  user: User
}

export interface GetMeResponse {
  user: User & {
    userTopics: UserTopic[]
    userDomains: { domainId: string; domain: Domain }[]
    userInterests: { categoryId: string; category: Category }[]
  }
}

// Topics
export interface GetAllTopicsResponse {
  categories: (Category & {
    domains: (Domain & {
      topics: Topic[]
    })[]
  })[]
}

export interface GetUserTopicsResponse {
  userTopics: UserTopic[]
}

export interface SaveUserTopicsRequest {
  topics: {
    topicId: string
    expertiseLevel: ExpertiseLevel
    yearsExp?: number
  }[]
}

export interface SaveUserTopicsResponse {
  userTopics: UserTopic[]
}

// Lessons
export interface GetNextLessonResponse {
  lesson: Lesson
  userLessonState: { state: string }
}

export interface StartLessonResponse {
  lessonReadId: string
}

export interface CompleteLessonRequest {
  lessonReadId: string
  readDurationSeconds?: number
}

export interface CompleteLessonResponse {
  progress: UserTopicProgress
  nextLessonAvailable: boolean
}

// Quiz
export interface SubmitQuizRequest {
  answers: number[]
}

export interface SubmitQuizResponse {
  score: number
  total: number
  passed: boolean
  correctAnswers: number[]
  explanations: string[]
  quizAttemptId: string
}

// Sessions
export interface CompleteSessionRequest {
  topicId: string
  lessonReadId?: string
  quizAttemptId?: string
}

export interface CompleteSessionResponse {
  session: LearningSession
  streak: number
  longestStreak: number
  achievements: string[]
}

// Progress
export interface GetProgressResponse {
  streak: number
  longestStreak: number
  totalLessons: number
  totalQuizzes: number
  correctAnswers: number
  totalQuestions: number
  accuracy: number
  topicBreakdown: {
    topicId: string
    topicName: string
    topicIcon: string
    topicColor: string
    lessonsCompleted: number
    accuracy: number
  }[]
  recentSessions: (LearningSession & {
    topic: Topic
    lessonTitle?: string
    quizScore?: number
    quizTotal?: number
  })[]
  weeklyActivity: {
    date: string
    label: string
    count: number
  }[]
}
