export type SessionMode = 'FOCUSED' | 'SHALLOW'
export type ExpertiseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'

export interface User {
  id: string
  email: string | null
  name: string | null
  avatarUrl: string | null
  supabaseId: string
  streak: number
  longestStreak: number
  sessionMode: SessionMode
  createdAt: string
  lastActiveAt: string | null
}

export interface UserTopic {
  id: string
  userId: string
  topicId: string
  expertiseLevel: ExpertiseLevel
  yearsExp: number | null
  addedAt: string
  topic?: Topic
  progress?: UserTopicProgress
}

export interface UserDomain {
  id: string
  userId: string
  domainId: string
  domain?: Domain
}

export interface UserInterest {
  id: string
  userId: string
  categoryId: string
  category?: Category
}

export interface UserTopicProgress {
  id: string
  userId: string
  topicId: string
  currentLevel: ExpertiseLevel
  lessonsCompleted: number
  quizzesPassed: number
  accuracy: number
  lastStudiedAt: string | null
}

// Forward references — these are defined in content.ts but needed here for joined fields
import type { Topic, Domain, Category } from './content'
