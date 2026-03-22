# NAFEER × BASHEER — Project Manifesto
**v6.0 — March 2026 — Contributor Pipeline**

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
    prejoin/page.jsx                ← NEW: mission brief (Step 1 of pipeline)
    join/page.jsx                   ← expression of interest form (Step 2)
    interview/page.jsx              ← NEW: token-gated mini interview (Step 3)
    editor/page.jsx                 ← editor shell (auth-gated)
    onboard/page.jsx                ← post-approval: set password + bio + avatar
    admin/
      login/page.jsx
      dashboard/
        page.jsx                    ← orchestrator only (~72 lines)
        _constants.js               ← CONTRIBUTOR_STATUS, REVIEW_TYPE, NAV, SUBJECT_MAP, getPipelineStage
        _components/
          AdminSidebar.jsx
          ContributorCard.jsx       ← single applicant row, all pipeline state
          ContributorsSection.jsx
          ReviewQueueSection.jsx
          CoverageSection.jsx
          MediaSection.jsx
          ui/
            Btn.jsx
            Modal.jsx
            shared.jsx              ← SectionHeader, StatusChip, EmptyState, Spinner, StatChips
          modals/
            CreateContributorModal.jsx
            SetPasswordModal.jsx
            LinkModal.jsx           ← handles both interview and onboarding links
    api/
      auth/signin, signout, onboard, heartbeat
      contributors/request          ← Step 2: expression of interest
      interview/                    ← NEW: GET (validate token) + POST (save answers)
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

| File | Correct import path |
|---|---|
| `src/lib/api/lessons.js` | `@/lib/api/lessons` |
| `src/lib/api/concepts.js` | `@/lib/api/concepts` |
| `src/lib/api/questions.js` | `@/lib/api/questions` |
| `src/lib/api/reviewQueue.js` | `@/lib/api/reviewQueue` |
| `src/lib/api/feedItems.js` | `@/lib/api/feedItems` |

All route files must be named `route.js` (lowercase).

---

## Contributor Pipeline (v6.0)

The intake system is a 4-stage funnel. Each stage is a separate page/route. Contributors advance only when the admin sends them a link.

```
Stage 1 — Discover      /prejoin         Public page. Mission brief before any form.
Stage 2 — Express       /join            Light form: name, email, background, subjectsOfInterest[].
Stage 3 — Interview     /interview       Token-gated. 5 questions + micro-task. Admin sends link manually.
Stage 4 — Onboarding    /onboard         Post-approval. Set password + bio + avatar.
```

### Stage 1 — Pre-Join Page (`/prejoin`)

Static page, no API calls. Three acts: what contributors do → what we expect → what you gain. Ends with a "تقدم الآن" CTA pointing to `/join`. Logged-in contributors redirected to `/editor` by middleware.

### Stage 2 — Expression of Interest (`/join`)

**Fields collected:** `name`, `email`, `background`, `fieldOfStudy`, `subjectsOfInterest[]`

**Not collected at this stage:** username, password, gender (removed from intake — all admin-assigned later).

Subject selector is a chip multi-select grouped by track. Submit button disabled until ≥1 subject is selected. Success screen previews steps 2 & 3 of the pipeline.

**API:** `POST /api/contributors/request` — creates Contributor with `status: 'pending'`, no `subject` assigned yet.

### Stage 3 — Mini Interview (`/interview?token=xxx`)

Token-gated. Token generated by admin via `PATCH /api/admin/contributors { action: 'send_interview' }`. Token lives in `Contributor.interviewToken` (select: false). Validity: 14 days.

**5 questions:**
| # | Category | Question |
|---|---|---|
| 1 | Motivation | لماذا تريد المساهمة في بشير؟ |
| 2 | Education critique | ما الذي يُعلَّم بشكل سيئ في المدارس؟ |
| 3 | Teaching instinct | كيف تشرح فكرة صعبة لطالب يسمعها لأول مرة؟ |
| 4 | Commitment | كم وقتاً يمكنك إعطاءه أسبوعياً؟ (radio: occasional / 2-3h / 5h+) |
| 5 | Micro-task | Explain one concept in your own words (contextual — reads subjectsOfInterest) |

Min 80 chars per free-text answer (enforced client + server). One-question-at-a-time with progress bar. Answers saved to `Contributor.interviewAnswers` subdocument on submit. Re-submission blocked via `submittedAt` timestamp.

**API:** `GET /api/interview?token=xxx` (validate) + `POST /api/interview` (save answers).

### Stage 4 — Onboarding (`/onboard?token=xxx`)

Unchanged from pre-v6. Token generated when admin approves a contributor. 3 steps: set password → bio → avatar. Issues JWT session cookie on completion.

### Contributor Model — New Fields (v6.0)

```js
// Application stage
background:          String           // university, role, etc.
fieldOfStudy:        String           // subject area
subjectsOfInterest:  [String]         // IDs from SUBJECTS_CATALOG

// Interview stage (Step 3)
interviewToken:      String (select: false)
interviewExpiresAt:  Date
interviewAnswers: {
  motivation:        String
  educationCritique: String
  teachingMoment:    String
  weeklyCommitment:  String           // 'occasional' | '2-3h' | '5h+'
  microTask:         String
  submittedAt:       Date
}

// Removed from intake (still exist in model for approved contributors)
gender:   now optional (default '')
subject:  no longer required at join — admin assigns after approval (default '')
```

### Admin Dashboard — Pipeline Workflow

Each pending contributor card now shows a contextual pipeline chip:

| Chip | Condition | Admin Action Available |
|---|---|---|
| طلب جديد (amber) | no interviewToken yet | "إرسال رابط المقابلة" |
| ينتظر المقابلة (blue) | interviewExpiresAt set, no answers | "إعادة إرسال الرابط" |
| أكمل المقابلة (green) | interviewAnswers.submittedAt set | "اعتماد + مرور" / "اعتماد فقط" |

Interview answers visible via collapsible toggle (▸/▾) per card. `weeklyCommitment` values translated to Arabic labels on display. `subjectsOfInterest` shown as Arabic name chips (not raw IDs).

**New admin action:** `PATCH /api/admin/contributors { id, action: 'send_interview' }` — generates `interviewToken` + `interviewExpiresAt`, returns `interviewLink` for display in `LinkModal`.

**`LinkModal`** replaces `OnboardLinkModal` — handles both interview (14-day validity) and onboarding (7-day validity) links, label-aware.

### Middleware Updates (v6.0)

- `/prejoin` added to redirect rule for logged-in contributors (→ `/editor`)
- `/prejoin` and `/interview` added to matcher so middleware runs on those routes
- `/interview` is public (token in URL is the credential) — no auth check, just pass-through like `/onboard`

### Landing Page — CTA Links Updated

All 5 `/join` occurrences on the landing page now point to `/prejoin`:
- `Navbar.jsx` — "انضم" pill
- `Hero.jsx` — primary CTA button
- `NafeerSection.jsx` — closing CTA
- `ProgressBoard.jsx` — section CTA + per-subject "+ انضم" chip

---

## Admin Dashboard — Modular Architecture (v6.0)

The monolithic 1,425-line `page.jsx` has been split into 14 files. The `_` prefix makes all sub-files private to Next.js (no routes created).

```
dashboard/
  page.jsx              72 lines — orchestrator only
  _constants.js         35 lines — all shared constants + getPipelineStage()
  _components/
    AdminSidebar.jsx    71 lines
    ContributorCard.jsx 233 lines — fully self-contained (own expand/delete state)
    ContributorsSection.jsx 134 lines
    ReviewQueueSection.jsx  180 lines
    CoverageSection.jsx     130 lines
    MediaSection.jsx        373 lines (includes MediaLightbox)
    ui/
      Btn.jsx           18 lines
      Modal.jsx         26 lines
      shared.jsx        57 lines (SectionHeader, StatusChip, EmptyState, Spinner, StatChips)
    modals/
      CreateContributorModal.jsx  85 lines
      SetPasswordModal.jsx        43 lines
      LinkModal.jsx               49 lines
```

`getPipelineStage(contributor)` is a utility in `_constants.js` that computes the stage chip `{ label, color }` for any pending contributor. Add new pipeline stages here.

**Known pre-existing issue (not introduced in v6.0):** `passwordHash` has `select: false` in the Contributor model, so `c.passwordHash` is always undefined in the admin GET response. The "تعيين مرور" / "تغيير المرور" button label distinction doesn't work — it always shows "تعيين مرور". Low priority fix: add a `hasPassword: Boolean` virtual or non-select field.

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
NEXT_PUBLIC_APP_URL           — app base URL (used to construct interview/onboarding links)
ADMIN_USERNAME                — admin login username
ADMIN_PASSWORD                — admin login password
NEXT_PUBLIC_SUPABASE_URL      — Supabase project URL (safe to expose)
SUPABASE_SERVICE_ROLE_KEY     — Supabase service role key (server only)
SUPABASE_MEDIA_BUCKET         — bucket name (default: nafeer-media)
```

---

## Auth Systems (Two Completely Separate)

**Contributor auth:**
- JWT in cookie `nafeer_token`, signed with jose
- `middleware.js` protects `/editor/*` → redirect to `/signin`
- `/prejoin`, `/join`, `/interview`, `/onboard` are all public (no auth required)
- Logged-in contributors hitting `/signin`, `/join`, or `/prejoin` are redirected to `/editor`

**Admin auth:**
- JWT in cookie `nafeer_admin`, role must be `"admin"`
- `middleware.js` protects `/admin/dashboard`
- Separate login at `/admin/login`

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

**Pattern:** edits hit the store immediately (optimistic) → sync fires fire-and-forget → errors are `console.warn`'d, never block UI.

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
draft → review     (contributor clicks "Submit for Review")
review → approved  (admin approves)
review → draft     (admin rejects)
approved → draft   (any edit triggers applyVersionBump server-side)
```

---

## Coverage System

**Score formula (0–100):** 40% sections+blocks · 30% feedItems≥concepts · 30% questions≥concepts×2

**Levels:** `high` (≥80) `medium` (≥40) `low` (>0) `none` (0)

**`useCoverageData(subjectId)`** — module-level cache, one fetch per session per subject.

**Coverage UI locations:** CoveragePanel (lesson editor sidebar), LessonItem dots, UnitCard badge, LessonsPage header, admin Coverage Matrix.

---

## API Routes (Complete)

```
POST   /api/auth/signin
POST   /api/auth/signout
GET    /api/auth/onboard?token=         ← validate onboarding token
POST   /api/auth/onboard                ← complete onboarding (password + bio)
POST   /api/contributors/request        ← Step 2: expression of interest
GET    /api/interview?token=            ← NEW: validate interview token
POST   /api/interview                   ← NEW: save interview answers

POST   /api/admin/login
POST   /api/admin/logout
GET    /api/admin/contributors
POST   /api/admin/contributors          ← manual create
PATCH  /api/admin/contributors          ← actions: approve | reject | set_password |
                                           reset_to_pending | generate_onboard_link |
                                           send_interview (NEW)
DELETE /api/admin/contributors
GET    /api/admin/review-queue
PATCH  /api/admin/review-queue

POST   /api/content/subject
GET    /api/content/subject
GET/POST       /api/content/lessons
PUT/DELETE     /api/content/lessons/[id]
GET/POST       /api/content/sections
PUT/DELETE     /api/content/sections/[id]
GET/POST       /api/content/blocks
PUT/DELETE     /api/content/blocks/[id]
GET/POST       /api/content/concepts
PUT/DELETE     /api/content/concepts/[id]
GET/POST       /api/content/feed-items
PUT/DELETE     /api/content/feed-items/[id]
GET/POST       /api/content/questions
PUT/PATCH/DELETE /api/content/questions/[id]
GET/POST       /api/content/exams
PUT/DELETE     /api/content/exams/[id]

GET    /api/media
POST   /api/media
DELETE /api/media/[id]

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

**Palette names:** sand (amber/gold), ink (warm grays), ember (orange). Theme persisted in `localStorage` as `'nafeer-theme'`. Default `'dark'` set on `<html>` tag.

---

## GSAP Rules

- Always `gsap.fromTo()`, never `gsap.from()` — `from()` can leave elements invisible in SSR
- Always `once: true` on ScrollTrigger instances
- Register plugins at module level: `gsap.registerPlugin(ScrollTrigger)`
- Wrap in `gsap.context(()=>{...}, ref)`, return `ctx.revert()` from cleanup

---

## Phase Status

| Phase | Title | Status |
|---|---|---|
| Phase 1 | Foundation — stores, routing, auth, scaffold | ✅ DONE |
| Phase 2 | Atlas Sync — real-time MongoDB persistence | ✅ DONE |
| Phase 3 | Versioning UI — status badges, review queue | ✅ DONE |
| Phase 4 | Content Graph UI — coverage badges, admin matrix | ✅ DONE |
| Phase 5 | Landing page + editor UX redesign | ✅ DONE |
| Phase 6 | Media — Supabase Storage, MediaPage, MediaPicker | ✅ DONE |
| Phase 7 | Interactive Media — image markers | ✅ DONE |
| Phase 8 | Contributor Pipeline — prejoin, interview, admin refactor | ✅ DONE |

---

## v6.0 Changes 

**New routes/pages:**
- `src/app/prejoin/page.jsx` — atmospheric mission brief, 5-section layout, no API calls
- `src/app/interview/page.jsx` — token-gated 5-question mini interview with micro-task
- `src/app/api/interview/route.js` — GET (validate) + POST (save answers)

**Modified files:**
- `src/lib/models/Contributor.js` — new fields: `background`, `fieldOfStudy`, `subjectsOfInterest[]`, `interviewToken`, `interviewExpiresAt`, `interviewAnswers{}`. `gender` now optional. `subject` no longer required at join.
- `src/app/api/contributors/request/route.js` — validates new fields, drops username/gender requirement
- `src/app/api/admin/contributors/route.js` — added `send_interview` action, returns `interviewLink`
- `src/middleware.js` — added `/prejoin` and `/interview` to matcher; `/prejoin` added to logged-in contributor redirect rule
- `src/components/landing/Navbar.jsx` — CTA → `/prejoin`
- `src/components/landing/Hero.jsx` — CTA → `/prejoin`
- `src/components/landing/NafeerSection.jsx` — CTA → `/prejoin`
- `src/components/landing/ProgressBoard.jsx` — both CTAs → `/prejoin`
- `src/app/admin/dashboard/` — fully modularised (14 files, see architecture above)

**Sanity check findings resolved:**
- `interviewToken` has `select: false` — ContributorCard correctly uses `interviewExpiresAt` as proxy for "token sent" instead of `c.interviewToken`
- All `'use client'` directives confirmed appropriate (pure constant/presentational files don't need it)
- All import paths verified for depth correctness (modals use `../../_constants`, sections use `../_constants`)

---

## Media System (Phase 6)

All media in Supabase Storage bucket `nafeer-media`. MongoDB `Media` model tracks metadata only. Path convention: `{subjectId}/{contentId}.{ext}`. `common` is a virtual subject ID for shared assets.

Supabase bucket: Public, RLS allows anon SELECT, service role INSERT/UPDATE/DELETE.

---

## Interactive Media — Markers (Phase 7)

Normalised coordinate markers (0–1 x/y) on IMAGE blocks and FIGURE questions. `ImageMarkerEditor` component: click-to-place, drag-to-reposition, inline edit panel. Coordinates are resolution-independent — Android multiplies by actual rendered dimensions at runtime.

---

## Remaining Known Gaps

| Item | Priority |
|---|---|
| `passwordHash` is `select: false` — admin can't distinguish "set" vs "unset" password | LOW — add `hasPassword` virtual |
| Tag sync — standalone PUT /api/content/tags/[id] | LOW |
| Conflict detection — Atlas version > local version on load | LOW |
| Changelog viewer — version history inline in editor | LOW |