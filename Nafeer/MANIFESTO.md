# NAFEER × BASHEER — Project Manifesto
**v5.2 — March 2026 — Landing Polish + Missing Implementations Wired**

---

## What Is This

**Basheer** — offline-first Android learning app for Sudanese high school students preparing for الشهادة السودانية. Delivers lessons, feed cards, and quiz questions bundled into the APK. No internet needed at runtime.

**Nafeer** — Next.js 15 web companion. Serves two audiences:
1. **Public** — marketing/landing page for Basheer
2. **Private** — content editor where approved contributors curate educational content that gets bundled into Basheer

**Critical architectural fact:** Nafeer does NOT serve content live to students. It produces a static JSON export (`GET /api/export`) that gets compiled into the Android APK. This shapes every decision.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router), React 19, no TypeScript |
| Styling | Tailwind CSS 3, CSS custom properties (dark/light theme) |
| State | Zustand — 6 domain slices |
| Database | MongoDB Atlas 512 MB free tier, Mongoose ODM |
| Auth | jose (JWT) + bcryptjs, two separate cookie systems |
| Animation | GSAP 3.12 + ScrollTrigger (npm, not CDN) |
| Deployment | Vercel free tier — serverless functions only |
| Fonts | Noto Naskh Arabic + Playfair Display + JetBrains Mono (Google Fonts) |

**Hard constraints:** solo dev, no CI/CD, no TypeScript, no WebSockets, no cron, RTL layout throughout (`lang="ar"`, `dir="rtl"`).

---

## File Structure

```
src/
  app/
    page.jsx                        ← public landing
    layout.jsx
    signin/                         ← contributor auth
    join/                           ← contributor signup
    editor/page.jsx                 ← editor shell (auth-gated)
    admin/
      login/page.jsx
      dashboard/page.jsx            ← admin panel (separate auth)
    api/
      auth/signin, signout
      contributors/request
      admin/login, logout, contributors, review-queue
      content/
        subject/                    ← bootstrap + full load
        lessons/[id]/
        sections/[id]/              ← DELETE cascades blocks
        blocks/[id]/
        concepts/[id]/
        feed-items/[id]/
        questions/[id]/
        exams/                      ← GET, POST
        exams/[id]/                 ← PUT, DELETE
      coverage/[subjectId]/
      export/
      dev/autologin/                ← development only, gated by NODE_ENV
  components/
    landing/  Navbar, Hero, Features, ProgressBoard, NafeerSection, Footer
    editor/
      EditorShell, EditorSidebar
      LessonsPage, UnitCard, LessonItem
      LessonEditorPage, SectionEditor, BlockEditor
      ConceptsPage, FeedItemsPage, QuizBankPage, ExportPage
      CoveragePanel (DONE v5.2), StatusBadge, DeleteButton, Modal
      AddBlockMenu, ConceptLinker, TableEditor
      LessonFeedPanel, LessonQuestionsPanel, SubjectOverview, UnitView
  hooks/
    useAtlasSync.js                 ← all Atlas persistence logic
    useCoverageData.js              ← coverage fetch + cache (DONE v5.2)
  lib/
    db.js, auth.js, adminAuth.js
    LessonStatus.js
    api/  guard.js, content.js, Lessons.js, Concepts.js, Questions.js,
          feedItems.js, subject.js, reviewQueue.js
    models/  Unit, Lesson, Section, Block, Concept, Tag, FeedItem,
             Question, Exam, Subject, Contributor, versioning.js
  middleware.js
  shared/  curriculum.js, constants.js
  store/
    index.js (re-exports + composite useDataStore)
    editorStore.js, subjectStore.js, contentStore.js
    conceptStore.js, feedStore.js, quizStore.js
```

### ⚠️ Import Casing Rules (Vercel / Linux FS is case-sensitive)

The following lib files have capital first letters. All imports must match exactly:

| File | Correct import path |
|---|---|
| `src/lib/api/lessons.js` | `@/lib/api/lessons` |
| `src/lib/api/concepts.js` | `@/lib/api/concepts` |
| `src/lib/api/questions.js` | `@/lib/api/questions` |
| `src/lib/api/reviewQueue.js` | `@/lib/api/reviewQueue` |
| `src/lib/api/feedItems.js` | `@/lib/api/feedItems` |

All route files must be named `route.js` (lowercase). Next.js App Router will not recognize `Route.js`.

---

## Data Model

**Atomic unit:** concept (مفهوم). Everything else references concepts.

**Hierarchy:**
```
Subject → Units → Lessons → Sections → Blocks   (lesson content)
Concepts → FeedItems                             (Basheer feed cards)
Questions → Exams                                (quiz bank + past papers)
```

**Subjects:** defined in `src/shared/curriculum.js` as `SUBJECTS_CATALOG`. Immutable IDs. Three tracks: `COMMON` (4 subjects), `SCIENCE` (فيزياء + كيمياء), `LITERARY` (تاريخ + جغرافيا). Major electives per track.

**Versioning:** every model uses `versioningFields` (version, changelog, createdBy, updatedBy). `applyVersionBump()` is called on every content PUT — increments version, appends changelog, resets `atlasStatus` from `approved` → `draft` automatically.

---

## Auth Systems (Two Completely Separate)

**Contributor auth:**
- JWT in cookie `nafeer_token`, signed with jose
- `middleware.js` protects `/editor/*` → redirect to `/signin`
- Contributors manually approved by admin before access
- Each contributor assigned exactly one subjectId (stored in Contributor model)

**Admin auth:**
- JWT in cookie `nafeer_admin`, role must be `"admin"`
- `middleware.js` protects `/admin/dashboard`
- Separate login at `/admin/login`

---

## State Management

Six Zustand slices, re-exported via composite `useDataStore` in `src/store/index.js` for backward compatibility. New components import from domain stores directly.

| Store | Contains |
|---|---|
| `useSubjectStore` | subject, units, lessons |
| `useContentStore` | sections, blocks |
| `useConceptStore` | concepts, tags |
| `useFeedStore` | feedItems |
| `useQuizStore` | questions, exams |
| `useEditorStore` | UI state (active lesson, active page, sync status) |

---

## Atlas Sync — `useAtlasSync`

The bridge between Zustand (fast local) and MongoDB Atlas (durable). Located at `src/hooks/useAtlasSync.js`.

**Pattern:** edits hit the store immediately (optimistic) → sync fires fire-and-forget → errors are `console.warn`'d, never block UI.

**Full API:**
```js
const {
  // State
  isSyncing, syncError, lastSynced,

  // Sync functions (all fire-and-forget, return Promise)
  bootstrapSubject(subjectId),      // POST scaffold + GET load into stores
  syncLesson(lessonId),             // PUT lesson metadata
  syncLessonContent(lessonId, subjectId), // POST/PUT all sections + blocks
  syncAll(lessonId, subjectId),     // syncLesson + syncLessonContent
  syncConcept(conceptId, subjectId),
  syncFeedItem(feedItemId, subjectId),
  syncQuestion(questionId, subjectId),
  syncExam(examId, subjectId),      // upsert exam to Atlas

  submitForReview(contentId, type), // PATCH atlasStatus → 'review'

  // Delete helpers (all fire-and-forget)
  deleteSection(id),                // server cascades blocks
  deleteBlock(id),
  deleteConcept(id),
  deleteFeedItem(id),
  deleteQuestion(id),
  deleteExam(id),
} = useAtlasSync();
```

**Upsert pattern:** every sync function tries PUT first, POSTs on 404. Content can be re-synced safely at any time.

**`bootstrapSubject` on login:**
1. POST `/api/content/subject` — scaffolds missing units/lessons in Atlas
2. GET `/api/content/subject?subjectId=X` — loads all existing Atlas data into stores
Fixes "returning contributor on new device starts empty."

---

## Content Status Lifecycle

Every content item (lesson, concept, feed item, question) has `atlasStatus` in Atlas. Contributors cannot set it directly.

```
null → draft       (first sync)
draft → review     (contributor clicks "Submit for Review")
review → approved  (admin approves)
review → draft     (admin rejects)
approved → draft   (any edit triggers applyVersionBump server-side)
```

**UI signals:**
- `StatusBadge` component: pill showing مسودة / للمراجعة / معتمد / أرشيف
- Editing an approved item shows an amber warning banner
- "Submit for Review" button only visible when `atlasStatus` is null or 'draft'

---

## Coverage System

Answers: "how well-developed is this lesson?" Computed server-side from Atlas aggregation pipelines, cached client-side.

**Score formula (0–100):**
- 40% — has sections AND blocks
- 30% — feedItems ≥ concepts
- 30% — questions ≥ concepts × 2

**Levels:** `high` (≥80) `medium` (≥40) `low` (>0) `none` (0)

**`useCoverageData(subjectId)` hook:**
- Fetches `/api/coverage/[subjectId]`
- Module-level `CACHE` — one fetch per session per subject
- Returns `{ coverageMap, loading, refresh }`
- `coverageMap[lessonContentId]` → `{ coverageScore, coverageLevel, sections, blocks, concepts, feedItems, questions }`

**`COVERAGE_LEVEL_CONFIG`** — shared color/label tokens used by CoveragePanel, LessonItem, UnitCard. Imported from `@/hooks/useCoverageData`.

**Coverage UI locations:**
- `CoveragePanel` — in LessonEditorPage sidebar (stat pills, progress bar, guidance hints)
- Colored dot — in every `LessonItem` row
- Unit avg badge — in `UnitCard` header
- Subject summary (high/medium/low distribution) — in `LessonsPage` header
- Admin matrix — select any subject → per-unit tables with per-lesson counts, status, coverage bars

---

## Admin Dashboard

Three sections toggled by a tab strip:

**Contributors** — lists all contributors, approve/reject with confirmation modal.

**Review Queue** — `GET /api/admin/review-queue?subjectId=X` returns all content with `atlasStatus: 'review'`, grouped by type. Admin approves or rejects with optional note. `PATCH /api/admin/review-queue` → `approveOrReject()` in `src/lib/api/reviewQueue.js`.

**Coverage Matrix** — subject picker → full matrix table. Uses same `/api/coverage/[subjectId]` endpoint.

---

## API Routes (Complete)

```
POST   /api/auth/signin
POST   /api/auth/signout
POST   /api/contributors/request

POST   /api/admin/login
POST   /api/admin/logout
GET    /api/admin/contributors
PATCH  /api/admin/contributors
GET    /api/admin/review-queue
PATCH  /api/admin/review-queue

POST   /api/content/subject          ← scaffold
GET    /api/content/subject          ← full load

GET    /api/content/lessons
POST   /api/content/lessons
PUT    /api/content/lessons/[id]

GET    /api/content/sections
POST   /api/content/sections
DELETE /api/content/sections/[id]    ← cascades blocks

GET    /api/content/blocks
POST   /api/content/blocks
PUT    /api/content/blocks/[id]
DELETE /api/content/blocks/[id]

GET    /api/content/concepts
POST   /api/content/concepts
PUT    /api/content/concepts/[id]
DELETE /api/content/concepts/[id]

GET    /api/content/feed-items
POST   /api/content/feed-items
PUT    /api/content/feed-items/[id]
DELETE /api/content/feed-items/[id]

GET    /api/content/questions
POST   /api/content/questions
PUT    /api/content/questions/[id]
PATCH  /api/content/questions/[id]   ← status only
DELETE /api/content/questions/[id]

GET    /api/content/exams
POST   /api/content/exams
PUT    /api/content/exams/[id]
DELETE /api/content/exams/[id]

GET    /api/coverage/[subjectId]
GET    /api/export
```

---

## Design System

Dark-first. CSS custom properties on `:root` and `:root[data-theme="light"]`.

| Token | Dark | Light |
|---|---|---|
| `--accent` | `#d4891e` | `#b86c14` |
| `--bg-primary` | near-black warm | off-white warm |
| `--bg-card` | dark warm gray | light warm gray |

**Palette names:** sand (amber/gold), ink (warm grays), ember (orange).

**Theme:** persisted in `localStorage` as `'nafeer-theme'`. Default `'dark'` set on `<html>` tag to avoid hydration mismatch.

---

## GSAP Rules

- Always `gsap.fromTo()`, never `gsap.from()` — `from()` can leave elements invisible in SSR
- Always `once: true` on ScrollTrigger instances
- Register plugins at module level outside component: `gsap.registerPlugin(ScrollTrigger)`
- Wrap in `gsap.context(()=>{...}, ref)` and return `ctx.revert()` from cleanup

---

## Phase Status

| Phase | Title | Status |
|---|---|---|
| Phase 1 | Foundation — stores, routing, auth, scaffold | ✅ DONE |
| Phase 2 | Atlas Sync — real-time MongoDB persistence | ✅ DONE |
| Phase 3 | Versioning UI — status badges, review queue | ✅ DONE |
| Phase 4 | Content Graph UI — coverage badges, admin matrix | ✅ DONE |
| Phase 5 | Redesign — landing page + editor UX polish | 🔄 IN PROGRESS |

---

## Bug Fixes Applied (v5.1)

| Bug | Fix |
|---|---|
| `exams/Route.js` — capital R, invisible to Next.js router | Renamed to `route.js` |
| `admin/review-queue/Route.js` — same capital R bug | Renamed to `route.js` |
| `exams/[id]/route.js` — missing entirely | Created with PUT + DELETE handlers |
| `review-queue/route.js` imported `@/lib/api/ReviewQueue` | Fixed to `@/lib/api/reviewQueue` |
| Route files imported `Concepts`, `Lessons`, `Questions` with wrong casing | Fixed to match actual filenames |

---

## Remaining Known Gaps (Low Priority Only)

| Item | Priority |
|---|---|
| Tag sync — standalone PUT /api/content/tags/[id] | LOW |
| Conflict detection — Atlas version > local version on load | LOW |
| Changelog viewer — show version history inline in editor | LOW |

---

## Phase 5 Scope (Next Session)

**Landing page:**
- Hero — GSAP entrance, headline, dual CTA (Download Basheer + Join as Contributor)
- Features — scroll-triggered benefit cards
- ProgressBoard — live coverage data (unauthenticated `/api/coverage` aggregate) as subject grid
- NafeerSection — contributor pitch
- Footer

**Editor UX:**
- Sidebar widths, active states, responsive behavior
- Breadcrumb in lesson editor + back-to-lessons shortcut
- Coverage dot in lesson list sidebar
- Empty states / onboarding hints for new contributors
- SyncBar messaging clarity