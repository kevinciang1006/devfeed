# DevFeed — Project Context

This is the root context file. Nested CLAUDE.md files in each app/package contain
specific conventions for that workspace. Read all of them when working across the monorepo.

---

## What is DevFeed?

A personalized daily learning feed for software engineers. Replaces doom scrolling with
short, structured learning sessions. Core loop: read a lesson card (2-3 min) → take a
3-question quiz → streak updated → done.

Think: Duolingo meets official documentation.

---

## Monorepo Structure

```
devfeed/
  apps/
    api/          Express backend → see apps/api/CLAUDE.md
    web/          React + Vite PWA → see apps/web/CLAUDE.md
  packages/
    shared/       TypeScript types only → see packages/shared/CLAUDE.md
  docs/
    PRD.md            Product requirements
    ARCHITECTURE.md   Stack decisions + reasoning
    DATA_MODEL.md     Full schema documentation
    API.md            Endpoint reference
  CLAUDE.md       This file
```

---

## Tech Stack (quick reference)

| Layer | Tech |
|---|---|
| Frontend | React + Vite + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Client state | Zustand |
| Server state | TanStack Query |
| Backend | Express + TypeScript |
| ORM | Drizzle |
| Database + Auth | Supabase (PostgreSQL + Google OAuth) |
| AI | Anthropic Claude API (claude-sonnet-4-20250514) |
| Hosting | Vercel (web) + Railway (api) |
| PWA | vite-plugin-pwa |
| Shared types | packages/shared |

Full reasoning for every decision is in `docs/ARCHITECTURE.md`.

---

## Environment Variables

```bash
# apps/api/.env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
ANTHROPIC_API_KEY=
PORT=3001
NODE_ENV=development

# apps/web/.env
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

---

## Running the Project

```bash
npm install           # from root — installs all workspaces
npm run dev           # starts both api (3001) and web (5173)
npm run dev:api       # api only
npm run dev:web       # web only
npm run db:push       # push Drizzle schema to Supabase
npm run db:seed       # seed categories, topics, React lessons + quizzes
```

---

## Design System (global rules)

- **Dark theme only** — never add a light theme without explicit instruction
- **Fonts:** `Space Mono` for logo/code/labels, `Syne` for everything else
- **Colors:** bg `#080808`, surface `#0f0f0f`, border `#1a1a1a`, text `#e0e0e0`, muted `#666666`
- **Cards:** surface bg + border, rounded-xl or rounded-2xl — NO box shadows, NO gradients
- **Topic accent colors:** only for icon color, selected borders, small badges — never as backgrounds

---

## Security Rules (never violate these)

- `ANTHROPIC_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` never touch the frontend
- All Claude API calls happen server-side in `apps/api/src/services/ai.ts`
- All DB queries go through Drizzle in the Express backend — never via Supabase JS client
- All protected API routes require `Authorization: Bearer <supabase_jwt>`

---

## Current Build Status

Update this section after each meaningful session.

- [x] Monorepo scaffolded
- [x] Drizzle schema — all tables
- [x] Express server + all routes
- [x] Supabase auth middleware
- [x] AI service (lesson + quiz generation)
- [x] Streak service
- [x] React frontend — all pages
- [x] Google OAuth
- [x] TanStack Query hooks
- [x] PWA config
- [x] Seed data (React lessons + quizzes)
- [ ] Deployment (Vercel + Railway)
- [ ] DATA_MODEL.md + API.md docs
- [ ] Working push notifications
- [ ] Achievement badges
- [ ] Browser extension

---

## Key Product Decisions (do not reverse without updating docs)

- Sessions are short and complete — 1 lesson + quiz = done, no infinite scroll
- Progression is loose — recommendations shift but nothing is hard-blocked
- Content is factual — lessons are doc-based, not opinion or "best practices debates"
- Hybrid content — pre-generated pool + AI fills gaps, never AI-only
- Session mode: FOCUSED (1 deep lesson) or SHALLOW (quick overview) — user selectable