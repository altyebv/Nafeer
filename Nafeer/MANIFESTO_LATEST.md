# NAFEER × BASHEER — Project Manifesto
**v5.4 — March 2026 — Image Optimization + Contributor Identity + Stats**

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
| Media Storage | Supabase Storage — two buckets: `basheer-media` (content) + `nafeer-users` (avatars) |
| Image Optimization | `sharp` ^0.33.5 — WebP conversion + resize on every upload server-side |
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
    signin/                         ← contributor auth (username or email)
    join/                           ← contributor signup (phase 1 form)
    onboard/                        ← contributor onboarding wizard (magic link)
    editor/page.jsx                 ← editor shell (auth-gated)
    admin/
      login/page.jsx
      dashboard/page.jsx            ← admin panel (separate auth)
    api/
      auth/signin, signout, heartbeat, onboard
      contributors/request, me/, me/avatar/
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
    useCoverageData.js              ← coverage fetch + cache
  lib/
    db.js, auth.js, adminAuth.js
    imageOptimizer.js               ← sharp pipeline — optimizeImage() + getOptimizedExtension()
    trackStat.js                    ← fire-and-forget contributor stat increment
    supabase.js                     ← dual-bucket client: uploadMedia, uploadUserFile, deleteFile, getPublicUrl
    LessonStatus.js
    api/  guard.js, content.js, lessons.js, concepts.js, questions.js,
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

| File | Correct import path |
|---|---|
| `src/lib/api/lessons.js` | `@/lib/api/lessons` |
| `src/lib/api/concepts.js` | `@/lib/api/concepts` |
| `src/lib/api/questions.js` | `@/lib/api/questions` |
| `src/lib/api/reviewQueue.js` | `@/lib/api/reviewQueue` |
| `src/lib/api/feedItems.js` | `@/lib/api/feedItems` |

All route files must be named `route.js` (lowercase).

---

## Data Model

**Atomic unit:** concept (مفهوم). Everything else references concepts.

**Hierarchy:**
```
Subject → Units → Lessons → Sections → Blocks   (lesson content)
Concepts → FeedItems                             (Basheer feed cards)
Questions → Exams                                (quiz bank + past papers)
```

**Subjects:** defined in `src/shared/curriculum.js` as `SUBJECTS_CATALOG`. Immutable IDs. Three tracks: `COMMON` (4 subjects), `SCIENCE` (فيزياء + كيمياء), `LITERARY` (تاريخ + جغرافيا).

**Versioning:** every model uses `versioningFields` (version, changelog, createdBy, updatedBy). `applyVersionBump()` increments version, appends changelog, resets `atlasStatus` from `approved` → `draft` automatically.

---

## Environment Variables

```
MONGODB_URI                   — MongoDB Atlas connection string
JWT_SECRET                    — signs both contributor and admin JWTs
NEXT_PUBLIC_APP_URL           — app base URL (used to build magic onboarding links)
ADMIN_USERNAME                — admin login username
ADMIN_PASSWORD                — admin login password
NEXT_PUBLIC_SUPABASE_URL      — Supabase project URL (safe to expose)
SUPABASE_SERVICE_ROLE_KEY     — Supabase service role key (server only)
SUPABASE_MEDIA_BUCKET         — educational content bucket (default: basheer-media)
SUPABASE_USERS_BUCKET         — user-generated content bucket (default: nafeer-users)
```

**Supabase bucket setup checklist:**
1. Create `basheer-media` — set **Public**, RLS: anon SELECT, service role INSERT/DELETE
2. Create `nafeer-users` — set **Public**, RLS: anon SELECT, service role INSERT/UPDATE/DELETE
3. The browser never calls Supabase directly — all reads/writes go through API routes

---

## Auth Systems (Two Completely Separate)

**Contributor auth:**
- JWT in cookie `nafeer_token`, signed with jose
- `middleware.js` protects `/editor/*` → redirect to `/signin`
- `/onboard` route is explicitly bypassed (token in URL is the credential)
- JWT payload: `{ id, email, username, name, subject, role, avatarUrl, lastSignedInAt }`
- `buildTokenPayload(contributor)` in `auth.js` is the canonical payload builder — always use it

**Admin auth:**
- JWT in cookie `nafeer_admin`, role must be `"admin"`
- `middleware.js` protects `/admin/dashboard`
- Separate login at `/admin/login`

---

## Contributor Lifecycle (Two Phases)

### Phase 1 — Application (`/join`)

Contributor submits: name, gender, email, username, subject.

- Username validated: `/^[\w\u0600-\u06FF._-]{3,20}$/` — Arabic + English + digits + `_.-`
- No password, no avatar — these come after approval
- Status set to `pending`

### Phase 2 — Onboarding (`/onboard?token=xxx`)

When admin approves:
1. `PATCH /api/admin/contributors` with `action: 'approve'` auto-generates a one-time `onboardingToken` (32-byte hex) and `onboardingExpiresAt` (7 days)
2. Admin dashboard shows `OnboardLinkModal` with a copyable link — admin sends it manually via email
3. Contributor visits `/onboard?token=xxx` — 3-step wizard:
   - **Step 1** — set password (min 8 chars)
   - **Step 2** — write a bio (optional, max 280 chars)
   - **Step 3** — upload avatar (optional, JPEG/PNG/WebP, max 5MB)
4. On step 1 POST: `onboarded = true`, token cleared, JWT issued — contributor is immediately signed in
5. Steps 2 and 3 fire against authenticated endpoints after JWT is set

**Re-generating a link:** admin PATCH with `action: 'generate_onboard_link'` creates a fresh token, resets `onboarded = false`.

**Admin-created contributors** (PATCH `set_password`) skip onboarding entirely — `onboarded` is set to `true` directly.

---

## Contributor Model (`src/lib/models/Contributor.js`)

```js
// Phase 1 fields (from join form)
name, gender, email, username, subject

// Phase 2 fields (from onboarding wizard)
passwordHash (select: false)
avatarUrl, avatarPath (select: false)
bio (max 280 chars)

// Onboarding state
onboarded: Boolean
onboardingToken (select: false)
onboardingExpiresAt: Date

// Account state
status: 'pending' | 'approved' | 'rejected'
role: 'contributor' | 'admin'
lastSignedInAt: Date

// Contribution stats (StatsSchema subdoc)
stats: {
  lessonsCreated, questionsAdded, feedItemsCreated,
  blocksAdded, reviewsSubmitted, publishedLessons,
  totalTimeMs, lastActiveAt
}
```

---

## Contribution Stats System

Stats are tracked automatically — contributors never interact with them directly. They power future profile pages and achievement systems.

### How stats are incremented

| Event | Stat field | Where |
|---|---|---|
| `POST /api/content/lessons` | `lessonsCreated` | lessons route |
| `POST /api/content/questions` | `questionsAdded` | questions route |
| `POST /api/content/feed-items` | `feedItemsCreated` | feed-items route |
| `POST /api/content/blocks` | `blocksAdded` | blocks route |
| Lesson status → published | `publishedLessons` | (future) |
| Review submit | `reviewsSubmitted` | (future) |

**`trackStat(contributorId, field)`** in `src/lib/trackStat.js`:
- Fire-and-forget — never `await`ed, never blocks a response
- Uses `$inc` + `$set lastActiveAt` in a single `findByIdAndUpdate`
- Errors swallowed silently with `console.warn`

### Time tracking

- `lastSignedInAt` stamped on every sign-in and embedded in the JWT
- On `POST /api/auth/signout`: computes `now - lastSignedInAt`, accumulates into `stats.totalTimeMs` (capped at 24h sanity limit)
- `POST /api/auth/heartbeat` — call every ~5 minutes from the editor with `{ sessionMs }` to flush time incrementally (handles tab-close scenario)
- Heartbeat body: `{ sessionMs: number }` — ms elapsed since last heartbeat; rejected if > 10 minutes

---

## Image Optimization Pipeline (`src/lib/imageOptimizer.js`)

All images are optimized server-side via `sharp` before being stored in Supabase. Zero client-side work needed.

### Presets

| Preset | Use | Max dimensions | Quality | Fit |
|---|---|---|---|---|
| `content` | Educational media | 1200px wide | 85 | inside (never upscale) |
| `avatar` | Contributor profiles | 400×400 | 90 | cover (center crop) |
| `thumb` | Future use | 320px wide | 80 | inside |

### Rules

- **JPG/PNG/WebP → WebP** — all converted, extensions updated accordingly
- **GIF** — skipped (pass-through). Animated GIF→WebP conversion is lossy; GIFs stored as-is
- **SVG** — skipped (vector, nothing to compress)
- If sharp fails for any reason, original bytes are returned (graceful degradation, never blocks upload)

### Usage

```js
import { optimizeImage, getOptimizedExtension } from '@/lib/imageOptimizer';

const { buffer, mimeType, originalSize, optimizedSize, skipped } =
  await optimizeImage(rawBuffer, 'image/png', 'content');

const ext = getOptimizedExtension(originalMimeType, mimeType); // → 'webp'
```

### Where it's used

- `POST /api/media` — educational content images (preset: `content`)
- `POST /api/contributors/me/avatar` — profile pictures (preset: `avatar`)

---

## Supabase Storage (`src/lib/supabase.js`)

Two separate buckets with different semantics:

| Bucket | Env var | Default | Purpose | Upload permissions |
|---|---|---|---|---|
| `basheer-media` | `SUPABASE_MEDIA_BUCKET` | `basheer-media` | Educational images + GIFs | Admin only |
| `nafeer-users` | `SUPABASE_USERS_BUCKET` | `nafeer-users` | Contributor avatars, future: banners | Contributor (own record) |

**API:**
```js
uploadMedia(path, buffer, mimeType)       // → basheer-media bucket
uploadUserFile(path, buffer, mimeType)    // → nafeer-users bucket (upsert: true)
deleteFile(bucket, path)                  // explicit bucket + path
deleteMedia(path)                         // convenience wrapper for basheer-media
getPublicUrl(bucket, path)
```

**Avatar path convention:** `avatars/{contributorId}.webp` — always the same path per contributor. `uploadUserFile` uses `upsert: true` so re-uploads replace cleanly.

---

## Contributor Profile API

```
GET    /api/contributors/me          ← full profile + stats (auth required)
PATCH  /api/contributors/me          ← update bio, username (re-issues JWT)
POST   /api/contributors/me/avatar   ← avatar upload — optimize → Supabase → DB → re-issue JWT
```

Profile changes re-issue the JWT immediately so the new username/avatarUrl reflects in the current session without re-login.

---

## State Management

Six Zustand slices, re-exported via composite `useDataStore` in `src/store/index.js`.

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

Located at `src/hooks/useAtlasSync.js`. Bridge between Zustand and MongoDB Atlas.

**Pattern:** edits hit the store immediately (optimistic) → sync fires fire-and-forget → errors `console.warn`'d, never block UI.

**Full API:**
```js
const {
  isSyncing, syncError, lastSynced,
  bootstrapSubject(subjectId),
  syncLesson(lessonId),
  syncLessonContent(lessonId, subjectId),
  syncAll(lessonId, subjectId),
  syncConcept(conceptId, subjectId),
  syncFeedItem(feedItemId, subjectId),
  syncQuestion(questionId, subjectId),
  syncExam(examId, subjectId),
  submitForReview(contentId, type),
  deleteSection(id),
  deleteBlock(id),
  deleteConcept(id),
  deleteFeedItem(id),
  deleteQuestion(id),
  deleteExam(id),
} = useAtlasSync();
```

---

## Content Status Lifecycle

```
null → draft       (first sync)
draft → review     (contributor submits)
review → approved  (admin approves)
review → draft     (admin rejects)
approved → draft   (any edit via applyVersionBump)
```

---

## Coverage System

**Score (0–100):** 40% content + 30% feed + 30% questions.
**Levels:** `high` (≥80) `medium` (≥40) `low` (>0) `none` (0)

**`useCoverageData(subjectId)`** — module-level session cache, one fetch per subject.

---

## Admin Dashboard

Three tabs: **Contributors** / **Review Queue** / **Coverage Matrix**

**Contributors tab additions (v5.4):**
- Username displayed under email (`@username`)
- Onboarded status badge: `مكتمل` (green) / `ينتظر التأهيل` (amber) for approved contributors
- "رابط التأهيل" button — appears for approved-but-not-onboarded contributors → calls `generate_onboard_link` → shows `OnboardLinkModal` with copyable link
- Approval action auto-generates onboarding link and shows the modal immediately

---

## API Routes (Complete)

```
POST   /api/auth/signin               ← username OR email
POST   /api/auth/signout              ← accumulates session time
POST   /api/auth/heartbeat            ← periodic time flush { sessionMs }
GET    /api/auth/onboard              ← validate magic token
POST   /api/auth/onboard              ← complete onboarding (sets password, marks onboarded)

POST   /api/contributors/request      ← phase 1 application
GET    /api/contributors/me           ← own profile + stats
PATCH  /api/contributors/me           ← update bio / username
POST   /api/contributors/me/avatar    ← avatar upload

POST   /api/admin/login
POST   /api/admin/logout
GET    /api/admin/contributors
POST   /api/admin/contributors
PATCH  /api/admin/contributors        ← approve | reject | set_password | reset_to_pending | generate_onboard_link
DELETE /api/admin/contributors
GET    /api/admin/review-queue
PATCH  /api/admin/review-queue

POST   /api/content/subject           ← scaffold
GET    /api/content/subject           ← full load
GET/POST   /api/content/lessons
PUT        /api/content/lessons/[id]
GET/POST   /api/content/sections
DELETE     /api/content/sections/[id]
GET/POST   /api/content/blocks
PUT/DELETE /api/content/blocks/[id]
GET/POST   /api/content/concepts
PUT/DELETE /api/content/concepts/[id]
GET/POST   /api/content/feed-items
PUT/DELETE /api/content/feed-items/[id]
GET/POST   /api/content/questions
PUT/PATCH/DELETE /api/content/questions/[id]
GET/POST   /api/content/exams
PUT/DELETE /api/content/exams/[id]

GET    /api/media                     ← scoped by role
POST   /api/media                     ← admin only — optimize → Supabase → DB
DELETE /api/media/[id]               ← admin only

GET    /api/coverage/[subjectId]
GET    /api/export
GET    /api/dev/autologin             ← dev only
```

---

## Design System

Dark-first. CSS custom properties on `:root` and `:root[data-theme="light"]`.

| Token | Dark | Light |
|---|---|---|
| `--accent` | `#d4891e` | `#b86c14` |

**Palette:** sand (amber/gold), ink (warm grays), ember (orange).
**Theme:** `localStorage` key `'nafeer-theme'`. Default `'dark'` on `<html>` tag (hydration-safe).

---

## GSAP Rules

- Always `gsap.fromTo()`, never `gsap.from()`
- Always `once: true` on ScrollTrigger instances
- Register plugins at module level outside component
- Wrap in `gsap.context(()=>{...}, ref)`, return `ctx.revert()` from cleanup

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
| Phase 8 | Image Optimization + Contributor Identity + Stats | ✅ DONE |

---

## Phase 8 — What Changed (v5.4)

### Image Optimization
- `sharp` added to dependencies
- `src/lib/imageOptimizer.js` — single entry point for all image processing
- `POST /api/media` now optimizes before upload (logs savings to console)
- `POST /api/contributors/me/avatar` uses avatar preset (400×400 cover, q90)
- `Media` model gains `originalSize` field for future analytics

### Two-Bucket Storage
- `src/lib/supabase.js` refactored — `uploadMedia`, `uploadUserFile`, `deleteFile` with explicit bucket params
- `basheer-media` — educational content (unchanged path convention)
- `nafeer-users` — user assets; avatar path: `avatars/{contributorId}.webp`
- New env var: `SUPABASE_USERS_BUCKET` (default: `nafeer-users`)

### Contributor Identity (Two-Phase)
- `Contributor` model: added `username`, `gender`, `bio`, `avatarUrl`, `avatarPath`, `onboarded`, `onboardingToken`, `onboardingExpiresAt`, `lastSignedInAt`, `stats` subdoc
- `username` index is `sparse: true` — existing docs without username don't clash
- Join form (`/join`) simplified to: name, gender (toggle buttons), email, username, subject — no background/motivation
- Sign-in (`/signin`) accepts username OR email via single `identifier` field with `dir="auto"`
- `buildTokenPayload()` in `auth.js` is the single canonical JWT shape — used everywhere

### Magic Link Onboarding
- Admin approve → auto-generates token → `OnboardLinkModal` with copyable URL shown immediately
- `generate_onboard_link` action available for already-approved contributors
- `/onboard?token=xxx` — 3-step wizard, public route (no auth cookie needed)
- Step 1 (password) calls `POST /api/auth/onboard` → issues JWT → steps 2+3 are authenticated
- Steps 2 (bio) and 3 (avatar) are independently skippable

### Contribution Stats
- `stats` StatsSchema subdoc on `Contributor` with 8 fields
- `trackStat(id, field)` utility — fire-and-forget `$inc` after every content creation
- Session time: stamped at sign-in, accumulated at sign-out, flushed via heartbeat
- `POST /api/auth/heartbeat` — call every ~5min from editor with `{ sessionMs }`

### Admin Dashboard Updates
- Contributor cards show `@username` + onboarded status badge
- Approve button shows `OnboardLinkModal` with copyable link when it returns one
- "رابط التأهيل" button for approved-but-not-onboarded contributors

### Middleware
- `/onboard` and `/onboard/*` added to matcher, explicitly bypassed (no auth required)

---

## Media System (Phase 6 — reference)

### Storage path convention
```
{subjectId}/{contentId}.{ext}    ← basheer-media
avatars/{contributorId}.webp     ← nafeer-users
```

### Block integration
IMAGE and GIF blocks use `MediaBlockEditor` (inside `BlockEditor.jsx`). On select: sets `block.content = url`, `block.metadata.mediaId = contentId`.

---

## Interactive Media — Markers (Phase 7 — reference)

Marker shape: `{ id, x, y, label, description }` — normalised 0–1 coordinates.
Lives in `Block.metadata.markers[]` (IMAGE blocks) and `Question.markers[]` (FIGURE questions).
`ImageMarkerEditor` — click-to-place, drag-to-reposition, inline edit panel.

---

## Remaining Known Gaps

| Item | Priority |
|---|---|
| Phase 5 landing page — Hero, Features, ProgressBoard, NafeerSection | 🔄 IN PROGRESS |
| Tag sync — standalone PUT /api/content/tags/[id] | LOW |
| Conflict detection — Atlas version > local version on load | LOW |
| Contributor profile page `/editor/profile` — avatar upload UI inside editor | NEXT |
| Heartbeat call wired into editor (useEffect interval in EditorShell) | NEXT |
| Stats display — contributor profile page with totals + achievements | FUTURE |
| `deleteSection` / `deleteBlock` not calling `deleteRemote()` — orphaned Atlas records | LOW |
