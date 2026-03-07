import { pgTable, pgEnum, text, integer, boolean, real, timestamp, date, json, unique, serial } from 'drizzle-orm/pg-core'

// Enums
export const difficultyEnum = pgEnum('difficulty', ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
export const lessonSourceEnum = pgEnum('lesson_source', ['PREGENERATED', 'AI_GENERATED'])
export const lessonStateEnum = pgEnum('lesson_state', ['LOCKED', 'AVAILABLE', 'COMPLETED', 'SKIPPED'])
export const sessionModeEnum = pgEnum('session_mode', ['FOCUSED', 'SHALLOW'])

// ── Content tables ──

export const categories = pgTable('categories', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  icon: text('icon').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const domains = pgTable('domains', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  categoryId: text('category_id').notNull().references(() => categories.id),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const topics = pgTable('topics', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  domainId: text('domain_id').notNull().references(() => domains.id),
  name: text('name').notNull(),
  icon: text('icon').notNull(),
  color: text('color').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const lessons = pgTable('lessons', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  topicId: text('topic_id').notNull().references(() => topics.id),
  title: text('title').notNull(),
  concept: text('concept').notNull(),
  explanation: text('explanation').notNull(),
  codeExample: text('code_example'),
  keyTakeaway: text('key_takeaway').notNull(),
  difficulty: difficultyEnum('difficulty').notNull(),
  order: integer('order').notNull(),
  docRef: text('doc_ref'),
  isActive: boolean('is_active').default(true).notNull(),
  source: lessonSourceEnum('source').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const prerequisites = pgTable('prerequisites', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  lessonId: text('lesson_id').notNull().references(() => lessons.id),
  requiresId: text('requires_id').notNull().references(() => lessons.id),
})

export const quizzes = pgTable('quizzes', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  lessonId: text('lesson_id').notNull().references(() => lessons.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const quizQuestions = pgTable('quiz_questions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  quizId: text('quiz_id').notNull().references(() => quizzes.id),
  question: text('question').notNull(),
  options: json('options').$type<string[]>().notNull(),
  correctIndex: integer('correct_index').notNull(),
  explanation: text('explanation').notNull(),
  order: integer('order').notNull(),
})

// ── User profile tables ──

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').unique(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  supabaseId: text('supabase_id').notNull().unique(),
  streak: integer('streak').default(0).notNull(),
  longestStreak: integer('longest_streak').default(0).notNull(),
  sessionMode: sessionModeEnum('session_mode').default('FOCUSED').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastActiveAt: timestamp('last_active_at'),
})

export const userDomains = pgTable('user_domains', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  domainId: text('domain_id').notNull().references(() => domains.id),
}, (t) => ({
  unique: unique().on(t.userId, t.domainId),
}))

export const userTopics = pgTable('user_topics', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  topicId: text('topic_id').notNull().references(() => topics.id),
  expertiseLevel: difficultyEnum('expertise_level').notNull(),
  yearsExp: integer('years_exp'),
  addedAt: timestamp('added_at').defaultNow().notNull(),
}, (t) => ({
  unique: unique().on(t.userId, t.topicId),
}))

export const userInterests = pgTable('user_interests', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  categoryId: text('category_id').notNull().references(() => categories.id),
}, (t) => ({
  unique: unique().on(t.userId, t.categoryId),
}))

// ── Activity tables ──

export const lessonReads = pgTable('lesson_reads', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  lessonId: text('lesson_id').notNull().references(() => lessons.id),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  readDurationSeconds: integer('read_duration_seconds'),
})

export const quizAttempts = pgTable('quiz_attempts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  quizId: text('quiz_id').notNull().references(() => quizzes.id),
  score: integer('score').notNull(),
  total: integer('total').notNull(),
  passed: boolean('passed').notNull(),
  attemptedAt: timestamp('attempted_at').defaultNow().notNull(),
  answers: json('answers').$type<number[]>().notNull(),
})

export const learningSessions = pgTable('learning_sessions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  topicId: text('topic_id').notNull().references(() => topics.id),
  lessonReadId: text('lesson_read_id').references(() => lessonReads.id),
  quizAttemptId: text('quiz_attempt_id').references(() => quizAttempts.id),
  completedAt: timestamp('completed_at').defaultNow().notNull(),
})

// ── Progression tables ──

export const userTopicProgress = pgTable('user_topic_progress', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  topicId: text('topic_id').notNull().references(() => topics.id),
  currentLevel: difficultyEnum('current_level').notNull(),
  lessonsCompleted: integer('lessons_completed').default(0).notNull(),
  quizzesPassed: integer('quizzes_passed').default(0).notNull(),
  accuracy: real('accuracy').default(0).notNull(),
  lastStudiedAt: timestamp('last_studied_at'),
}, (t) => ({
  unique: unique().on(t.userId, t.topicId),
}))

export const userLessonStates = pgTable('user_lesson_states', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  lessonId: text('lesson_id').notNull().references(() => lessons.id),
  state: lessonStateEnum('state').default('AVAILABLE').notNull(),
  unlockedAt: timestamp('unlocked_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
}, (t) => ({
  unique: unique().on(t.userId, t.lessonId),
}))

// ── Gamification tables ──

export const streakLogs = pgTable('streak_logs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  date: date('date').notNull(),
  sessionsCount: integer('sessions_count').default(1).notNull(),
}, (t) => ({
  unique: unique().on(t.userId, t.date),
}))

export const achievements = pgTable('achievements', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  key: text('key').notNull().unique(),
  label: text('label').notNull(),
  description: text('description').notNull(),
  icon: text('icon').notNull(),
})

export const userAchievements = pgTable('user_achievements', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  achievementId: text('achievement_id').notNull().references(() => achievements.id),
  earnedAt: timestamp('earned_at').defaultNow().notNull(),
}, (t) => ({
  unique: unique().on(t.userId, t.achievementId),
}))
