# NAFEER × BASHEER — Project Manifesto
**v5.3 — March 2026 — Media Pipeline + Codebase Refactor**

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
| State | Zustand — 7 domain slices |
| Database | MongoDB Atlas 512 MB free tier, Mongoose ODM |
| Media Storage | Supabase Storage (nafeer-media bucket) — images + GIFs |
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
      media/                        ← GET (scoped) + POST (admin upload)
      media/[id]/                   ← DELETE (admin only)
      coverage/[subjectId]/
      export/
      dev/autologin/                ← development only, gated by NODE_ENV
  components/
    landing/  Navbar, Hero, Features, ProgressBoard, NafeerSection, Footer
    editor/
      layout/   EditorShell, EditorSidebar
      pages/    LessonsPage, ConceptsPage, FeedItemsPage, QuizBankPage, ExportPage, MediaPage
      lesson/   LessonEditorPage, SectionEditor, LessonItem, LessonFeedPanel, LessonQuestionsPanel, LessonPreviewModal
      blocks/   BlockEditor, AddBlockMenu, TableEditor
      media/    MediaPicker, ImageMarkerEditor
      units/    UnitCard, UnitView, SubjectOverview
      shared/   Modal, DeleteButton, StatusBadge, CoveragePanel, ConceptLinker
  hooks/
    useAtlasSync.js                 ← all Atlas persistence logic
    useCoverageData.js              ← coverage fetch + cache (DONE v5.2)
  lib/
    db.js, auth.js, adminAuth.js
    supabase.js                     ← Supabase server-side client + uploadMedia/deleteMedia helpers
    LessonStatus.js
    api/  guard.js, content.js, Lessons.js, Concepts.js, Questions.js,
          feedItems.js, subject.js, reviewQueue.js
    models/  Unit, Lesson, Section, Block, Concept, Tag, FeedItem,
             Question, Exam, Subject, Contributor, Media, versioning.js
  middleware.js
  shared/  curriculum.js, constants.js
  store/
    index.js (re-exports + composite useDataStore)
    editorStore.js, subjectStore.js, contentStore.js
    conceptStore.js, feedStore.js, quizStore.js
    mediaStore.js                   ← media[] slice, addMediaItem, removeMediaItem
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

## Environment Variables

```
MONGODB_URI                   — MongoDB Atlas connection string
JWT_SECRET                    — signs both contributor and admin JWTs
NEXT_PUBLIC_APP_URL           — app base URL
ADMIN_USERNAME                — admin login username
ADMIN_PASSWORD                — admin login password
NEXT_PUBLIC_SUPABASE_URL      — Supabase project URL (safe to expose)
SUPABASE_SERVICE_ROLE_KEY     — Supabase service role key (server only — never prefix NEXT_PUBLIC_)
SUPABASE_MEDIA_BUCKET         — bucket name (default: nafeer-media)
```

**Supabase bucket setup checklist:**
1. Create a bucket named `nafeer-media` (or match `SUPABASE_MEDIA_BUCKET`)
2. Set bucket to **Public** (so CDN URLs work without signed tokens in Android)
3. Add RLS policy: all reads allowed (public), writes restricted to service role only
4. The API routes use the service role key server-side — the browser never touches Supabase directly

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
| `useMediaStore` | media[] — loaded once per session from `/api/media` |

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

GET    /api/media                   ← contributor: own subject + common; admin: all (optional ?subjectId=X)
POST   /api/media                   ← admin only — multipart upload → Supabase + MongoDB record
DELETE /api/media/[id]              ← admin only — Supabase delete first, then MongoDB

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
| Phase 6 | Media — Supabase Storage, MediaPage, MediaPicker in blocks | ✅ DONE |
| Phase 7 | Interactive Media — image markers for lessons and questions | ✅ DONE |

**v5.3 changes:** `components/editor/` refactored into 7 subdirectories (`layout/`, `pages/`, `lesson/`, `blocks/`, `media/`, `units/`, `shared/`). All import paths updated across codebase. No logic changes.

---

## Media System (Phase 6)

### Architecture

All media lives in a **Supabase Storage** bucket (`nafeer-media`). MongoDB (`Media` model) tracks metadata only — path, URL, subject, uploader, alt text. The browser never calls Supabase directly; all reads/writes go through `/api/media`.

### Storage path convention

```
{subjectId}/{contentId}.{ext}
```

Examples: `arabic-lang/abc-123.jpg`, `common/def-456.gif`

The `common` subject ID is a virtual pool for shared assets visible to all contributors.

### Subject scoping

| Role | Can upload | Can delete | Sees |
|---|---|---|---|
| `contributor` | ✗ | ✗ | own subject + `common` |
| `admin` | ✓ | ✓ | all subjects (optional filter) |

Enforced in `GET /api/media` and `POST/DELETE /api/media` via the contributor JWT (`user.role`, `user.subject`).

### Media model fields

```
contentId    — stable UUID, used as the URL param in DELETE
subjectId    — drives scoping (includes 'common' as special value)
filename     — sanitised original filename, display only
path         — Supabase storage path
url          — public CDN URL (written once on upload, never mutated)
mimeType     — image/jpeg, image/png, image/gif, image/webp, image/svg+xml
size         — bytes
type         — 'IMAGE' | 'GIF' (maps to Block types)
alt          — Arabic alt text for accessibility
uploadedBy   — contributor id
```

### Block integration

IMAGE and GIF blocks use `MediaBlockEditor` (inside `BlockEditor.jsx`):
- Thumbnail preview if `block.content` is set
- "اختر صورة من المكتبة" button → opens `MediaPicker` modal
- On select: sets `block.content = item.url` and `block.metadata.mediaId = item.contentId`
- Manual URL fallback (collapsed `<details>`) for Android local asset paths
- `subjectId` flows down: `LessonEditorPage → SectionEditor → BlockEditor → MediaBlockEditor → MediaPicker`

### Export compatibility

`block.content` remains a plain URL string — unchanged. The Android APK export format is unaffected. `block.metadata.mediaId` is available as an optional back-reference if the Android app ever needs to resolve back to the CMS record.

### Supabase bucket setup

1. Create bucket `nafeer-media` → set to **Public**
2. RLS: `SELECT` allowed for anon, `INSERT/UPDATE/DELETE` for service role only
3. Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
4. Copy **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (never commit this)

---

## Interactive Media — Markers (Phase 7)

### What it is

A normalised coordinate system for placing named pins on images. Authors click to drop markers; Android reads the array and renders tappable pins, annotations, or quiz targets on top of the image.

### Where markers live

| Surface | Stored in | Field |
|---|---|---|
| IMAGE blocks (lessons) | `Block.metadata.markers[]` | `metadata` is `Mixed` — no schema change needed |
| FIGURE questions | `Question.markers[]` | Dedicated typed array field added to schema |

Markers are **not** on the `Media` model. The same image can be reused in multiple blocks or questions, each with their own independent marker set.

### Marker shape

```js
{
  id:          "mk_lh8x2_abc12",  // prefixed random ID
  x:           0.42,              // normalised 0–1 from left
  y:           0.31,              // normalised 0–1 from top
  label:       "النواة",           // shown on the pin bubble
  description: "تحتوي على الحمض النووي"  // revealed on tap in Android
}
```

Coordinates are always 0–1. Android multiplies by its actual rendered image dimensions at runtime — fully resolution-independent.

### Authoring UX (`ImageMarkerEditor`)

- **Click-to-place mode** — toggle a button, then click anywhere on the image to drop a pin
- **Drag to reposition** — grab any pin and drag it while holding mouse down; position updates live
- **Inline edit panel** — appears below the canvas when a pin is selected; edits label, description, and has numeric X/Y nudge inputs for pixel-perfect positioning
- **Numbered list summary** — all markers listed below the canvas with coordinates, clickable to focus the panel
- In IMAGE blocks, the editor is hidden inside a collapsible "العلامات التفاعلية" section — doesn't clutter the block UI unless opened
- In FIGURE questions, same collapsible pattern inside the question modal

### Export

Both surfaces serialise markers into the export JSON:

```js
// Block (inside metadata):
{ type: "IMAGE", content: "https://…", metadata: { markers: [...], mediaId: "…" } }

// Question:
{ type: "FIGURE", imageUrl: "…", markers: [...] }
```

The export shape is backward-compatible — if `markers` is empty or absent, Android treats it as a plain static image.

### New files

| File | Purpose |
|---|---|
| `src/components/editor/ImageMarkerEditor.jsx` | Full authoring canvas — click/drag/edit/list |
| `src/lib/markerUtils.js` | `randomId()`, `clampNorm()`, `normToPercent()`, `sanitiseMarkers()` |

### Modified files

| File | Change |
|---|---|
| `BlockEditor.jsx` | IMAGE blocks get `ImageMarkerEditor` via `MediaBlockEditor`; markers in `block.metadata.markers` |
| `QuizBankPage.jsx` | FIGURE questions get `ImageMarkerEditor`; `_markersOpen` UI flag stripped before save |
| `Question.js` | Added typed `markers[]` subdocument array |
| `questions/[id]/route.js` | `markers` added to PUT allowed fields whitelist |
| `export/route.js` | `markers` included in question export serialisation |
| `store/index.js` | `markers` included in client-side `assembleExportData` |

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