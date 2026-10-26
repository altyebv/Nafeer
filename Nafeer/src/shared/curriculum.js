/**
 * NAFEER SUBJECT LIST
 * ─────────────────────────────────────────────────────────────────────────────
 * The subjects that exist, with their names, tracks and display settings. It
 * is read synchronously all over the app (join form, landing, labels), so it
 * stays in code; a new subject is a deploy.
 *
 * A subject's units and lessons are NOT here. They live in the database: the
 * owner opens a subject from the admin dashboard and adds its units from the
 * textbook, each with its lesson target (docs/subject-lifecycle.md). This file
 * used to carry a unit/lesson template that seeded every subject.
 *
 * Rules:
 *  • IDs are IMMUTABLE — never rename them. The Android app, Atlas documents,
 *    and editor exports all key off these strings.
 *
 * Track membership:
 *  COMMON   → every student takes this
 *  SCIENCE  → علمي track
 *  LITERARY → أدبي track
 *  isMajor: true → student picks ONE within their track's majors
 */

// ─── Track Keys ──────────────────────────────────────────────────────────────
export const TRACKS = {
  COMMON:   'COMMON',
  SCIENCE:  'SCIENCE',
  LITERARY: 'LITERARY',
};

export const TRACK_CONFIG = {
  // Theme-aware status colours, not raw Tailwind blue/purple — those are
  // dark-only, so on the light theme these badges rendered bright-on-cream
  // (the literary badge measured 1.11:1 against a 4.5:1 requirement).
  COMMON:   { label: 'مشترك', color: 'text-sand-400', badge: 'bg-warn-surface border-warn-border text-warn'          },
  SCIENCE:  { label: 'علمي',  color: 'text-info',     badge: 'bg-info-surface border-info-border text-info'          },
  LITERARY: { label: 'أدبي',  color: 'text-special',  badge: 'bg-special-surface border-special-border text-special' },
};

// ─── Math Notation ───────────────────────────────────────────────────────────
// How a subject's formulas are typeset. Contributors write the same LaTeX
// either way; the preview here and the Android app apply the notation.
// Exported to the app as subject.mathNotation.
export const MATH_NOTATION = {
  LATIN:  'LATIN',    // left-to-right, Latin symbols — the default
  ARABIC: 'ARABIC',   // right-to-left, Arabic letters, digits and function names
};

// ─── Subject Catalog ─────────────────────────────────────────────────────────
/**
 * A subject may set `mathNotation` (see MATH_NOTATION); absent means LATIN.
 */
export const SUBJECTS_CATALOG = [

  // ── COMMON (4) ─────────────────────────────────────────────────────────────
  {
    id:      'QURAN',
    nameAr:  'قرآن كريم',
    nameEn:  'Quran',
    track:   TRACKS.COMMON,
    isMajor: false,
    color:   'emerald',
    order:   1,
  },

  {
    id:      'ARABIC',
    nameAr:  'لغة عربية',
    nameEn:  'Arabic Language',
    track:   TRACKS.COMMON,
    isMajor: false,
    color:   'ember',
    order:   2,
  },

  {
    id:      'ENGLISH',
    nameAr:  'لغة إنجليزية',
    nameEn:  'English Language',
    track:   TRACKS.COMMON,
    isMajor: false,
    color:   'blue',
    order:   3,
  },

  {
    id:      'MATH',
    nameAr:  'رياضيات',
    nameEn:  'Mathematics',
    track:   TRACKS.LITERARY,
    isMajor: false,
    color:   'sand',
    order:   4,
    mathNotation: MATH_NOTATION.ARABIC,
  },

  // ── رياضيات متخصصة — Science track only ────────────────────────────────────
  // Science students study both MATH (common/literary) and MATH_SCIENCE.
  // Kept as a separate subject so quiz bank, feed, and progress are isolated.
  {
    id:      'MATH_SCIENCE',
    nameAr:  'رياضيات متخصصة',
    nameEn:  'Advanced Mathematics',
    track:   TRACKS.SCIENCE,
    isMajor: false,
    color:   'sand',
    order:   5,
    mathNotation: MATH_NOTATION.ARABIC,
  },

  // ── SCIENCE TRACK — required ────────────────────────────────────────────────
  {
    id:      'PHYSICS',
    nameAr:  'فيزياء',
    nameEn:  'Physics',
    track:   TRACKS.SCIENCE,
    isMajor: false,
    color:   'cyan',
    order:   6,
  },

  {
    id:      'CHEMISTRY',
    nameAr:  'كيمياء',
    nameEn:  'Chemistry',
    track:   TRACKS.SCIENCE,
    isMajor: false,
    color:   'purple',
    order:   7,
  },

  // ── SCIENCE TRACK — majors ──────────────────────────────────────────────────
  {
    id:      'BIOLOGY',
    nameAr:  'أحياء',
    nameEn:  'Biology',
    track:   TRACKS.SCIENCE,
    isMajor: true,
    color:   'green',
    order:   8,
  },

  {
    id:      'ENGINEERING_SCI',
    nameAr:  'علوم هندسة',
    nameEn:  'Engineering Sciences',
    track:   TRACKS.SCIENCE,
    isMajor: true,
    color:   'orange',
    order:   9,
  },

  {
    id:      'CS',
    nameAr:  'علوم حاسوب',
    nameEn:  'Computer Science',
    track:   TRACKS.SCIENCE,
    isMajor: true,
    color:   'indigo',
    order:   10,
  },

  // ── LITERARY TRACK — required ───────────────────────────────────────────────
  {
    id:      'HISTORY',
    nameAr:  'تاريخ',
    nameEn:  'History',
    track:   TRACKS.LITERARY,
    isMajor: false,
    color:   'yellow',
    order:   11,
  },

  {
    id:      'GEOGRAPHY',
    nameAr:  'جغرافيا',
    nameEn:  'Geography',
    track:   TRACKS.LITERARY,
    isMajor: false,
    color:   'teal',
    order:   12,
  },

  // ── LITERARY TRACK — majors ─────────────────────────────────────────────────
  {
    id:      'ISLAMIC_STUDIES',
    nameAr:  'دراسات إسلامية',
    nameEn:  'Islamic Studies',
    track:   TRACKS.LITERARY,
    isMajor: true,
    color:   'amber',
    order:   13,
  },

  {
    id:      'MILITARY_SCI',
    nameAr:  'علوم عسكرية',
    nameEn:  'Military Sciences',
    track:   TRACKS.LITERARY,
    isMajor: true,
    color:   'slate',
    order:   14,
  },
];

// ─── Lookup Helpers ───────────────────────────────────────────────────────────

/** Quick map: subjectId → subject object */
export const SUBJECTS_BY_ID = Object.fromEntries(
  SUBJECTS_CATALOG.map((s) => [s.id, s])
);

/**
 * The notation a subject's formulas are typeset in.
 * Accepts a subject id, or a subject object ({ id | subjectId, mathNotation }):
 * a notation stored on the subject wins, then the catalog, then LATIN.
 */
export const getMathNotation = (subject) => {
  const id     = typeof subject === 'string' ? subject : (subject?.subjectId ?? subject?.id);
  const stored = subject && typeof subject === 'object' ? subject.mathNotation : null;
  const value  = stored || SUBJECTS_BY_ID[id]?.mathNotation;
  return value === MATH_NOTATION.ARABIC ? MATH_NOTATION.ARABIC : MATH_NOTATION.LATIN;
};

/** All valid subject IDs — use for Mongoose enum validation */
export const SUBJECT_IDS = SUBJECTS_CATALOG.map((s) => s.id);
