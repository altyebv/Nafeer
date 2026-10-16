# Nafeer design system

One visual language for the landing page, the contributor flow (join → prejoin →
interview → onboard → signin), the editor, the public profile and the admin
dashboard.

**Decided (2026-10-15):**
- Keep the site's own warm ink/sand look. Don't adopt the Basheer app's palette.
  The `/demo` phone shell keeps its `.bsh` scope, because it mirrors the app
  on purpose.
- Use Western digits (0–9) everywhere, with tabular figures in stats.

**Goal:** a later visual change should be one token edit, not a sweep through
140 files.

---

## 1. Where we start from

| | Count | Where it's used |
|---|---|---|
| `ink-*` / `sand-*` classes | ~2,800 | Editor, admin, onboard, signin |
| `var(--bg-primary)`, `var(--text-*)` … | ~890 | Landing, join, prejoin, interview, profile (mostly through `style={{}}`) |
| Raw Tailwind palette (`emerald-400`, `red-900/30` …) | ~720 | Editor 293, admin 429 |
| Hex literals in JS | 418 | Everywhere |
| `style={{ … }}` | 1,934 | Landing 288, editor 340, admin 493, flow pages ~225 |
| Arbitrary `text-[Npx]` sizes | 110 | Including 9px and 8px |
| `font-mono` | 508 | 56 of them on Arabic labels, with letter spacing |
| Number formats | 4 | `ar-SA`, `ar-EG`, `ar-EG-u-nu-latn`, `en-US` |
| Copies of the same UI | 2 of each | Two buttons (admin `Btn`, ad-hoc in the editor), two modals, two empty states, `StatusBadge` and `StatusChip` |

The `ink`/`sand` ramps are already theme-aware and contrast-audited. They become
the foundation of the system. The other three color systems become aliases of
it, and then go away.

---

## 2. Token architecture

There are three layers. Each layer may only read from the layer below it.

```
 raw ramps        --ink-50 … --ink-950, --sand-50 … --sand-900, status hues
     ↓            (channel triplets, redefined per theme; the ONLY place a colour value lives)
 semantic roles   --surface-*, --fg-*, --line-*, --accent-*, --status-*
     ↓            (what a thing IS, not what colour it is)
 components       Button, Card, Field, PageHeader …
                  (read roles only; never ramps, never hex)
```

Pages use components and role classes. A page that reaches for `ink-700`
directly is a smell. After migration, the lint check (§9) flags it.

### 2.1 Semantic roles

Values are given for the dark and light themes. Each one points at an existing
ramp step, so contrast stays where it was audited.

**Surfaces**

| Role | Tailwind | Dark | Light | Use |
|---|---|---|---|---|
| `--surface-page` | `bg-page` | ink-950 | ink-950 | Page background |
| `--surface-raised` | `bg-raised` | ink-900 (`#201c16`, 1.15:1 on the page) | ink-900 | Cards, panels, list rows |
| `--surface-sunken` | `bg-sunken` | ink-950 | ink-950 / 60% | Inputs, wells inside cards |
| `--surface-overlay` | `bg-overlay` | ink-900 + shadow | ink-900 + shadow | Modals, menus, drawers |
| `--surface-chrome` | `bg-chrome` | `--chrome-bg` | `--chrome-bg` | Sidebar, navbar, bottom nav |
| `--surface-hover` | `bg-hover` | ink-800 / 50% | ink-800 / 50% | Row and button hover |
| `--surface-selected` | `bg-selected` | sand-500 / 10% | sand-500 / 14% | Active tab, chosen option |

**Text**

| Role | Tailwind | Dark | Light | Use |
|---|---|---|---|---|
| `--fg-strong` | `text-fg-strong` | ink-100 | ink-100 | Headings |
| `--fg` | `text-fg` | ink-200 | ink-200 | Body |
| `--fg-muted` | `text-fg-muted` | ink-400 | ink-400 | Secondary copy, descriptions |
| `--fg-subtle` | `text-fg-subtle` | ink-500 | ink-500 | Hints, metadata, and placeholders through `::placeholder` |
| `--fg-accent` | `text-fg-accent` | sand-300 | sand-200 | Accent text, links, eyebrows |
| `--fg-on-accent` | `text-fg-on-accent` | ink-950 | ink-950 | Text on a solid accent fill |

**Lines, accent and focus**

| Role | Tailwind | Dark / Light | Use |
|---|---|---|---|
| `--line` | `border-line` | ink-800 / 60% | Default border and divider |
| `--line-strong` | `border-line-strong` | ink-700 | Input borders, emphasis |
| `--line-accent` | `border-line-accent` | sand-500 / 40% | Selected card, focus-within |
| `--accent-fill` | `bg-accent` | sand-600 | Primary button fill. One per view |
| `--accent-fill-hover` | `bg-accent-hover` | sand-500 / **sand-300** | Hover state of the fill. Lighter on dark, darker on cream |
| `--accent-wash` | `bg-accent-wash` | sand-500 / 10% | Callouts, highlighted rows |
| `--focus-ring` | — | sand-500 | Global `:focus-visible` (already in place) |

**Naming notes.**
- The fill is `--accent-fill`, not `--accent`. The legacy `--accent` variable
  is used about 230 times as a *text* colour, so it keeps that meaning until
  those sites migrate.
- Roles carry their own alpha, so Tailwind opacity modifiers (`bg-raised/50`)
  don't work on them. Pick the role that means what you want instead.

**Status.** `success`, `warn`, `danger`, `info` and `special` each have a
`DEFAULT` (text), `surface` (wash) and `border` variant. DS0.1 retuned them
from Tailwind defaults to a warm set that sits on sand:

| Role | Dark | Light |
|---|---|---|
| success (sage) | `#8cc084` | `#2f6b3a` |
| warn (burnt orange) | `#f0904a` | `#9c5410` |
| danger (rose red) | `#f07178` | `#9e1f4a` |
| info (slate teal) | `#6fb3c4` | `#1f5f7a` |
| special (warm lavender) | `#c9a0dc` | `#6e3a8a` |

These were checked in OKLab:
- Dark: the closest pair is ΔE 0.102. The old amber warn was 0.051 from the
  accent text, so a "pending" badge read as a highlight.
- Light: the closest pair is ΔE 0.119.
- All are at least 5.1:1 on cards.

Status is never shown by colour alone. A `Badge` always pairs a dot or icon
with a word. The ~720 raw palette uses migrate onto these roles.

**Subject and category colours** (the coloured bars on subject rows, block-type
accents in `AddBlockMenu`) come from one `--cat-1 … --cat-8` set, tuned per
theme. Raw `blue-400` and `teal-400` are no longer used.

### 2.2 Legacy aliases (temporary)

The landing variables become aliases. All of today's code keeps rendering while
it migrates:

```css
--bg-primary:    var(--surface-page);
--bg-card:       var(--surface-raised);
--text-primary:  var(--fg-strong);
--text-secondary:var(--fg);
--text-muted:    var(--fg-muted);
--border-subtle: var(--line);
--border-mid:    var(--line-strong);
--accent-text:   var(--fg-accent);
```

**Visible change to review:** the landing page's dark background moves from
`#15110d` to `ink-950` (`#0e0c09`). That's slightly darker, and it means one
page tone across the site. If the landing's warmer tone is the one we want, we
re-tune `ink-950` instead, and the editor follows.

---

## 3. Typography

### 3.1 Typefaces

| Face | Role | Rule |
|---|---|---|
| **Noto Naskh Arabic** | Headings and reading text (`t-display`, `t-h1`, `t-h2`, `t-body`, lesson content) | `font-arabic`. Never letter-spaced |
| **IBM Plex Sans Arabic** | Interface text: buttons, tabs, labels, rows, captions (`t-title` and below) | `font-ui`. Added in DS0.1, because Naskh is tall and busy at 12–14px in dense controls |
| **JetBrains Mono** | Latin code, IDs (`GEOGRAPHY_U1_L1`), version tags | Never on Arabic. Its stack falls back to Naskh, so a mixed string still joins correctly |
| Amiri / Cairo | Math rendering only (`postProcessMath`) | Unchanged |
| ~~Playfair Display~~ | — | Loaded on every page, used nowhere. Remove it from the font request |

**The eyebrow fix.** Small labels above headings ("لماذا بشير", "داخل التطبيق")
are set in a monospace font with `tracking-widest`. JetBrains Mono has no
Arabic glyphs, so the browser falls back to a system face and then pulls the
joined letters apart. The fix that already exists inside `.admin-shell`
(Naskh fallback, tracking reset) becomes global. Then a dedicated
`.t-eyebrow` style replaces the pattern.

### 3.2 Type scale

The scale has nine named steps. Arbitrary `text-[Npx]` sizes are no longer
allowed. **12px is the floor for Arabic.** Naskh's small sizes close up
below it. 11px exists only for digits and Latin text inside counters.

| Token | Size / line height / weight | Use |
|---|---|---|
| `t-display` | Naskh · clamp(2.5rem, 6vw, 4.5rem) / 1.15 / 700 | Landing hero only |
| `t-h1` | Naskh · 1.75rem → 2rem (sm and up) / 1.3 / 700 | Page title |
| `t-h2` | Naskh · 1.375rem / 1.4 / 700 | Section title |
| `t-body` | Naskh · `--fs-body` (fluid 15 → 17px) / 1.8 / 400 | Reading text: landing prose, lesson content |
| `t-title` | Plex · 1.125rem / 1.5 / 600 | Card title, dialog title |
| `t-ui` | Plex · 0.875rem / 1.6 / 500 | Controls, list rows, form values |
| `t-label` | Plex · 0.8125rem / 1.5 / 500 | Field labels, tabs, chips |
| `t-caption` | Plex · 0.75rem / 1.5 / 400 | Hints, timestamps, metadata |
| `t-eyebrow` | Plex · 0.8125rem / 1.4 / 600, `fg-accent`, no tracking | Label above a heading |

The sizes are in rem, so they follow the reader's browser font setting.
`body` and `t-body` share one fluid value, `--fs-body`. That replaces the
three px breakpoints (15/16/17) the rest of the scale used to ignore.

The two smallest Tailwind steps are redefined to match: `text-2xs` becomes
12px and `text-xs` becomes 13px. That's what `.admin-shell` already does. The
override goes site-wide, and the scoped one is deleted. **Visible change to
review:** the editor gets slightly less dense.

### 3.3 Numbers

- One formatter module, `src/lib/format.js`, with `formatNumber`,
  and `formatDate` with named presets (`short`, `medium`, `full`, `long`,
  `month`, `monthShort`, `time`, `shortDateTime`, `dateTime`). Everything
  uses the `ar-SD-u-nu-latn-ca-gregory` locale: Sudanese Arabic month and day
  names, digits 0–9, and the Gregorian calendar. Before this, `ar-SA` had been
  quietly rendering admin dates in the Hijri calendar. `formatRelative` and
  `formatDuration` will be added when their call sites migrate.
- Calling `toLocaleString` / `toLocaleDateString` anywhere else counts as a
  violation.
- Stats and counters get `.t-num` (`tabular-nums`) so columns line up.
  Monospace digits are not used for this.
- Hand-written Arabic-Indic digits in copy and constants (`'٠١'`, `'١٢'`) are
  replaced, so the landing page's "13 / 14 / ١٢ subjects" problem can't come
  back in a different script.

---

## 4. Spacing and layout

- **Base unit 4px.** Use Tailwind's default spacing scale only. No arbitrary
  `p-[13px]`.
- **Gutters:** `px-4 sm:px-6 lg:px-8` everywhere. Admin and `EditorPage`
  already use this.
- **Content widths:** `EditorPage`'s intents become site-wide:

  | Width | Max | Use |
  |---|---|---|
  | `prose` | 720px | Forms, one record |
  | `content` | 1024px | Mixed content |
  | `wide` | 1280px | Grids and lists |
  | `full` | none | The page manages its own width |

  Landing sections pick one of these widths instead of a per-section `max-w-*`.
- **Vertical rhythm:** inside a card, 16px between related items and 24px
  between groups. Landing sections use one `section` padding token
  (`py-20 sm:py-28`), replacing today's mix of py-24, py-36 and empty spacer
  bands.
- **Breakpoints:** Tailwind's defaults plus `xs` at 375px, which already
  exists. Use `useBreakpoint` for JS decisions.

## 5. Shape and depth

| Token | Value | Use |
|---|---|---|
| `rounded-chip` | 6px | Chips, badges, small icon buttons |
| `rounded-control` | 10px | Buttons, inputs |
| `rounded-card` | 14px | Cards, panels, list containers |
| `rounded-panel` | 20px | Modals, hero panels |
| `rounded-full` | — | Pills, avatars, status dots |

These are named for what they round, so they never collide with Tailwind's
size-named defaults (`rounded-md`, `rounded-lg`), which existing code still
uses about 984 times. Each surface switches to the semantic names when it
migrates.

**Depth comes from borders, not shadows.** Surfaces are separated by `line`
and a step in surface colour. Only two shadows exist: `--shadow-overlay`
(modals, menus, drawers) and `--shadow-lift` (landing card hover). Glows and
mesh gradients stay as landing-page decoration only.

## 6. Motion

| Token | Value | Use |
|---|---|---|
| `--dur-fast` | 120ms | Hover, press |
| `--dur` | 200ms | Open and close, tab switch |
| `--dur-slow` | 400ms | Page-level reveal |
| `--ease-out` | cubic-bezier(.2, .8, .2, 1) | Default easing |

**Rules:**

1. **Content is visible by default.** A reveal is an enhancement. JS adds a
   class that animates *from* hidden. Nothing ships at `opacity: 0` in the
   HTML. This fixes the blank landing sections (109 elements today).
2. `prefers-reduced-motion: reduce` turns off every reveal, parallax and
   ambient loop. One shared GSAP helper enforces this, instead of each of the
   9 landing components handling it (today only 1 does).
3. The editor and admin use no entrance animations. They're work tools.

## 7. Iconography

- Use `lucide-react` only. It's already the sole icon library, with 42
  imports.
- Sizes: 14 inline with text, 16 in buttons, 20 for standalone. Stroke 1.75.

**Stacking order (DS0.1).** Use the named layers `z-sticky` (10), `z-nav` (20),
`z-popover` (30), `z-modal` (40) and `z-toast` (50). Components never use a
raw z number.
- No emoji as UI. The 🧠 💾 ⚡ toggles on the section header become labelled
  icons.
- An icon-only control always has an `aria-label` and a tooltip.

---

## 8. Components

These live in `src/components/ui/`. The editor, the admin, the flow pages and
the landing forms all import from here. Duplicates are removed when their last
caller moves over.

| Component | API | Replaces |
|---|---|---|
| `Button` | `variant: primary \| secondary \| ghost \| danger`, `size: sm \| md \| lg`, `icon`, `loading`, `block` | Admin `Btn`, ad-hoc editor and landing buttons |
| `IconButton` | `label` (required), `icon`, `size`, `tone` | Editor toolbar buttons |
| `Field` | `label`, `hint`, `error`, `required`, wraps `Input` / `Textarea` / `Select` | Editor `Field`, the join and signin inputs |
| `Card` | `as`, `padding`, `interactive`, optional `header` / `footer` | `glass`, `card-hover` and ad-hoc `bg-ink-900 border…` |
| `PageHeader` | `title`, `description`, `breadcrumb`, `actions`, `children` (tabs, filters) | Admin `SectionHeader`, `EditorPage` header, the quiz bank's header card |
| `EmptyState` | `icon`, `title`, `description`, `action` | Admin `EmptyState`, three editor variants |
| `Badge` | `tone: neutral \| accent \| success \| warn \| danger \| info \| special`, `dot` | `StatusBadge`, `StatusChip`, `StatsChip` |
| `Stat` | `value`, `label`, `icon`, `hint` (formats through `format.js`) | Dashboard, profile and landing stat cards |
| `Tabs` / `Segmented` | Controlled, keyboard arrows, `count` badge | Lesson tabs, quiz bank tabs, media filters |
| `Dialog` / `Drawer` | Existing `Drawer` plus one `Dialog` | Editor `Modal`, admin `modal` |
| `Confirm` | Inline popover. Stays open until the user answers or presses Esc | `DeleteButton`'s confirm, which auto-dismisses |
| `SaveStatus` | Compact pill in the page header | The full-width green "محفوظ" bar |
| `Eyebrow`, `SectionTitle` | Landing heading pair | Per-section bespoke headings |

**Rule: one primary button per view.** Everything else is `secondary` or
`ghost`. The lesson editor's toolbar (six equal buttons today) is the first
place this rule applies.

---

## 9. Guardrails

These are what keep later changes cheap.

1. **`npm run lint:design`** is a grep-based script in `scripts/`, so it adds
   no dependency. It counts violations per area: hex in JSX, raw palette
   classes, `text-[Npx]`, `style={{` colours, `toLocaleString`,
   `tracking-*` on a line with Arabic, `font-mono` on a line with Arabic.
   - It starts in **report mode** with today's counts as the baseline in
     `scripts/design-baseline.json`.
   - The check fails only if a count *rises*.
   - Each migration lowers the baseline.
2. **`/dev/design`** is a dev-only route, gated like `/api/dev/autologin`. It
   renders every token and component in both themes. It's the visual
   reference and the review surface for any token change. It's never built
   for production, so it costs nothing on the free tier.
3. This document is the source of truth. A token that isn't listed here
   doesn't exist.

---

## 10. Migration plan

Each phase is reviewed before the next one starts, the same way the editor
overhaul ran.

| Phase | Scope | Visible change |
|---|---|---|
| **DS0: Foundation** | Role tokens and their Tailwind names. Legacy aliases. Global mono and tracking fix. `text-2xs` and `text-xs` lift. `format.js` plus replacing the 4 number formats. Drop Playfair. `lint:design` with a baseline | Arabic eyebrows join up again. Small text gets one step larger. Digits are consistent. Landing background a shade darker |
| **DS1: Components** | The `ui/` set in §8, plus the `/dev/design` page | None until components are adopted |
| **DS2: Editor** | Lesson editor first (one header bar, one primary action, `SaveStatus`, labelled section controls, `Confirm`), then the dashboard, lessons list, feeds, quiz bank, concepts and media. Raw palette and inline colours driven to 0 | The UX fixes from the review land here |
| **DS3: Contributor flow** | Join, prejoin, interview, onboard, signin, and the public profile move off inline styles onto components | Consistent forms and buttons |
| **DS4: Landing** | Visible-by-default motion, `Eyebrow` / `SectionTitle`, section widths and rhythm, one set of subject numbers | Content readable without JS, shorter page |
| **DS5: Admin** | Retire `.admin-shell` overrides and the old `ui/` copies | Minimal |

The demo is out of scope. It mirrors the Basheer app inside `.bsh` by design.

### DS2 plan (agreed 2026-10-16)

Every board on the design canvas's «أفكار المحرر» page is in scope,
including the return-with-comments round trip.

| # | Step | Canvas | State |
|---|---|---|---|
| 1 | One header bar for the lesson editor, plus the التنويعات tab | LessonEditor | ✓ `5eaeac8` |
| — | Activity graph (Sudan days, per-type breakdown, fresh stats) | Dashboard | ✓ `f6357de` |
| — | Review backend: anchored comments, rounds, resubmit gate | Readiness | ✓ `85d6807` |
| 2 | **Readiness and review panel.** Side panel at xl and above, bottom drawer below. The six checks link to where each is fixed. A warning popover when sending before 6/6. The "sent" and "returned" states, with each comment linking to its anchor and a resolve button, and the 409 from the gate shown clearly | EdReadiness | ✓ `494485f` |
| 3 | **Reviewer side** in the admin review queue: open the lesson read-only, add comments anchored to the lesson, its details, a section, a block, a question or a feed card, then return or approve | EdReadiness | next |
| 4 | **Content tab.** Labelled section header (فهم / حفظ, role). One grouped add menu, opened from "+ إضافة" or `/`. Block states: a hover toolbar, an unsaved edge, and the restyled conflict compare. Optional live phone preview beside the editor, reusing the preview renderer. Lesson outline | EdContentTab, EdBlockMenu | |
| 5 | **البيانات tab tidy-up.** `Field` and `Card`, a subject-based example for the group ID, and wiring «وسم الإصدار» to the save (it is never sent today) | — | |
| 6 | **Lessons list.** Search and status filters. A «تابع من حيث توقفت» strip (recently opened lessons, remembered in the browser, so no request). Full-width rows with readiness marks, details in words, a returned badge, and a flag on auto-titled lessons | EdLessonsList | |
| 7 | **Phone pass.** Bottom bar with the readiness count and "+ إضافة عنصر", full-width selectors, 44px controls | EdPhone | |
| 8 | **Dashboard.** A «خطوتك التالية» card and per-unit progress, around the new graph | Dashboard | |

Each step gets its own commit and a review. No step adds a request,
except the reviewer's return in step 3, which is one write.

### DS5 plan: admin redesign (design agreed 2026-10-17)

DS5 grows from "retire the overrides" into a redesign. The admin page of the
design canvas has four boards, drawn with real data. The sidebar is out of
scope for now. The 14 sections fold into four screens:

| # | Step | Canvas | Replaces | State |
|---|---|---|---|---|
| 0 | **Honest activity numbers.** Contributor counters (`stats.*`) disagree with the content collections: Geography counts 7 blocks with none saved, and one contributor counts 6 lessons and 22 questions that do not exist. Count from the content itself, or reconcile, before any screen shows them | — | — | next |
| 1 | **Subject page.** One page per subject: the unit/lesson tree with inline unit titles, coverage columns in words (sections, blocks, questions, feed cards), filters, and one publish action with delta/major/full as plain-language advanced options. Per-subject settings: visibility (`visibleSubjectIds`) and equation notation. Maintenance: complete missing units from the curriculum, restore from the last published copy. Lessons open in the real editor on their own route | AdSubject | Admin editor, Curriculum, Coverage map, Seed | |
| 2 | **Overview.** "Waiting for your decision" (review, join requests, subjects with nobody, unseeded subjects), content per subject, the last 7 Sudan days, contributors, site and mail counts | AdOverview | Overview | |
| 3 | **Contributors.** The six-stage joining pipeline, a list per stage, and a person page with facts, what they did, and actions. Roles and teams become attributes on this screen | AdPeople2 | Peoples, Roles, Teams | |
| 4 | **Comms.** One composer: audience (contributors or students), scope, channels (contributor board, email via Resend, in-app centre, top banner), reach, and one history across channels. One app-settings panel for every manifest flag | AdComms | Comms, the flags half of Publish | |

The reviewer side stays in DS2 step 3 (AdReview board).
`TeamsSection`, `RolesSection` and `ContributorsSection` were unused and are
deleted. Firebase env vars are empty in `.env.local`, so the app-side data
(manifest flags, `comm_items`) cannot be read locally until they are set.

### Status

- **DS0 landed on 2026-10-15.**
  - Role tokens and aliases.
  - Global mono and tracking fix. 26 inline `'monospace'` literals now point
    at `var(--font-mono)`.
  - Type lift.
  - `format.js` replaced 34 call sites, and 101 hand-typed Arabic-Indic digits
    in copy were converted.
  - Playfair removed.
  - `lint:design` baseline recorded.
  - The `--cat-*` category set moved to DS2, alongside `AddBlockMenu`.
- **DS0.1 landed on 2026-10-15** (the foundation upgrades):
  - Warm status set, checked in OKLab.
  - Light-mode button hover now goes darker.
  - `fg-faint` merged into `fg-subtle`, with `ink-600` set equal to `ink-500`.
  - Dark card lifted to `#201c16`.
  - IBM Plex Sans Arabic added as `font-ui`.
  - The type scale moved to rem, with a fluid `--fs-body`.
  - Named z-layers.
  - The before/after comparison is on the design canvas, on the Upgrades
    board.
  - Plex shows up through the `t-*` roles and the DS1 components. Existing
    `font-arabic` call sites switch over when their surface migrates.
- **DS1 landed on 2026-10-15** (the components):
  - `src/components/ui/` holds `Button`, `IconButton`, `Field` (with
    `Input`, `Textarea` and `Select`), `Card`, `Badge`, `Stat`, `Tabs` and
    `TabPanel`, `Segmented`, `PageHeader`, `SaveStatus`, `EmptyState`,
    `Dialog`, `Drawer`, `ConfirmButton`, `Eyebrow` and `SectionTitle`, all
    exported from `@/components/ui`.
  - `Drawer` moved there; the old `editor/shared/Drawer` path re-exports it.
  - `arCount` and `changesLabel` moved into `format.js`.
  - New `--scrim` token for the backdrop behind dialogs and drawers.
  - `lint:design` has a `ui` area held at zero.
  - `/dev/design` shows every token and component in both themes. It returns
    404 in production.
  - No call sites have been migrated yet; that is DS2.
- **Known leftover:** text in a `font-mono` run that mixes Arabic and Latin
  still uses JetBrains Mono's wide space between words, as in the hero badge.
  It goes away when those labels move to `t-eyebrow` in DS3 and DS4.
