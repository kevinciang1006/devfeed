# DevFeed — Architecture Document

**Version:** 1.0
**Last Updated:** March 2026

---

## 1. System Overview

DevFeed is a full-stack TypeScript monorepo with a React PWA frontend, Express REST API backend, PostgreSQL database (via Supabase), and Anthropic Claude for AI content generation.

```
┌─────────────────────────────────────────────┐
│                   CLIENT                     │
│  React + Vite PWA  (apps/web)               │
│  TanStack Query · Zustand · shadcn/ui        │
│  Installable on iOS/Android via PWA          │
└──────────────────┬──────────────────────────┘
                   │ HTTPS REST
                   │ Bearer <supabase_jwt>
┌──────────────────▼──────────────────────────┐
│                   API                        │
│  Express + TypeScript  (apps/api)            │
│  Drizzle ORM · Zod validation                │
│  Supabase JWT verification middleware        │
└──────┬───────────────────────┬──────────────┘
       │ SQL (via Drizzle)      │ HTTPS
┌──────▼───────┐      ┌────────▼────────┐
│  Supabase    │      │  Anthropic API  │
│  PostgreSQL  │      │  Claude Sonnet  │
│  + Auth      │      │  (server-side)  │
└──────────────┘      └─────────────────┘
```

---

## 2. Monorepo Structure

```
devfeed/
  apps/
    api/                  Express backend
    web/                  React + Vite frontend
  packages/
    shared/               TypeScript types only
  docs/
    PRD.md
    ARCHITECTURE.md       This file
    DATA_MODEL.md
    API.md
  CLAUDE.md               AI assistant context
  package.json            Root (npm workspaces)
  .env.example
```

npm workspaces manages the monorepo — no Turborepo yet. Added when a third app or shared build pipeline is needed.

---

## 3. Tech Stack Decisions

### 3.1 React + Vite (not Next.js)

**Decision:** Vite over Next.js for the frontend.

**Reasoning:**
- Frontend was initially scaffolded via Lovable (React + Vite)
- No need for SSR — this is an authenticated app, content is user-specific, SEO is not a concern
- Vite's dev server is significantly faster than Next.js for iteration
- PWA support via `vite-plugin-pwa` is straightforward
- Next.js App Router adds complexity (server components, server actions) that doesn't benefit this use case

**Trade-off:** No built-in API routes. Backend lives in a separate Express app.

---

### 3.2 Express (not Hono, not Fastify)

**Decision:** Express for the backend API.

**Reasoning:**
- Most widely understood Node.js framework — enormous community, answers for every problem
- Kevin has prior experience with it
- Hono would be a better choice long-term (TypeScript-native, edge-compatible, faster) but adds unfamiliarity at the wrong time
- Fastify is also excellent but again, unnecessary learning curve for v1

**Migration path:** If performance becomes a concern or Cloud Run deployment is adopted, migrating Express to Hono is straightforward since the API surface is similar.

---

### 3.3 Drizzle ORM (not Prisma, not raw SQL)

**Decision:** Drizzle over Prisma.

**Reasoning:**
- Prisma requires a query engine binary that runs as a sidecar process. This works fine in Next.js but is awkward in a plain Node.js/Express setup, especially when deploying to Supabase Edge Functions or serverless environments.
- Drizzle is pure TypeScript — no binary, no engine, just SQL generation
- Drizzle schema is TypeScript-first and maps cleanly to our data model
- Both provide type-safe queries; Drizzle's are slightly more verbose but more explicit

**Trade-off:** Drizzle has less tooling maturity than Prisma (smaller ecosystem, fewer tutorials). Prisma Studio is better than Drizzle Studio currently.

---

### 3.4 Supabase (not raw AWS RDS / Cloud SQL)

**Decision:** Supabase for database + auth.

**Reasoning:**
- Supabase provides managed PostgreSQL + Auth + Storage in one dashboard
- Auth with Google OAuth is 3 clicks to configure
- Free tier is sufficient for v1 (500MB DB, 50k monthly active users)
- PostgreSQL is standard — no vendor lock-in on the database itself
- If scale requires migration to Cloud SQL or RDS: `pg_dump` → restore → update `DATABASE_URL`. Auth migration is harder but manageable before user numbers get large.

**Important:** We use Supabase for PostgreSQL hosting and Auth only. All DB queries go through Drizzle in the Express backend — NOT through Supabase's JS client (`supabase.from('table').select()`). This keeps the data layer portable.

**Trade-off:** Supabase Auth is the one area of real lock-in. Migrating auth at scale (JWT format, session management, OAuth token re-linking) is painful. Acceptable risk at v1.

---

### 3.5 Anthropic Claude API (claude-sonnet-4-20250514)

**Decision:** Claude Sonnet for all AI content generation.

**Reasoning:**
- Best instruction-following for structured JSON output (lesson cards, quiz questions)
- Reliable at staying factual and doc-based when prompted correctly
- Server-side only — API key never touches the client

**Usage:**
- `generateLesson(topicName, difficulty, previousConcepts[])` → lesson JSON
- `generateQuiz(lesson)` → quiz JSON with 3 questions
- Both functions are in `apps/api/src/services/ai.ts`
- Called only when pre-generated pool is exhausted for a user's topic

**Cost control:** AI generation only triggers when needed (hybrid model). Pre-seeded lessons serve most sessions without any API call.

---

### 3.6 Vercel (not GCP Cloud Run, not AWS)

**Decision:** Vercel for frontend hosting.

**Reasoning:**
- Zero-config deployment for Vite apps — push to GitHub, it deploys
- Free tier covers v1 completely
- Preview deployments per PR are useful for iteration
- Kevin has GCP experience and could use Cloud Run — this is a valid alternative

**Migration:** Moving from Vercel to Cloud Run is one afternoon of work (Dockerfile + GitHub Action). Do it when there's a real reason — cost, compliance, or needing more control.

---

## 4. Authentication Flow

```
1. User clicks "Continue with Google" in web app
2. Supabase Auth handles OAuth redirect to Google
3. Google redirects back to Supabase
4. Supabase redirects to /dashboard with session in URL hash
5. Supabase JS client on frontend extracts + stores session
6. Frontend calls POST /api/auth/sync with Bearer token
7. Express middleware verifies JWT with Supabase service role key
8. Backend upserts user record in users table
9. All subsequent API calls include Bearer token
10. Middleware attaches user to req.user on every protected route
```

---

## 5. Content Generation Flow

### Pre-generated (happy path — most sessions)

```
User opens /learn/:topicId
  → GET /api/lessons/next/:topicId
  → progression service queries userLessonStates (AVAILABLE)
  → filters by difficulty + prerequisites
  → returns lesson from DB
  → lesson renders immediately (no AI call)
```

### AI-generated (fallback — user exhausted topic pool)

```
GET /api/lessons/next/:topicId
  → no AVAILABLE lessons found in DB
  → calls ai.generateLesson(topicName, difficulty, previousConcepts)
  → Claude API returns lesson JSON
  → lesson saved to DB (source: AI_GENERATED)
  → userLessonState created (AVAILABLE)
  → lesson returned to client
  → client shows loading state during generation (~2-3s)
```

---

## 6. Progression System

### Lesson States (per user per lesson)

```
LOCKED → AVAILABLE → COMPLETED
                  ↘ SKIPPED
```

- **LOCKED:** Prerequisites not met. Not shown in recommendations.
- **AVAILABLE:** Ready to be learned. Shown in recommendations.
- **COMPLETED:** Quiz passed (score ≥ 2/3). Unlocks next lesson.
- **SKIPPED:** User explicitly skipped. Treated like COMPLETED for unlocking purposes.

### Recommendation Algorithm

```typescript
// Pseudocode for GET /api/lessons/next/:topicId
const userLevel = getUserExpertiseLevel(userId, topicId)         // BEGINNER|INTERMEDIATE|ADVANCED
const levelFilter = getLevelFilter(userLevel)                     // e.g. INTERMEDIATE → [BEGINNER, INTERMEDIATE]

const nextLesson = await db
  .select()
  .from(lessons)
  .leftJoin(userLessonStates, and(
    eq(userLessonStates.lessonId, lessons.id),
    eq(userLessonStates.userId, userId)
  ))
  .where(and(
    eq(lessons.topicId, topicId),
    eq(lessons.isActive, true),
    inArray(lessons.difficulty, levelFilter),
    or(
      isNull(userLessonStates.state),      // no row yet = treat as AVAILABLE
      eq(userLessonStates.state, 'AVAILABLE')
    )
  ))
  .orderBy(asc(lessons.order))
  .limit(1)

// Then check prerequisites separately and skip if not met
```

### Loose Gating

Nothing is hard-blocked. If a user has no AVAILABLE lessons (all completed or prerequisites unmet), the system generates a new AI lesson rather than blocking them. This preserves the "always something to learn" experience.

---

## 7. Streak System

Streaks are tracked via the `streakLogs` table (one row per user per day) rather than just `lastActiveAt` on the user. This enables:
- Accurate streak history
- Weekly activity heatmap queries
- Streak freeze feature (future)

```typescript
// On session complete:
// 1. Upsert today's streakLog (increment sessionsCount)
// 2. Check if yesterday's streakLog exists
//    - Yes → streak + 1
//    - No, and today is first session → streak = 1
//    - No, and today already processed → no change
// 3. Update user.streak + user.longestStreak
```

---

## 8. Shared Types

`packages/shared` contains all TypeScript interfaces used by both apps.

```
packages/shared/src/
  types/
    user.ts       User, UserTopic, UserDomain, UserInterest, UserTopicProgress
    content.ts    Category, Domain, Topic, Lesson, Quiz, QuizQuestion
    progress.ts   LessonRead, QuizAttempt, LearningSession, StreakLog, Achievement
    api.ts        All request/response shapes for every endpoint
  index.ts        Barrel export
```

Both apps reference via TypeScript path alias:
- `apps/api/tsconfig.json` → paths: `@devfeed/shared`
- `apps/web/vite.config.ts` → resolve.alias: `@devfeed/shared`

No build step — both apps import TypeScript source directly.

---

## 9. PWA Configuration

`vite-plugin-pwa` generates:
- `manifest.json` — app name, icons, display: standalone, theme_color: #080808
- Service worker — caches app shell for offline access
- iOS meta tags — fullscreen, status bar styling

Result: user visits the deployed URL on iPhone Safari → Share → Add to Home Screen → app installs with icon, launches fullscreen, feels native. No App Store, no certificate expiry.

---

## 10. Deployment

### Frontend (Vercel)
- Connect GitHub repo to Vercel
- Set build command: `cd apps/web && npm run build`
- Set output directory: `apps/web/dist`
- Add all `VITE_*` environment variables in Vercel dashboard
- Auto-deploys on push to main

### Backend (options)

**Option A: Supabase Edge Functions** (simplest)
- Rewrite Express routes as Deno edge functions
- Deploy with Supabase CLI
- No separate server to manage

**Option B: Vercel Serverless Functions** (convenient)
- Convert Express routes to Vercel API routes
- Deploy alongside frontend in same repo
- Free tier includes serverless functions

**Option C: Railway / Render** (most flexible, recommended for Express)
- Dockerfile for Express app
- Auto-deploy from GitHub
- ~$5/month on hobby tier

**Option D: GCP Cloud Run** (if Kevin wants full control)
- Docker + GitHub Actions (Kevin has existing experience)
- Most portable, most control
- Worth doing after v1 is validated

**Current recommendation for v1:** Railway for the API (simplest Express deployment) + Vercel for the frontend. Migrate to Cloud Run when there's a real reason.

---

## 11. Future Architecture Considerations

**When to add Turborepo:**
- When you have 3+ packages or build times become noticeable
- When you need remote caching across CI
- Migration is easy: add `turbo.json`, replace `concurrently` with `turbo run dev`

**When to migrate auth away from Supabase:**
- When you need custom auth flows Supabase doesn't support
- When compliance requires self-hosted auth
- When user count makes Supabase Auth pricing significant

**When to add a packages/ui shared component library:**
- If a mobile app (Flutter or React Native) is built alongside the web app
- If an admin dashboard is added
- Current shadcn components live in apps/web only

**Browser extension (V2):**
- Same Express backend
- New `apps/extension` package in monorepo
- Chrome Manifest V3
- Detects docs pages, injects "Generate Quiz" button
- Calls same `/api/quiz/generate` endpoint
