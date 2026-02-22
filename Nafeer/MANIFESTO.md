# Nafeer × Basheer — Project Manifesto
> Context document for AI-assisted development sessions

---

## The Products

### Basheer (بشير)
Android app for **Sudanese high school students** preparing for university entrance.
- Arabic-first, RTL design, offline-first (all content bundled at install)
- Built with: Kotlin + Jetpack Compose, Room DB, Hilt DI, MVVM architecture
- Status: Core architecture stable, features integrating

**Five pillars:**
1. **Enhanced Lessons** — improved curriculum display with media, highlighting, time tracking
2. **Knowledge Feed** — Duolingo-style vertical scroll with mini-games (swipe T/F, MCQ, match)
3. **Interactive Lab** — live formula/3D simulations, change a parameter → see the result
4. **Question Bank** — massive exam/quiz bank across all subjects
5. **Gamification** — streaks, badges, progress tracking

---

### Nafeer (نفير)
Web platform serving two purposes:
1. **Public landing page** — pitches Basheer's vision, shows live build progress, attracts contributors
2. **Contributor CMS** — gated editor tool where approved experts map out subjects

**Brand rationale:**
- "Nafeer" (نفير) = collective community aid in Sudanese culture — everyone contributes what they can
- It rhymes with Basheer (بشير)
- Tagline candidates: *"مدعوم بنفير"* / *"انضم للنفير"*
- The two names together tell the full story: Basheer guides the students, Nafeer builds Basheer

---

## Tech Stack — Nafeer Web Platform

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15** (App Router) | SSR for landing page, API routes = serverless functions on Vercel |
| Styling | **Tailwind CSS v3** | RTL-compatible, custom design tokens |
| State (editor) | **Zustand** (persisted to localStorage) | Migrated from original Vite app |
| Database | **MongoDB Atlas** (free tier) | Flexible schema for contributor data, subject content |
| Auth | **JWT via jose** + httpOnly cookies | Simple, no third-party service needed |
| Deployment | **Vercel** | Native Next.js, free tier, serverless functions included |
| ODM | **Mongoose** | Atlas integration, model validation |

---

## Project Structure

```
nafeer/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.jsx                # Root layout (fonts, metadata, RTL)
│   │   ├── globals.css               # Design tokens, utilities
│   │   ├── page.jsx                  # Landing page (public)
│   │   ├── signin/page.jsx           # Sign in (redirects if authed)
│   │   ├── join/page.jsx             # Contributor request form
│   │   ├── editor/page.jsx           # Protected editor (server component)
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── signin/route.js   # POST: email+password → JWT cookie
│   │       │   └── signout/route.js  # POST: clear cookie
│   │       └── contributors/
│   │           └── request/route.js  # POST: save pending contributor
│   ├── components/
│   │   ├── landing/                  # Public page components
│   │   │   ├── Navbar.jsx
│   │   │   ├── Hero.jsx
│   │   │   ├── Features.jsx
│   │   │   ├── ProgressBoard.jsx     # Live subject status grid
│   │   │   ├── NafeerSection.jsx     # Contributor model explanation
│   │   │   └── Footer.jsx
│   │   └── editor/                   # CMS tool components (migrated from Vite)
│   │       ├── EditorShell.jsx       # Client shell with navigation state
│   │       ├── EditorSidebar.jsx     # Dark-themed sidebar with signout
│   │       ├── BlockEditor.jsx
│   │       ├── AddBlockMenu.jsx
│   │       ├── ConceptLinker.jsx
│   │       ├── LessonItem.jsx
│   │       ├── Modal.jsx
│   │       ├── SectionEditor.jsx
│   │       ├── UnitCard.jsx
│   │       ├── LessonsPage.jsx
│   │       ├── LessonEditorPage.jsx
│   │       ├── ConceptsPage.jsx
│   │       ├── FeedItemsPage.jsx
│   │       └── ExportPage.jsx
│   ├── lib/
│   │   ├── db.js                     # Mongoose connection (cached for serverless)
│   │   ├── auth.js                   # JWT sign/verify, cookie helpers
│   │   └── models/
│   │       └── Contributor.js        # Mongoose model
│   ├── store/
│   │   └── dataStore.js              # Zustand store (migrated, same schema)
│   ├── shared/
│   │   └── constants.js              # Block types, concept types, etc. (matches Android enums)
│   └── middleware.js                 # Route protection + auth redirects
├── .env.local.example                # Environment variable template
├── vercel.json                       # Vercel deployment config
├── next.config.js
├── tailwind.config.js
└── package.json
```

---

## Design System

**Palette:**
- `ink-950` (#0e0c09) — main background, near-black warm
- `sand-*` — primary amber/gold family for brand elements
- `ember-*` — accent orange for CTAs and highlights
- Text hierarchy: `sand-50` → `sand-100` → `ink-300` → `ink-400` → `ink-600`

**Typography:**
- Arabic body: Noto Naskh Arabic (400, 500, 600, 700)
- Display: Playfair Display (700, italic)
- Mono: JetBrains Mono (labels, tags, code)

**Design direction:** Dark, refined, editorial — warm ink-and-sand palette with grain texture overlay. Mesh gradient backgrounds. Glass morphism cards. Staggered entrance animations. Feels like a premium product, not a school project.

**Key CSS utilities:**
- `.grain` — full-page noise texture overlay via pseudoelement
- `.glass` — backdrop blur card style
- `.mesh-bg` — radial gradient atmosphere
- `.ember-line` — amber horizontal divider line
- `.card-hover` — lift on hover
- `.link-underline` — animated RTL underline

---

## Auth Flow

```
/join → POST /api/contributors/request → saved as { status: 'pending' }
Admin reviews in Atlas (manually, for now) → sets status: 'approved', adds passwordHash
Contributor → /signin → POST /api/auth/signin → JWT in httpOnly cookie
middleware.js → reads cookie → verifies JWT → allows /editor access
/editor → server component reads user from cookie → passes to EditorShell
```

**JWT payload:** `{ id, email, name, subject, role }`
**Cookie:** `nafeer_token`, httpOnly, 7-day expiry, secure in production

---

## Data Schema (Contributor model)

```js
{
  name: String,          // display name
  email: String,         // unique, lowercase
  passwordHash: String,  // select: false (never in default queries)
  subject: String,       // assigned subject
  background: String,    // their expertise claim
  motivation: String,    // optional
  status: enum['pending', 'approved', 'rejected'],
  role: enum['contributor', 'admin'],
  createdAt, updatedAt   // auto timestamps
}
```

---

## Editor Data Schema (matches Android Basheer app)

The Zustand store exports data in `BasheerExportData` format — a nested JSON that seeds the Android Room database directly.

```
Subject → Units → Lessons → Sections → Blocks
                           └→ Concepts (linked via IDs)
                           └→ FeedItems
Tags (linked to Concepts)
```

All IDs use pattern: `{prefix}_{timestamp}_{random6}` (e.g., `lesson_1706123456_a3b2c1`)

---

## Environment Variables Needed

| Variable | Where to get it |
|---|---|
| `MONGODB_URI` | Atlas Dashboard → Connect → Drivers → Node.js |
| `JWT_SECRET` | Generate: `openssl rand -base64 32` |

Add to Vercel: Project Settings → Environment Variables
Add locally: copy `.env.local.example` → `.env.local`

---

## Deployment Checklist (Vercel)

1. Push repo to GitHub
2. Import project in Vercel
3. Add env vars: `MONGODB_URI`, `JWT_SECRET`
4. Atlas: Whitelist `0.0.0.0/0` in Network Access (for serverless IPs)
5. Atlas: Create `nafeer` database, collections will auto-create
6. Deploy → done

---

## Next Steps (Pending)

- [ ] Admin dashboard to review/approve contributor requests
- [ ] Password setup flow for approved contributors (email link or admin sets it)
- [ ] ProgressBoard connected to Atlas (currently static placeholder data)
- [ ] Editor tool polish — dark theme applied to original components
- [ ] Subject assignment system (admin assigns subjects to contributors)
- [ ] Content versioning / export history
- [ ] Email notification on request approval

---

## Original Codebase Reference

Original Vite app location: `Basheer_Contribute/Nafeer/`
All editor components migrated to `src/components/editor/`
Import paths updated from relative (`../`) to absolute (`@/`)
Data store schema unchanged — fully compatible with Android export format
