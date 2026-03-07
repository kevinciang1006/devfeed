# DevFeed API — Claude Context

Backend: Express + TypeScript + Drizzle + Supabase
Location: apps/api/
Port: 3001 (dev)

---

## Folder Structure

```
apps/api/src/
  index.ts              Server entry — middleware setup, route mounting, error handler
  db/
    schema.ts           Drizzle schema — all table definitions
    index.ts            DB connection (postgres driver + drizzle instance)
    seed.ts             Seed script — categories, domains, topics, lessons, quizzes
  middleware/
    auth.ts             requireAuth + optionalAuth (Supabase JWT verification)
    errorHandler.ts     Global Express error handler
  routes/
    auth.ts             POST /api/auth/sync, GET /api/auth/me
    topics.ts           GET/POST /api/topics, GET/POST/DELETE /api/topics/user
    lessons.ts          GET /api/lessons/next/:topicId, POST start/complete
    quiz.ts             POST /api/quiz/:quizId/attempt, POST /api/quiz/generate/:lessonId
    sessions.ts         POST /api/sessions/complete
    progress.ts         GET /api/progress
  services/
    ai.ts               Claude API calls — generateLesson(), generateQuiz()
    progression.ts      Recommendation logic — getNextLesson()
    streak.ts           Streak calculation — updateStreak()
  types/
    express.d.ts        Extends Express Request with req.user
```

---

## Conventions — Routes

- Every route file exports an Express Router
- Route handlers are async functions
- ALL handlers wrapped in try/catch — errors passed to next(err), never swallowed
- Request bodies validated with Zod before any use — reject early with 400 if invalid
- Routes only handle HTTP layer: parse input, call service, return response
- No business logic or DB queries inline in route handlers — use services/

```typescript
// Correct pattern
router.post('/complete', requireAuth, async (req, res, next) => {
  try {
    const body = completeSessionSchema.parse(req.body)   // Zod validation first
    const result = await sessionService.complete(req.user.id, body)  // service call
    res.json({ data: result })                           // consistent response shape
  } catch (err) {
    next(err)                                            // always pass to error handler
  }
})
```

---

## Conventions — Services

- All DB queries live in services/ — never in route handlers
- Services are plain async functions — no classes
- Services receive userId and validated input — never raw req objects
- Import DB instance from `../db`
- Import types from `@devfeed/shared`

```typescript
// Correct pattern
import { db } from '../db'
import { lessons, userLessonStates } from '../db/schema'
import type { Lesson } from '@devfeed/shared'

export async function getNextLesson(userId: string, topicId: string): Promise<Lesson | null> {
  // query logic here
}
```

---

## Conventions — Database (Drizzle)

- Schema defined in `db/schema.ts` — all tables in one file
- Column naming: snake_case in DB, camelCase in TypeScript (Drizzle maps automatically)
- Always use Drizzle query builder — never raw SQL strings unless absolutely necessary
- Never use Supabase JS client (`supabase.from()`) for DB queries — Drizzle only
- Transactions for multi-step writes that must be atomic

```typescript
// Correct — Drizzle query
const result = await db
  .select()
  .from(lessons)
  .where(eq(lessons.topicId, topicId))
  .orderBy(asc(lessons.order))

// Wrong — never do this
const result = await supabase.from('lessons').select('*')
```

---

## Conventions — Auth Middleware

- `requireAuth` — verifies Supabase JWT, attaches user to req.user, returns 401 if invalid
- `optionalAuth` — attaches user if token present, never blocks
- req.user shape: `{ id: string, supabaseId: string, email: string, name: string }`
- Always use requireAuth on routes that touch user data
- The supabaseId is the Supabase auth.users id — our internal id is different

```typescript
// Protected route
router.get('/me', requireAuth, async (req, res, next) => {
  // req.user is guaranteed to exist here
  const user = await userService.getFullProfile(req.user.id)
})
```

---

## Conventions — Response Shape

Always use consistent response shapes:

```typescript
// Success
res.json({ data: result })
res.json({ data: result, meta: { total, page } })  // paginated

// Error (handled by errorHandler.ts, not manually)
next(new AppError('Not found', 404))
```

Never mix — don't sometimes return `{ user }` and other times `{ data: user }`.

---

## Conventions — AI Service

- `ai.ts` is the ONLY file that imports Anthropic SDK
- Both functions must return typed objects matching `@devfeed/shared` types
- Always instruct Claude to return JSON only — strip markdown fences before parsing
- Always wrap JSON.parse in try/catch — AI responses can occasionally malform
- Log the raw response before parsing if debugging

```typescript
// Always strip fences before parsing
const text = (message.content[0] as { text: string }).text
const clean = text.replace(/```json|```/g, '').trim()
const lesson = JSON.parse(clean) as LessonData
```

---

## Conventions — Error Handling

- `errorHandler.ts` is the global Express error handler (last middleware in index.ts)
- Create an `AppError` class with `message` and `statusCode`
- All route errors call `next(err)` — never `res.status(500).json(...)` manually
- Log errors with context (userId, route, timestamp) before responding
- Never expose internal error details to client in production

---

## Conventions — Zod Schemas

- Define Zod schemas at the top of each route file (not in a separate file unless reused)
- Name them `[action][Resource]Schema` — e.g. `saveUserTopicsSchema`, `submitQuizSchema`
- Parse with `.parse()` — throws ZodError on failure, caught by try/catch → next(err)
- errorHandler converts ZodError to 400 with validation message

---

## Adding a New Route

1. Create route file in `src/routes/newThing.ts`
2. Create service file in `src/services/newThing.ts`
3. Define Zod schema for request body
4. Mount router in `src/index.ts` → `app.use('/api/new-thing', newThingRouter)`
5. Add types to `packages/shared/src/types/api.ts`
6. Update `docs/API.md`
7. Update root `CLAUDE.md` build status if it's a significant feature

---

## Adding a New DB Table

1. Add table definition to `src/db/schema.ts`
2. Run `npm run db:push` to apply to Supabase
3. Add corresponding TypeScript types to `packages/shared/src/types/`
4. Export from `packages/shared/src/index.ts`
5. Update `docs/DATA_MODEL.md`