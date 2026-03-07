# DevFeed — Product Requirements Document

**Version:** 1.0
**Status:** In Development
**Last Updated:** March 2026
**Author:** Kevin

---

## 1. Problem Statement

Software engineers spend significant downtime doom scrolling — YouTube, Instagram, Facebook. The content is passive, addictive by design, and leaves nothing behind. Meanwhile, most engineers feel a persistent gap between the tools they use daily and how deeply they actually understand them.

The specific pain: a developer can use React for two years and still not fully understand reconciliation, referential equality, or why their app re-renders unexpectedly. The knowledge exists in official docs, but reading docs feels like homework — there's no hook, no progression, no reward.

A secondary pain: when exploring topics outside your expertise (economics, geopolitics, business), unfamiliar jargon breaks the flow. You pause, Google a term, lose the thread, give up.

---

## 2. Solution

DevFeed is a **personalized daily learning feed** that replaces passive scrolling with active, structured learning. It delivers short, fact-based lesson cards tailored to what you actually use at work — then immediately tests your understanding with a quick quiz.

The product is designed to feel like social media (feed, streak, daily habit) but leaves you feeling informed rather than drained.

**Core insight:** The session must feel *complete*. One lesson + one quiz = done. No infinite scroll. No "just one more." A natural stopping point is a feature, not a limitation.

---

## 3. Target Users

**Primary: The Working Engineer**
- Job title: Software Engineer, Frontend Developer, Full Stack Developer
- Uses specific tools daily (React, TypeScript, Node.js, etc.)
- Competent but aware of gaps in foundational knowledge
- Has downtime (commute, lunch, before bed) currently spent scrolling
- Motivated by mastery, not just completion

**Secondary: The Curious Professional**
- Interested in topics adjacent to their work (economics, business, product)
- Finds long-form content (articles, books) hard to start
- Wants accessible, fact-based entry points into unfamiliar domains

---

## 4. User Journey

### First Time
1. Sign up with Google (one click)
2. Onboarding (4 steps, ~2 minutes):
   - Step 1: Pick your main focus area (Technology, Business, etc.)
   - Step 2: Pick your role (Frontend Dev, Backend Dev, etc.)
   - Step 3: Pick your stack + set expertise level per tool (Beginner / Intermediate / Advanced)
   - Step 4: Pick any other interests (optional)
3. Land on Dashboard — personalized feed ready immediately

### Daily Use
1. Open app (home screen icon, feels native — it's a PWA)
2. Dashboard shows today's recommended lesson
3. Tap topic → read lesson card (2-3 min)
4. Tap "Test Yourself" → answer 3 questions (1-2 min)
5. See score + explanations
6. Session complete — streak updated
7. Close app feeling like you actually learned something

### Exploration
- Browse all topics, not just your stack
- Pick any topic and start from its beginning
- No penalty for going off-track

---

## 5. Core Features — V1

### 5.1 Onboarding
- Google OAuth sign-in
- Category selection (Technology, Business, Economics, etc.)
- Domain/role selection (Frontend Dev, Backend Dev, etc.)
- Topic selection with expertise level per topic (Beginner / Intermediate / Advanced, optional years of experience)
- Extra interests selection (optional)
- Redirects to dashboard on completion

### 5.2 Lesson Feed
- One recommended lesson per session (FOCUSED mode)
- Lesson card contains:
  - Concept label (what specific thing is being taught)
  - Title
  - Explanation (3-4 sentences, factual, doc-based)
  - Code example (where applicable)
  - Key Takeaway (one sentence summary)
  - Link to official docs
- Content is structured: foundational → practical → advanced
- Prerequisites enforced loosely (recommendations shift, nothing hard-blocked)
- "New Lesson" option to skip current and get another

### 5.3 Quiz
- 3 multiple choice questions per lesson
- All questions shown at once
- Submit when all answered
- Results show: score, correct answers, explanation per question
- Score affects accuracy metric and recommendation weighting

### 5.4 Progress Tracking
- **Streak:** days in a row with at least one completed session
- **Lessons read:** total lifetime count
- **Quiz accuracy:** rolling percentage across all attempts
- **Per-topic progress:** lessons completed + accuracy per topic
- **Weekly activity:** heatmap of last 7 days
- **Recent sessions:** last 10 sessions with topic, lesson title, score, date

### 5.5 Session Modes
- **Focused** (default): 1 deep lesson per session
- **Shallow**: quicker overview-style lessons (shorter explanation, simpler quiz)
- Selectable in settings

### 5.6 Topic Management
- Add/remove topics anytime via Settings
- Update expertise level per topic
- New topics immediately surface appropriate lessons

### 5.7 PWA
- Installable on iPhone and Android via "Add to Home Screen"
- Launches fullscreen, feels native
- Works on desktop too

---

## 6. Out of Scope — V1

These are intentionally excluded from V1 but designed for in the data model:

- **Social features** (friends, leaderboards, shared streaks)
- **Push notifications** (daily reminder toggle exists in UI but does nothing)
- **Browser extension** (quiz from any docs page — separate product, same backend)
- **Spaced repetition** (resurface poorly-scored lessons — data is captured, algorithm not built)
- **Content versioning** (React 18 vs 19 lesson variants)
- **Inline term explanation** (tap any jargon for a 2-sentence definition)
- **Native mobile app** (Flutter or React Native)
- **Admin content management** (lessons managed via seed scripts for now)
- **Payments / premium tier**

---

## 7. Content Model

### Sources
- **Pre-generated pool:** Lessons created by script, stored in DB. Served instantly.
- **AI-generated:** Claude fills gaps when a user exhausts a topic's pre-generated content.

### Quality bar
- All lessons are **factual and doc-based** — not opinion, not "best practices debates"
- Explanations are precise, specific, and accurate — not vague or motivational
- Code examples are short, practical, and runnable
- Quiz questions test understanding, not memorization
- Wrong answer options are plausible (not obviously wrong)

### Structure
Topics are organized as:
```
Category (Technology)
  └── Domain (Frontend Development)
        └── Topic (React)
              └── Lesson 1: Components and Props [BEGINNER, order: 1]
              └── Lesson 2: State with useState [BEGINNER, order: 2]
              └── Lesson 3: useEffect [BEGINNER, order: 3]
              └── Lesson 4: useCallback [INTERMEDIATE, order: 4, requires: Lesson 2]
              └── ...
```

---

## 8. Success Metrics — V1

Since this starts as a personal tool:

| Metric | Target |
|---|---|
| Daily active use | Used personally every day |
| Session completion rate | >80% of started sessions result in quiz completion |
| Average session length | 5-7 minutes |
| Streak | Maintain a 7-day streak within first 2 weeks |
| Subjective | Feels noticeably better than scrolling after 2 weeks |

If opened to other users:
| Metric | Target |
|---|---|
| D7 retention | >40% |
| Sessions per DAU | >1.2 |
| Quiz completion rate | >75% |
| Average streak (active users) | >4 days |

---

## 9. Future Roadmap

### V1.1 — Habit reinforcement
- Working push notifications (daily reminder)
- Streak freeze (1 grace day per week)
- Achievement badges (First Lesson, 7-day streak, React Fundamentals Complete)
- Inline jargon explanation (tap any word → 2-sentence plain English definition)

### V1.2 — Content expansion
- More seeded topics (TypeScript, TanStack Query, Node.js, Vite, Economics)
- Content versioning (track which doc version lesson is based on)
- User-reported content issues ("this seems outdated")

### V2 — Browser extension
- Chrome/Firefox extension
- Detects when user is on a docs page
- "Generate Quiz" button — quizzes you on what you just read
- Same backend, same progress tracking

### V3 — Social layer
- Optional: share streak publicly
- Friend streaks (see if friends are learning today)
- Topic leaderboards (not competitive, just visibility)

### V4 — Adaptive learning
- Spaced repetition: resurface lessons you scored poorly on
- Diagnostic assessment: 5-question quiz on signup to place you accurately
- Level progression: automatically promote BEGINNER → INTERMEDIATE when consistency proven

---

## 10. Open Questions

- **Streak reset policy:** Hard reset on missed day (like Duolingo) or grace period? Currently: hard reset. Revisit if it causes frustration.
- **Session mode:** Is Focused vs Shallow the right framing? Could also be "Deep Dive" vs "Quick Hit". Naming TBD.
- **Content refresh cadence:** How often should pre-generated lesson pool be refreshed? Monthly? On doc version change? No answer yet.
- **Expertise level self-reporting:** Users often under/over-estimate. Consider adding optional 5-question diagnostic to calibrate. Punted to V1.1.
