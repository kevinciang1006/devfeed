# DevFeed Shared Package — Claude Context

Location: packages/shared/
Purpose: TypeScript types ONLY — shared between apps/api and apps/web

---

## The One Rule

This package contains types and interfaces only.

**Allowed:**
- TypeScript `type` declarations
- TypeScript `interface` declarations
- TypeScript `enum` declarations
- Re-exports from type files

**Not allowed:**
- Functions
- Classes
- Constants (except enums)
- Any runtime code whatsoever
- Imports from apps/api or apps/web
- Any npm dependencies (devDependencies for TypeScript only)

If you find yourself wanting to add a utility function here, put it in the app that needs it.
If both apps need it, question whether it's actually shared logic or just similar logic.

---

## File Structure

```
packages/shared/src/
  types/
    user.ts       User, UserTopic, UserDomain, UserInterest, UserTopicProgress
    content.ts    Category, Domain, Topic, Lesson, Quiz, QuizQuestion, LessonState
    progress.ts   LessonRead, QuizAttempt, LearningSession, StreakLog, Achievement
    api.ts        All request + response shapes for every API endpoint
  index.ts        Barrel export — re-exports everything from types/
```

---

## Adding New Types

1. Determine which file the type belongs in (user/content/progress/api)
2. Add the type with full JSDoc if non-obvious
3. Export from the file
4. Export from `index.ts` barrel (if not already covered by `export *`)
5. Update both apps to use the new type if replacing a local definition

---

## Keeping api.ts in Sync

`api.ts` defines every request body and response shape for the Express API.
When an API endpoint changes:
1. Update the type in `api.ts` first
2. Then update the Express route to match
3. Then update the frontend API client to match
4. TypeScript will catch mismatches automatically

This is the main value of this package — when you change an API contract,
TypeScript errors in both apps tell you exactly what needs updating.

---

## Import Alias

Both apps resolve `@devfeed/shared` to this package's source directly:
- `apps/api`: via `tsconfig.json` paths
- `apps/web`: via `vite.config.ts` resolve.alias

No build step needed. If TypeScript can't find `@devfeed/shared`, check these configs first.