import { create } from 'zustand'
import type { User, UserTopic, Lesson, Quiz } from '@devfeed/shared'

interface AppStore {
  user: User | null
  selectedTopics: UserTopic[]
  currentLesson: Lesson | null
  currentQuiz: Quiz | null
  sessionMode: 'FOCUSED' | 'SHALLOW'

  setUser: (user: User | null) => void
  setSelectedTopics: (topics: UserTopic[]) => void
  setCurrentLesson: (lesson: Lesson | null) => void
  setCurrentQuiz: (quiz: Quiz | null) => void
  setSessionMode: (mode: 'FOCUSED' | 'SHALLOW') => void
  clearSession: () => void
}

export const useAppStore = create<AppStore>((set) => ({
  user: null,
  selectedTopics: [],
  currentLesson: null,
  currentQuiz: null,
  sessionMode: 'FOCUSED',

  setUser: (user) => set({ user }),
  setSelectedTopics: (topics) => set({ selectedTopics: topics }),
  setCurrentLesson: (lesson) => set({ currentLesson: lesson }),
  setCurrentQuiz: (quiz) => set({ currentQuiz: quiz }),
  setSessionMode: (mode) => set({ sessionMode: mode }),
  clearSession: () => set({ currentLesson: null, currentQuiz: null }),
}))
