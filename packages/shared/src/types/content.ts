export type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
export type LessonSource = 'PREGENERATED' | 'AI_GENERATED'
export type LessonState = 'LOCKED' | 'AVAILABLE' | 'COMPLETED' | 'SKIPPED'

export interface Category {
  id: string
  name: string
  icon: string
  slug: string
  description: string | null
}

export interface Domain {
  id: string
  categoryId: string
  name: string
  slug: string
  description: string | null
  category?: Category
}

export interface Topic {
  id: string
  domainId: string
  name: string
  icon: string
  color: string
  slug: string
  description: string | null
  isActive: boolean
  domain?: Domain
}

export interface Lesson {
  id: string
  topicId: string
  title: string
  concept: string
  explanation: string
  codeExample: string | null
  keyTakeaway: string
  difficulty: Difficulty
  order: number
  docRef: string | null
  isActive: boolean
  source: LessonSource
  createdAt: string
  topic?: Topic
  quiz?: Quiz
}

export interface Quiz {
  id: string
  lessonId: string
  createdAt: string
  questions: QuizQuestion[]
}

export interface QuizQuestion {
  id: string
  quizId: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
  order: number
}

export interface UserLessonState {
  id: string
  userId: string
  lessonId: string
  state: LessonState
  unlockedAt: string
  completedAt: string | null
}
