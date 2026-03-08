# DevFeed Web — Claude Context

Frontend: React + Vite + TypeScript + Tailwind + shadcn/ui
Location: apps/web/
Port: 5173 (dev)
PWA: yes (vite-plugin-pwa, installable on iPhone/Android)

---

## Folder Structure

```
apps/web/src/
  main.tsx              App entry — QueryClient, Router, Supabase providers
  App.tsx               Root component — auth gate, route rendering
  env.d.ts              Vite env type declarations
  lib/
    supabase.ts         Supabase client instance (anon key only)
    api.ts              Base fetch wrapper only — no endpoint calls here
    queryClient.ts      TanStack Query client config
    utils.ts            cn() utility (clsx + tailwind-merge)
  services/
    auth.service.ts     syncUser(), getMe()
    topic.service.ts    getAllTopics(), getUserTopics(), saveUserTopics(), removeUserTopic()
    lesson.service.ts   getNextLesson(), getLessonById(), startLesson(), completeLesson()
    quiz.service.ts     submitQuizAttempt(), generateQuiz()
    session.service.ts  completeSession()
    progress.service.ts getProgress()
  store/
    useAppStore.ts      Zustand store — user, selectedTopics, currentLesson, sessionMode
  hooks/
    useAuth.ts          Auth state, signInWithGoogle, signOut
    useLesson.ts        useNextLesson, useStartLesson, useCompleteLesson
    useQuiz.ts          useSubmitQuiz
    useProgress.ts      useProgress, useUserTopics, useSaveTopics
  components/
    ui/                 shadcn/ui components — do not edit these directly
    layout/
      AppLayout.tsx     Sidebar + main + bottom nav shell
      Sidebar.tsx       Desktop nav
      BottomNav.tsx     Mobile nav (fixed bottom)
    shared/
      LoadingPulse.tsx  Pulsing dot loader
      TopicChip.tsx     Topic pill with accent color
      StatCard.tsx      Large number + label card
      SectionLabel.tsx  All-caps monospace label
      DifficultyBadge.tsx  Colored difficulty pill
  pages/
    Login.tsx
    Onboarding.tsx      4-step flow: category → domain → topics+level → interests
    Dashboard.tsx
    Learn.tsx
    Quiz.tsx
    Progress.tsx
    Settings.tsx
  router/
    index.tsx           React Router v6 — routes, ProtectedRoute, OnboardingGuard
  data/
    topics.ts           TOPICS constant array — single source of truth for UI topic data
  styles/
    globals.css         Tailwind directives + CSS variables + font imports
```

---

## Conventions — State Management

Two layers, used for different things:

**TanStack Query** — all server state (anything from the API)
- Fetch with `useQuery`, mutate with `useMutation`
- Every query has a stable `queryKey` — see keys below
- Invalidate related queries after mutations
- Never use useEffect + fetch for server data

**Zustand** — client-only state (UI state, current session data)
- User profile (set after auth sync)
- Current lesson and quiz (passed between pages via store, not router state for complex objects)
- Session mode (FOCUSED/SHALLOW)

```typescript
// Query keys — always use these exact keys for consistency
const QUERY_KEYS = {
  progress: ['progress'],
  userTopics: ['userTopics'],
  nextLesson: (topicId: string) => ['nextLesson', topicId],
  lesson: (id: string) => ['lesson', id],
}
```

---

## Conventions — Components

- Functional components only — no class components
- Props interfaces defined inline above the component (not exported unless reused)
- Default export for page components, named exports for shared components
- Never put business logic in components — extract to hooks
- Components receive data as props or read from hooks — never directly from store unless global UI state

```typescript
// Correct — data comes from hook
export function Dashboard() {
  const { data: progress } = useProgress()
  return <StatCard value={progress?.streak} label="DAY STREAK" />
}

// Wrong — don't fetch in components
export function Dashboard() {
  const [progress, setProgress] = useState(null)
  useEffect(() => {
    fetch('/api/progress').then(...)  // never do this
  }, [])
}
```

---

## Conventions — API Calls

`lib/api.ts` contains ONLY the base `fetchAPI` wrapper — no endpoint-specific functions.
All endpoint calls live in `services/*.service.ts` files, grouped by domain.
Never use `fetch()` directly in components or hooks.

`lib/api.ts` automatically:
- Prepends `VITE_API_URL`
- Adds `Authorization: Bearer <token>` from current Supabase session
- Adds `Content-Type: application/json`
- Throws on non-2xx responses with error message
- Unwraps `{ data: ... }` response envelope

```typescript
// In hooks — import from service files, not lib/api.ts
import { getNextLesson } from '../services/lesson.service'

export function useNextLesson(topicId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.nextLesson(topicId),
    queryFn: () => getNextLesson(topicId),
    enabled: !!topicId,
  })
}
```

---

## Conventions — Routing

- React Router v6 with `createBrowserRouter`
- `ProtectedRoute` — redirects to /login if no auth session
- `OnboardingGuard` — redirects to /onboarding if user has no topics saved
- Navigation: always use `useNavigate()` hook or `<Link>` — never `window.location`
- Pass simple data between routes via router state (`navigate('/quiz', { state: { lesson } })`)
- Pass complex/persistent data via Zustand store

---

## Conventions — Styling

- Tailwind utility classes only — no inline styles, no CSS modules
- Use `cn()` from `lib/utils.ts` for conditional classes (clsx + tailwind-merge)
- Follow design system colors — use CSS variables not hardcoded hex in classes
- Exception: topic accent colors are dynamic (from TOPICS data) — use inline style for color only

```typescript
// Correct — conditional classes
<button className={cn(
  'rounded-xl border px-4 py-2',
  isSelected && 'border-white text-white',
  !isSelected && 'border-border text-muted'
)} />

// Correct — dynamic topic color (only exception to no inline styles)
<div style={{ borderColor: topic.color }} className="border rounded-xl" />

// Wrong — hardcoded hex in className
<div className="border-[#61DAFB]" />  // avoid this
```

---

## Conventions — TypeScript

- Import all types from `@devfeed/shared` — never redefine locally
- `unknown` over `any` — narrow with type guards
- API response types from `@devfeed/shared/types/api.ts`

```typescript
// Correct
import type { Lesson, GetNextLessonResponse } from '@devfeed/shared'

// Wrong — never redefine what exists in shared
interface Lesson {   // don't do this
  id: string
  title: string
  ...
}
```

---

## Conventions — Auth

- Auth state lives in `useAuth.ts` hook (wraps Supabase `onAuthStateChange`)
- On login: hook calls `POST /api/auth/sync`, sets user in Zustand store
- On logout: clears store, navigates to /login
- Never check auth state by reading Supabase session directly in components — use `useAuth()`
- Google OAuth only for v1 — do not add email/password auth without updating this file

---

## Shared Components — Usage Guide

**LoadingPulse**
```tsx
<LoadingPulse label="GENERATING LESSON" />
// Use when: AI is generating content, takes 2-3s
// Full height centered, pulsing purple dot + all-caps label
```

**TopicChip**
```tsx
<TopicChip topicId="react" size="sm" />
// Use when: showing a topic reference inline (recent sessions, badges)
// Looks up topic from TOPICS constant automatically
```

**StatCard**
```tsx
<StatCard value={7} label="DAY STREAK" emoji="🔥" />
// Use when: dashboard stats row, progress page stats
```

**SectionLabel**
```tsx
<SectionLabel>YOUR TOPICS</SectionLabel>
// Use for: every section header in the app
// Renders: Space Mono, 10px, all-caps, muted, wide tracking
```

**DifficultyBadge**
```tsx
<DifficultyBadge difficulty="INTERMEDIATE" />
// Use when: lesson card header, lesson list items
// Colors: BEGINNER=green, INTERMEDIATE=yellow, ADVANCED=red
```

---

## Adding a New Page

1. Create `src/pages/NewPage.tsx`
2. Add route in `src/router/index.tsx`
3. Add nav item in `Sidebar.tsx` and `BottomNav.tsx` if it should appear in nav
4. Create any needed hooks in `src/hooks/`
5. Add API function to the appropriate `src/services/*.service.ts` file
6. Update root `CLAUDE.md` build status

---

## Adding a New Shared Component

1. Create in `src/components/shared/NewComponent.tsx`
2. Named export (not default)
3. Props interface defined in same file
4. Document usage in this file under "Shared Components — Usage Guide"

---

## PWA Notes

- `vite-plugin-pwa` configured in `vite.config.ts`
- Manifest: name=DevFeed, theme_color=#080808, display=standalone
- Service worker handles app shell caching — API responses are NOT cached (always fresh)
- To test PWA install: build + preview (`npm run build && npm run preview`), then open in mobile Safari
- Do not cache API responses in service worker — learning data must always be current

---

## React Best Practices (from vercel-react-best-practices)

> Source: `.agents/skills/vercel-react-best-practices/`. Our existing conventions take precedence.

### Eliminating Waterfalls (CRITICAL)
- Move `await` into branches where actually used — don't block early
- Use `Promise.all()` for independent async operations
- Use Suspense boundaries to stream content progressively

### Bundle Size (CRITICAL)
- Import directly from modules — avoid barrel files (`index.ts` re-exports)
- Use dynamic imports (`React.lazy`) for heavy components not needed on initial load
- Load analytics/third-party scripts after hydration

### Re-render Optimization (MEDIUM)
- Derive state during render — never use `useEffect` to sync derived values
- Use functional `setState` for stable callbacks (`setCount(c => c + 1)`)
- Use `useRef` for transient values that don't need re-renders (timers, flags)
- Hoist default non-primitive props to module scope to avoid re-renders
- Use `startTransition` for non-urgent state updates

### Rendering (MEDIUM)
- Use ternary `? :` instead of `&&` for conditional rendering when the condition can be `0` or `NaN`
- Extract static JSX outside component functions
- Use `content-visibility: auto` for long scrollable lists

### JavaScript (LOW-MEDIUM)
- Use `Set`/`Map` for O(1) lookups instead of `array.includes()`/`array.find()`
- Return early from functions — avoid deep nesting
- Cache expensive computations; hoist `RegExp` creation outside loops

---

## Composition Patterns (from vercel-composition-patterns)

> Source: `.agents/skills/vercel-composition-patterns/`. Our existing conventions take precedence.

### Component Architecture (HIGH)
- Avoid boolean prop proliferation — each boolean doubles possible states
- Use composition: create explicit variant components instead of `isX`/`hasY` props
- Structure complex UI with compound components sharing context

### State Management
- Provider components are the only place that knows how state is managed
- Lift state into providers when siblings need access
- Define generic context interfaces: `{ state, actions, meta }`

### Implementation Patterns
- Prefer `children` for composition over `renderX` callback props
- Use render props only when the parent needs to pass data back to children
- Create explicit variant components instead of boolean mode switches

---

## Web Design Guidelines (from web-design-guidelines)

> Source: `.agents/skills/web-design-guidelines/`. Our existing conventions take precedence.

### Accessibility
- Icon-only buttons require `aria-label`; form inputs need `<label>` or `aria-label`
- All interactive elements must be keyboard-navigable with visible `focus-visible` rings
- Use semantic HTML (`<button>`, `<a>`, `<label>`) before ARIA roles
- Decorative icons get `aria-hidden="true"`; meaningful images need `alt` text

### Forms
- Inputs require correct `type` (`email`, `tel`, `url`) and `autocomplete` attribute
- Labels must be clickable; display errors inline; focus first error on submit
- Submit buttons stay enabled until request starts, then show loading state

### Animation & Transitions
- Respect `prefers-reduced-motion` — disable or reduce animations
- Animate only `transform` and `opacity` (compositor-friendly properties)
- Never use `transition: all` — list specific properties
- Animations must be interruptible by user input

### Text & Typography
- Apply `font-variant-numeric: tabular-nums` for numeric columns/stats
- Handle text overflow: use `truncate`, `line-clamp-*`, or `break-words`
- Flex children need `min-w-0` for text truncation to work

### Images & Performance
- `<img>` requires explicit `width` and `height` to prevent layout shift
- Below-fold images use `loading="lazy"`
- Virtualize lists exceeding ~50 items

### Touch & Mobile
- Apply `touch-action: manipulation` to prevent double-tap zoom delay
- Modals/drawers use `overscroll-behavior: contain`

### Navigation & State
- URL should reflect filterable/paginated state via query params
- Destructive actions need confirmation or undo — never immediate