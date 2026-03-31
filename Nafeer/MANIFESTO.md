# NAFEER × BASHEER — Project Manifesto
**v9.0 — March 2026 — Full Audit + Landing Polish**

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
| State | Zustand 5 — 7 domain slices |
| Database | MongoDB Atlas 512 MB free tier, Mongoose 8 ODM |
| Media Storage | Supabase Storage — dual-bucket (`basheer-media` + `nafeer-users`) |
| Auth | jose (JWT) + bcryptjs, two separate cookie systems |
| Animation | GSAP 3.12 + ScrollTrigger (npm, not CDN) |
| Math Rendering | KaTeX 0.16 — Arabic math pipeline in `src/lib/math/` |
| Image Processing | sharp 0.33 — WebP optimization via `src/lib/imageOptimizer.js` |
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
    globals.css
    demo/page.jsx                   ← standalone Basheer interactive demo
    signin/                         ← contributor auth
    prejoin/page.jsx                ← mission brief (Step 1 of pipeline)
    join/page.jsx                   ← expression of interest form (Step 2)
    interview/page.jsx              ← token-gated mini interview (Step 3)
    editor/page.jsx                 ← editor shell (auth-gated)
    onboard/page.jsx                ← post-approval: set password + bio + avatar
    admin/
      login/page.jsx
      dashboard/
        page.jsx                    ← orchestrator only (~72 lines)
        _constants.js               ← CONTRIBUTOR_STATUS, REVIEW_TYPE, NAV, SUBJECT_MAP, getPipelineStage
        _components/
          AdminSidebar.jsx
          ContributorCard.jsx
          ContributorsSection.jsx
          ReviewQueueSection.jsx
          CoverageSection.jsx
          MediaSection.jsx
          ui/
            Btn.jsx
            Modal.jsx
            shared.jsx
          modals/
            CreateContributorModal.jsx
            SetPasswordModal.jsx
            LinkModal.jsx
    api/                            ← see full API route table below
  components/
    landing/
      Navbar.jsx                    ← story-ordered nav, IntersectionObserver active state
      Hero.jsx                      ← cursor-glow watermark effect on بشير
      Problemsection.jsx            ← id="problem"
      Visionsection.jsx             ← id="vision"
      Features.jsx                  ← id="features"
      ProgressBoard.jsx             ← id="progress" — compact row layout
      NafeerSection.jsx             ← id="nafeer"
      ContributorsHallSection.jsx   ← id="contributors" — live public contributor cards
      Futuresection.jsx             ← id="future" — roadmap
      Finalcta.jsx                  ← id="join" — closing CTA
      Footer.jsx
    editor/
      layout/   EditorShell, EditorSidebar
      pages/    LessonsPage, ConceptsPage, FeedItemsPage, QuizBankPage, ExportPage, MediaPage
      lesson/
        LessonEditorPage.jsx
        SectionEditor.jsx
        LessonItem.jsx
        LessonFeedPanel.jsx
        LessonQuestionsPanel.jsx
        LessonPreviewModal.jsx
        LessonNotesDrawer.jsx       ← slide-in notes/flag panel, comment/flag/review_feedback types
        LessonHistoryDrawer.jsx     ← slide-in audit trail with diff blocks
        LinkVariationModal.jsx      ← modal to link a lesson as variation of another
        AttributionBar.jsx          ← compact created/updated/reviewed-by display
      blocks/   BlockEditor, AddBlockMenu, TableEditor
      media/    MediaPicker, ImageMarkerEditor
      units/    UnitCard, UnitView, SubjectOverview
      shared/
        Modal.jsx
        DeleteButton.jsx
        StatusBadge.jsx
        CoveragePanel.jsx
        ConceptLinker.jsx
        FormulaPreview.jsx          ← KaTeX renderer via shared Arabic math pipeline
    demo/
      DemoApp.jsx                   ← top-level demo shell, handles screen routing
      DemoSection.jsx
      GuidedTour.jsx                ← on-screen spotlight overlay tour
      blocks/                       ← block renderers for demo
      feed/   Feedcards.jsx
      screens/
        HomeScreen.jsx
        OnboardingScreen.jsx        ← name, academic path, grade selection
        FeedScreen.jsx              ← TikTok-style vertical snap-scroll feed
        LessonScreen.jsx
        QuizBankScreen.jsx
        ProfileScreen.jsx
  hooks/
    useAtlasSync.js                 ← all Atlas persistence logic
    useCoverageData.js              ← coverage fetch + cache
  lib/
    db.js, auth.js, adminAuth.js
    supabase.js                     ← lazy getClient(), uploadFile/uploadUserFile/deleteFile helpers
    LessonStatus.js
    imageOptimizer.js               ← sharp WebP pipeline, presets: content/avatar/thumb
    trackStat.js                    ← fire-and-forget contributor stat increment
    markerUtils.js                  ← normalised coordinate helpers for image markers
    math/
      KatexConfig.js
      NormallizeInput.js
      PostProcessMath.js
      RenderMath.js                 ← main entry: normalizeMathInput → katex.render → postProcessMath
    api/
      guard.js, content.js, Lessons.js, Concepts.js, Questions.js,
      feedItems.js, subject.js, reviewQueue.js
    models/
      Unit, Lesson, Section, Block, Concept, Tag, FeedItem,
      Question, Exam, Subject, Contributor, ContributorRole, Media,
      Admin, SiteSettings, LessonHistory
      versioning.js
  middleware.js
  shared/  curriculum.js, constants.js
  store/
    index.js                        ← re-exports all slices + composite useDataStore shim
    dataStore.js                    ← re-export facade for backward compatibility
    editorStore.js
    subjectStore.js
    contentStore.js
    conceptStore.js
    feedStore.js
    quizStore.js
    mediaStore.js
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

## Landing Page — Section Order & IDs

The landing is a narrative arc. Sections in render order:

| Component | Section ID | Story beat |
|---|---|---|
| Hero | — | Hook — بشير watermark, two CTAs |
| Problemsection | `problem` | The three problems with Sudanese education |
| Visionsection | `vision` | Before/after contrast pairs |
| Features | `features` | App feature showcase |
| ProgressBoard | `progress` | Live subject completion board |
| NafeerSection | `nafeer` | How to contribute |
| ContributorsHallSection | `contributors` | Live public contributor cards (toggleable via SiteSettings) |
| Futuresection | `future` | Roadmap chips |
| Finalcta | `join` | Closing CTA |
| Footer | — | — |

**Navbar links** (story-ordered, with IntersectionObserver active state):
- `#problem` المشكلة ٠١
- `#features` التطبيق ٠٢
- `#progress` المواد ٠٣
- `#nafeer` ساهم ٠٤

---

## Basheer Demo (`/demo`)

Standalone page at `src/app/demo/page.jsx`. No auth required. Fully self-contained — uses static `demoData.js`, no API calls.

- **Mobile:** 100dvh fixed, overflow hidden, no scroll. Just the app shell.
- **Desktop:** Centered phone shell (375×680px) with rounded corners + glow.
- **Onboarding flow:** name → academic path (science/literary) → grade
- **Path-aware content:** physics content for science track, Arabic history (الثورة المهدية) for literary track
- **Feed:** TikTok-style vertical snap-scroll
- **GuidedTour:** spotlight overlay with step-by-step callouts
- **Screens:** Home, Onboarding, Feed, Lesson, QuizBank, Profile

---

## Contributor Pipeline

Four-stage funnel. Each stage is a separate page/route. Contributors advance only when the admin sends them a link.

```
Stage 1 — Discover    /prejoin       Public page. Mission brief + role cards + expectations.
Stage 2 — Express     /join          Light form: name, email, background, subjectsOfInterest[].
Stage 3 — Interview   /interview     Token-gated. Questions driven by ContributorRole config.
Stage 4 — Onboarding  /onboard       Post-approval. Set password + bio + avatar.
```

### Stage 3 — Dynamic Interview Questions (v7.0+)

Questions are **no longer hardcoded**. They come from the `ContributorRole` model:

```js
// GET /api/admin/roles?active=true → used by /join to populate role selector
// Each role has:
interviewQuestions: [{ text, placeholder, minChars, order }]
microTask:          { prompt, minChars }
```

The `/interview` page reads the contributor's assigned role and renders its questions dynamically. The static 5-question list from v6.0 is gone — admins configure questions per role via the admin dashboard Roles panel.

### Contributor Model — Complete Fields

```js
// Identity
name, username (sparse unique), email, gender (optional)
bio (max 280 chars), avatarUrl, avatarPath (select: false)

// Assignment
subject      — subject ID assigned by admin (default '')
roleId       — ObjectId ref to ContributorRole (optional)
status       — 'pending' | 'interviewing' | 'approved' | 'rejected'
onboarded    — Boolean

// Application stage
background, fieldOfStudy, subjectsOfInterest[]

// Interview stage
interviewToken (select: false), interviewExpiresAt
interviewAnswers: {
  // dynamic: keyed by question._id string
  answers: Map<String, String>
  weeklyCommitment: 'occasional' | '2-3h' | '5h+'
  submittedAt: Date
}

// Auth
passwordHash (select: false)
onboardingToken (select: false), onboardingExpiresAt

// Stats (auto-incremented via trackStat.js)
stats: {
  lessonsCreated, questionsAdded, feedItemsCreated,
  blocksAdded, reviewsSubmitted, publishedLessons,
  lastActiveAt
}
```

---

## ContributorRole Model

Database-backed role definitions. Replaces any hardcoded role assumptions.

```js
{
  name, slug (auto-generated, unique), category ('content'|'development'|'design'),
  subcategory, description, isActive, order,
  interviewQuestions: [{ text, placeholder, minChars, order }],
  microTask: { prompt, minChars }
}
```

**Routes:**
- `GET /api/admin/roles` — full list (admin) or `?active=true` (public, for /join)
- `POST /api/admin/roles` — create role
- `PUT /api/admin/roles/[id]` — update role
- `DELETE /api/admin/roles/[id]` — deactivate (soft) or hard delete if no contributors use it

---

## Admin System — Database-Backed (v7.0+)

Admin credentials are no longer environment variables. The `Admin` model in MongoDB holds all admin accounts.

```js
{
  username (unique lowercase), email (unique lowercase),
  passwordHash (select: false), displayName,
  isActive, lastSignedInAt
}
```

**Routes:**
- `GET /api/admin/admins` — list all admins
- `POST /api/admin/admins` — create new admin (password min 8 chars)
- `DELETE /api/admin/admins` — remove admin

**Migration note:** `ADMIN_USERNAME` / `ADMIN_PASSWORD` env vars are no longer used by the auth flow. A seed script or first-run UI must create the initial admin document.

---

## SiteSettings Model

Singleton document (`key: 'global'`). Controls landing page behaviour.

```js
{
  key: 'global',
  showContributorsOnLanding: Boolean  // default: true
}
```

**Routes:**
- `GET /api/site-setting` — public, returns `{ showContributorsOnLanding }`
- `GET /api/admin/site-setting` — admin full read
- `PATCH /api/admin/site-setting` — admin update

`ContributorsHallSection` fetches both `/api/site-setting` and `/api/contributors/public` in parallel. If `showContributorsOnLanding` is false the whole section is hidden client-side.

---

## Lesson Notes System

Embedded subdocuments on the `Lesson` model. `notesCount` is denormalized for fast list indicators without loading note content.

```js
notes: [{
  authorId (ref: Contributor, nullable for admin notes),
  authorName, authorRole ('contributor'|'admin'),
  type: 'comment' | 'review_feedback' | 'flag',
  text,
  resolved: Boolean
}]
notesCount: Number  // denormalized total
```

**Routes:**
- `GET /api/content/lessons/[id]/notes`
- `POST /api/content/lessons/[id]/notes`
- `PATCH /api/content/lessons/[id]/notes/[noteId]` — resolve/unresolve, edit text
- `DELETE /api/content/lessons/[id]/notes/[noteId]`

**UI:** `LessonNotesDrawer` — slides in from the right, supports add/resolve/delete.

---

## Lesson History System

Separate `LessonHistory` collection (not embedded). One document per version bump. Lean by design — only changed fields stored.

```js
{
  lessonContentId: String (indexed),
  version: Number,
  action: 'created'|'edited'|'reviewed'|'approved'|'archived',
  authorId, authorName, authorRole,
  label, note,
  diff: Map<String, { from, to }>  // sparse, only changed fields
}
```

**Routes:**
- `GET /api/content/lessons/[id]/history?limit=N` — full audit trail, newest first, default limit 50

**UI:** `LessonHistoryDrawer` — slides in from the right, expandable diff blocks per entry.

---

## Lesson Variations

Flat parent-pointer model. Depth capped at one level — variations cannot have their own variations.

```js
// On Lesson model:
parentLesson:  String | null  // contentId of parent, null = root lesson
variationType: 'alternative' | 'prerequisite' | 'extension' | 'simplified' | null
variationNote: String | null  // optional context note
```

**Variation types:**
| Type | Arabic | Meaning |
|---|---|---|
| `alternative` | بديل | Different author/approach to same content |
| `prerequisite` | متطلب | Foundation content to study before parent |
| `extension` | توسع | Deeper/more advanced content after parent |
| `simplified` | مبسط | Simplified version for struggling students |

**UI:** `LinkVariationModal` — searchable lesson picker with type selector and note field. `VARIATION_CONFIG` exported from the modal file.

**Sync:** `useAtlasSync` includes `parentLesson`, `variationType`, `variationNote` in lesson sync payload.

**Known gaps:**
- Variation coverage scoring not implemented
- Cross-unit variation tree display not implemented
- `ContentVariant` entity in Android Room DB has no corresponding CMS model or export support

---

## Contributor Profile & Avatar

Contributors can update their own profile and avatar after onboarding.

**Routes:**
- `GET /api/contributors/me` — current contributor's full profile
- `PATCH /api/contributors/me` — update bio, display name
- `POST /api/contributors/me/avatar` — multipart upload, optimizes to WebP 400×400, stores in `nafeer-users/{id}.webp`, deletes previous avatar

**Public route:**
- `GET /api/contributors/public` — approved + onboarded contributors only. Returns: name, username, avatarUrl, bio, subject, stats. Sorted by contribution score (`lessons×3 + questions + feedItems×2`).

---

## Image Optimization Pipeline

`src/lib/imageOptimizer.js` — Sharp-based, three presets:

| Preset | Max Size | Quality | Crop |
|---|---|---|---|
| `content` | 1200w | 85 | preserve ratio |
| `avatar` | 400×400 | 90 | cover crop |
| `thumb` | 320w | 80 | preserve ratio |

GIFs and SVGs are returned unchanged. Returns `{ buffer, mimeType, originalSize, optimizedSize, skipped }`.

Used by: `POST /api/contributors/me/avatar` (avatar preset) and `POST /api/media` (content preset).

---

## Stat Tracking

`src/lib/trackStat.js` — fire-and-forget, never awaited, never blocks a content response.

```js
trackStat(contributorId, 'lessonsCreated');
// Available keys: lessonsCreated | questionsAdded | feedItemsCreated
//                 blocksAdded | reviewsSubmitted | publishedLessons
```

Called from content creation API handlers. Always also sets `stats.lastActiveAt`.

---

## KaTeX / Arabic Math Pipeline

`src/lib/math/` — four-stage pipeline:

1. **NormallizeInput** — converts Arabic operator names (e.g. `نها`) to LaTeX macros
2. **KatexConfig** — macro registry, Arabic-aware settings
3. **katex.render** — core rendering
4. **PostProcessMath** — post-processing for Arabic text placement, `.mop` operator styling (Amiri font)

**Critical conventions:**
- Superscripts: `{}^{2}س` NOT `س^{2}` — KaTeX uses absolute internal positioning that CSS `direction` cannot affect
- Textarea inputs need `unicodeBidi: 'plaintext'` to prevent Arabic characters from scrambling LaTeX syntax

**UI:** `FormulaPreview` in `editor/shared/` — takes `latex`, `displayMode`, `rtlMath` props. Always imports `katex/dist/katex.min.css`.

---

## Supabase Media System

Dual-bucket strategy:

| Bucket | Env var | Used for |
|---|---|---|
| `basheer-media` | `SUPABASE_MEDIA_BUCKET` | Educational content images, GIFs |
| `nafeer-users` | `SUPABASE_USERS_BUCKET` | Contributor avatars |

**Pattern:** Lazy `getClient()` — module-level singleton is recreated via a getter to prevent reference loss when Next.js serverless bundler splits modules across chunks.

**Helpers in `supabase.js`:**
- `uploadFile(bucket, path, buffer, mimeType)` — core upload
- `uploadUserFile(path, buffer, mimeType)` — shorthand for `nafeer-users`
- `deleteFile(bucket, path)` — remove by path
- `getPublicUrl(bucket, path)` — construct public URL

Path convention for content: `{subjectId}/{contentId}.{ext}`. Path for avatars: `{contributorId}.webp`.

---

## Marker System

`src/lib/markerUtils.js` — normalized coordinate helpers.

Markers use 0–1 x/y coordinates (relative to image dimensions). Android multiplies by actual rendered dimensions at runtime. Stored on IMAGE blocks and FIGURE questions as `markers[]` arrays. `ImageMarkerEditor` handles click-to-place, drag-to-reposition.

---

## Environment Variables

```
MONGODB_URI                    — MongoDB Atlas connection string
JWT_SECRET                     — signs both contributor and admin JWTs
NEXT_PUBLIC_APP_URL            — base URL (used to construct interview/onboarding links)
NEXT_PUBLIC_SUPABASE_URL       — Supabase project URL (safe to expose)
SUPABASE_SERVICE_ROLE_KEY      — Supabase service role key (server only)
SUPABASE_MEDIA_BUCKET          — content media bucket (default: basheer-media)
SUPABASE_USERS_BUCKET          — avatar bucket (default: nafeer-users)
```

**Removed:** `ADMIN_USERNAME`, `ADMIN_PASSWORD` — no longer used. Admins are now DB records.

---

## Auth Systems (Two Completely Separate)

**Contributor auth:**
- JWT in cookie `nafeer_token`, signed with jose
- `middleware.js` protects `/editor/*` → redirect to `/signin`
- `/prejoin`, `/join`, `/interview`, `/onboard` are all public
- Logged-in contributors hitting `/signin`, `/join`, or `/prejoin` are redirected to `/editor`

**Admin auth:**
- JWT in cookie `nafeer_admin`, role must be `"admin"`
- `middleware.js` protects `/admin/dashboard`
- Separate login at `/admin/login`
- Credentials stored in `Admin` MongoDB collection (not env vars)

---

## State Management

Seven Zustand slices. `useDataStore` composite hook in `src/store/dataStore.js` is a re-export facade — all editor components import from here, preserving backward compatibility.

| Store | Contains | localStorage key |
|---|---|---|
| `useSubjectStore` | subject, units, lessons | `basheer-subject` |
| `useContentStore` | sections, blocks | `basheer-content` |
| `useConceptStore` | concepts, tags | `basheer-concepts` |
| `useFeedStore` | feedItems | `basheer-feed` |
| `useQuizStore` | questions, exams | `basheer-quiz` |
| `useEditorStore` | UI state (active lesson, page, sync status) | — |
| `useMediaStore` | media[] — loaded once per session | — |

---

## Atlas Sync — `useAtlasSync`

**Pattern:** edits hit the store immediately (optimistic) → sync fires fire-and-forget → errors are `console.warn`'d, never block UI. IDs pre-generated client-side so sync fires immediately.

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

## API Routes (Complete)

```
POST   /api/auth/signin
POST   /api/auth/signout
GET    /api/auth/heartbeat
GET    /api/auth/onboard?token=
POST   /api/auth/onboard

POST   /api/contributors/request        ← Step 2: expression of interest
GET    /api/contributors/me
PATCH  /api/contributors/me
POST   /api/contributors/me/avatar
GET    /api/contributors/public         ← public, approved+onboarded only

GET    /api/interview?token=
POST   /api/interview

POST   /api/admin/login
POST   /api/admin/logout
GET    /api/admin/admins
POST   /api/admin/admins
DELETE /api/admin/admins
GET    /api/admin/contributors
POST   /api/admin/contributors
PATCH  /api/admin/contributors          ← actions: approve|reject|set_password|
                                           reset_to_pending|generate_onboard_link|send_interview
DELETE /api/admin/contributors
GET    /api/admin/review-queue
PATCH  /api/admin/review-queue
GET    /api/admin/roles                 ← full list, admin auth
POST   /api/admin/roles
PUT    /api/admin/roles/[id]
DELETE /api/admin/roles/[id]
GET    /api/admin/site-setting
PATCH  /api/admin/site-setting

GET    /api/site-setting                ← public, safe fields only

POST   /api/content/subject
GET    /api/content/subject
DELETE /api/content/subject/[id]        ← admin only, cascades all child content
GET/POST       /api/content/lessons
PUT/DELETE     /api/content/lessons/[id]
GET/POST       /api/content/lessons/[id]/notes
PATCH/DELETE   /api/content/lessons/[id]/notes/[noteId]
GET            /api/content/lessons/[id]/history
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

GET    /api/coverage                    ← public, all subjects summary (for ProgressBoard)
GET    /api/coverage/[subjectId]        ← per-lesson detail

GET    /api/export

GET    /api/admin/roles?active=true     ← public variant, active roles only (for /join)
GET    /api/dev/autologin               ← development only, gated by NODE_ENV
```

---

## Design System

Dark-first. CSS custom properties on `:root` and `:root[data-theme="light"]`. Theme persisted in `localStorage` as `'nafeer-theme'`. Default `'dark'` set directly on `<html>` tag in `layout.jsx`.

| Token | Dark | Light |
|---|---|---|
| `--bg-primary` | `#0e0c09` (near-black warm) | `#f2e6d0` (warm amber-cream) |
| `--bg-secondary` | `#1a1713` | `#e9dbc0` |
| `--bg-card` | `rgba(255,255,255,0.03)` | `rgba(251,243,228,0.88)` |
| `--text-primary` | `#fdf8f0` | `#180f04` |
| `--text-secondary` | `#b7b0a3` | `#3d250a` |
| `--text-muted` | `#7d7366` | `#7a5220` |
| `--accent` | `#d4891e` | `#b86c14` |

**Body font scaling (globals.css):** `15px` base → `16px` at xl (1280px) → `17px` at 2xl (1536px).

**Palette names:** sand (amber/gold), ink (warm grays), ember (orange).

---

## GSAP Rules

- Always `gsap.fromTo()`, never `gsap.from()` — `from()` can leave elements invisible in SSR
- Always `once: true` on ScrollTrigger instances
- Register plugins at module level: `gsap.registerPlugin(ScrollTrigger)`
- Wrap in `gsap.context(()=>{...}, ref)`, return `ctx.revert()` from cleanup
- For scroll fade + y-parallax on same element: target separate child elements for opacity and y — don't apply both to the same GSAP target or they'll fight

---

## Key Learnings & Gotchas

- **Next.js 15 `params`:** must be `await`-ed in dynamic route handlers — synchronous access causes `undefined` params
- **Route file casing:** all route files must be lowercase `route.js` — capital-R `Route.js` is invisible to Vercel's Linux FS
- **Import casing:** Vercel's Linux FS is case-sensitive; import paths must exactly match filenames
- **Supabase client:** lazy `getClient()` pattern — module-level singleton loses reference when Next.js serverless bundling splits modules across chunks
- **Atlas sync:** IDs pre-generated client-side before store updates so sync fires immediately. All sync functions fire-and-forget with `.catch(() => {})` — UI never blocks. Local Zustand state is authoritative.
- **RTL layout:** right edge is the leading visual edge. `divide-x` places borders on wrong edge in RTL grids; use explicit `border-l`/`border-r`. Visual hierarchy anchors should start from right.
- **KaTeX + Arabic:** superscript convention `{}^{2}س` (not `س^{2}`). Textarea inputs need `unicodeBidi: 'plaintext'`.
- **Theme hydration:** default `data-theme="dark"` must be set on `<html>` tag in `layout.jsx`, not injected by script alone, to prevent hydration mismatch.
- **GSAP + scroll opacity:** when GSAP applies both `y` parallax and `opacity` fade via scroll, split them across separate elements so they don't override each other. (Hero watermark: outer wrapper = y, base span = opacity)
- **Cursor-glow pattern:** use `radial-gradient` CSS mask on a full-opacity overlay layer. Update `maskImage` directly on the DOM ref — never via state. Init mask to off-screen position so nothing shows before first hover.

---

## Data Model

**Atomic unit:** concept (مفهوم). Everything else references concepts.

**Hierarchy:**
```
Subject → Units → Lessons → Sections → Blocks   (lesson content)
Concepts → FeedItems                             (Basheer feed cards)
Questions → Exams                                (quiz bank + past papers)
```

**Versioning:** every model uses `versioningFields`. `applyVersionBump()` called on every content PUT — increments version, appends changelog, resets `atlasStatus` from `approved` → `draft`.

**Content status lifecycle:**
```
null → draft       (first sync)
draft → review     (contributor submits)
review → approved  (admin approves)
review → draft     (admin rejects)
approved → draft   (any edit triggers applyVersionBump)
```

---

## Coverage System

**Score formula (0–100):** 40% sections+blocks · 30% feedItems≥concepts · 30% questions≥concepts×2

**Levels:** `high` (≥80) `medium` (≥40) `low` (>0) `none` (0)

`useCoverageData(subjectId)` — module-level cache, one fetch per session per subject.

**Coverage UI locations:** CoveragePanel (lesson editor sidebar), LessonItem dots, UnitCard badge, LessonsPage header, admin Coverage Matrix, ProgressBoard (landing).

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
| Phase 9 | Role system, admin DB, notes, history, variations, demo | ✅ DONE |

---

## v9.0 Changes (This Session)

**Landing page polish:**
- `Navbar.jsx` — nav links rewritten to follow storytelling arc (٠١–٠٤). `IntersectionObserver`-based active section highlighting with dot indicator. Cleaner mobile drawer with step numbers and story prompt.
- `ProgressBoard.jsx` — full redesign from tall cards to compact horizontal rows. Single color-accent bar, inline progress bar, two-column grid at md+. Dramatically less vertical space on mobile.
- `Hero.jsx` — cursor-glow watermark effect on the بشير background text. Two-layer technique: base dim span (GSAP-controlled opacity) + glow accent span revealed via `radial-gradient` CSS mask updated directly on a DOM ref (zero re-renders). GSAP scroll parallax separated: outer wrapper handles y-translation, base span handles opacity fade.
- `globals.css` — light mode overhauled: `--bg-primary` → warm amber-cream `#f2e6d0` (was near-white `#fdf8f0`). `--text-primary` → near-black `#180f04`, `--text-secondary` → rich dark brown `#3d250a` for higher contrast. Body font-size now scales responsively: 15px → 16px (xl) → 17px (2xl).

**Manifesto gaps filled (features that existed but were undocumented):**
- `ContributorRole` model + dynamic interview questions
- `Admin` model + database-backed admin auth (no more env-var credentials)
- `SiteSettings` model + public/admin routes
- `LessonHistory` model + audit trail system
- Lesson notes subdocument + drawer UI + API routes
- Lesson variations (parentLesson/variationType/variationNote) + LinkVariationModal + AttributionBar
- Contributor profile/avatar API routes + stat tracking system
- `imageOptimizer.js` sharp pipeline
- `trackStat.js` fire-and-forget stat helper
- `src/lib/math/` KaTeX pipeline
- Supabase dual-bucket confirmed (basheer-media + nafeer-users)
- `/demo` standalone page + full demo component tree
- All new landing sections: Problemsection, Visionsection, ContributorsHallSection, Futuresection, Finalcta
- Complete API route inventory (30+ routes, several previously unlisted)
- `FormulaPreview` shared editor component

---

## Remaining Known Gaps

| Item | Priority |
|---|---|
| `hasPassword` virtual — admin can't distinguish set vs unset password (passwordHash is select:false) | LOW |
| `ContentVariant` Android Room entity has no CMS model, export, or UI | LOW |
| Variation coverage scoring | LOW |
| Cross-unit variation tree display | LOW |
| Tag sync — standalone `PUT /api/content/tags/[id]` | LOW |
| Conflict detection — Atlas version > local version on bootstrap | LOW |
| Initial admin seed — `ADMIN_USERNAME`/`ADMIN_PASSWORD` env vars removed; first admin needs manual DB insert or seed script | MEDIUM |