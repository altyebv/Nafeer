/**
 * NAFEER CURRICULUM CATALOG
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for all subjects, their tracks, and their full
 * unit/lesson template structure.
 *
 * Rules:
 *  • IDs are IMMUTABLE — never rename them. The Android app, Atlas documents,
 *    and editor exports all key off these strings.
 *  • Unit/lesson counts here define the template. When a contributor is assigned
 *    a subject, the system scaffolds exactly this many units and lessons (all
 *    empty, progress = 0) so progress tracking is deterministic.
 *  • lessonCount per unit is the *target* — contributors fill them in order.
 *
 * Track membership:
 *  COMMON   → every student takes this (4 subjects)
 *  SCIENCE  → علمي track, required  (فيزياء + كيمياء)
 *  LITERARY → أدبي track, required  (تاريخ + جغرافيا)
 *  isMajor: true → student picks ONE within their track
 *    Science majors  : BIOLOGY | ENGINEERING_SCI | CS
 *    Literary majors : ISLAMIC_STUDIES | MILITARY_SCI
 */

// ─── Track Keys ──────────────────────────────────────────────────────────────
export const TRACKS = {
  COMMON:   'COMMON',
  SCIENCE:  'SCIENCE',
  LITERARY: 'LITERARY',
};

export const TRACK_CONFIG = {
  COMMON:   { label: 'مشترك', color: 'text-sand-400',   badge: 'bg-sand-900/40 border-sand-700/40 text-sand-400'     },
  SCIENCE:  { label: 'علمي',  color: 'text-blue-400',   badge: 'bg-blue-900/40 border-blue-700/40 text-blue-400'     },
  LITERARY: { label: 'أدبي',  color: 'text-purple-400', badge: 'bg-purple-900/40 border-purple-700/40 text-purple-400' },
};

// ─── Subject Catalog ─────────────────────────────────────────────────────────
/**
 * Each entry:
 * {
 *   id          : string  — deterministic key, used everywhere
 *   nameAr      : string  — display name (Arabic)
 *   nameEn      : string  — display name (English) — for export/API
 *   track       : TRACKS  — which student population takes this
 *   isMajor     : bool    — student picks one-of within their track's majors
 *   color       : string  — Tailwind color name (must exist in colorMap)
 *   order       : number  — display order within the board
 *   units       : Unit[]  — ordered unit templates
 * }
 *
 * Unit:
 * {
 *   order       : number
 *   titleAr     : string
 *   lessonCount : number  — target number of lessons in this unit
 * }
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
    units: [
      { order: 1, titleAr: 'التجويد',   lessonCount: 3 },
      { order: 2, titleAr: 'سورة النور',  lessonCount: 17 },
      { order: 3, titleAr: 'ايات مختارة',  lessonCount: 3 },
      { order: 4, titleAr: 'أحكام فقهية عامة',  lessonCount: 5 },
      { order: 5, titleAr: 'الأمة الإسلامية و خصائصها',  lessonCount: 6 },
    ],
  },
  {
    id:      'ARABIC',
    nameAr:  'لغة عربية',
    nameEn:  'Arabic Language',
    track:   TRACKS.COMMON,
    isMajor: false,
    color:   'ember',
    order:   2,
    units: [
      { order: 1, titleAr: 'الوحدة الأولى',   lessonCount: 5 },
      { order: 2, titleAr: 'الوحدة الثانية',  lessonCount: 5 },
      { order: 3, titleAr: 'الوحدة الثالثة',  lessonCount: 5 },
      { order: 4, titleAr: 'الوحدة الرابعة',  lessonCount: 5 },
      { order: 5, titleAr: 'الوحدة الخامسة',  lessonCount: 5 },
      { order: 6, titleAr: 'الوحدة السادسة',  lessonCount: 5 },
      { order: 7, titleAr: 'الوحدة السابعة',  lessonCount: 5 },
    ],
  },
  {
    id:      'ENGLISH',
    nameAr:  'لغة إنجليزية',
    nameEn:  'English Language',
    track:   TRACKS.COMMON,
    isMajor: false,
    color:   'blue',
    order:   3,
    units: [
      { order: 1, titleAr: 'الوحدة الأولى',   lessonCount: 5 },
      { order: 2, titleAr: 'الوحدة الثانية',  lessonCount: 5 },
      { order: 3, titleAr: 'الوحدة الثالثة',  lessonCount: 5 },
      { order: 4, titleAr: 'الوحدة الرابعة',  lessonCount: 5 },
      { order: 5, titleAr: 'الوحدة الخامسة',  lessonCount: 5 },
      { order: 6, titleAr: 'الوحدة السادسة',  lessonCount: 5 },
      { order: 7, titleAr: 'الوحدة السابعة',  lessonCount: 5 },
      { order: 8, titleAr: 'الوحدة الثامنة',  lessonCount: 5 },
    ],
  },
  {
    id:      'MATH',
    nameAr:  'رياضيات',
    nameEn:  'Mathematics',
    track:   TRACKS.COMMON,
    isMajor: false,
    color:   'sand',
    order:   4,
    units: [
      { order: 1, titleAr: 'الوحدة الأولى',   lessonCount: 5 },
      { order: 2, titleAr: 'الوحدة الثانية',  lessonCount: 5 },
      { order: 3, titleAr: 'الوحدة الثالثة',  lessonCount: 5 },
      { order: 4, titleAr: 'الوحدة الرابعة',  lessonCount: 5 },
      { order: 5, titleAr: 'الوحدة الخامسة',  lessonCount: 5 },
      { order: 6, titleAr: 'الوحدة السادسة',  lessonCount: 5 },
      { order: 7, titleAr: 'الوحدة السابعة',  lessonCount: 5 },
      { order: 8, titleAr: 'الوحدة الثامنة',  lessonCount: 5 },
    ],
  },

  // ── SCIENCE TRACK — required (2) ───────────────────────────────────────────
  {
    id:      'PHYSICS',
    nameAr:  'فيزياء',
    nameEn:  'Physics',
    track:   TRACKS.SCIENCE,
    isMajor: false,
    color:   'cyan',
    order:   5,
    units: [
      { order: 1, titleAr: 'الوحدة الأولى',   lessonCount: 4 },
      { order: 2, titleAr: 'الوحدة الثانية',  lessonCount: 4 },
      { order: 3, titleAr: 'الوحدة الثالثة',  lessonCount: 4 },
      { order: 4, titleAr: 'الوحدة الرابعة',  lessonCount: 4 },
      { order: 5, titleAr: 'الوحدة الخامسة',  lessonCount: 4 },
      { order: 6, titleAr: 'الوحدة السادسة',  lessonCount: 4 },
    ],
  },
  {
    id:      'CHEMISTRY',
    nameAr:  'كيمياء',
    nameEn:  'Chemistry',
    track:   TRACKS.SCIENCE,
    isMajor: false,
    color:   'purple',
    order:   6,
    units: [
      { order: 1, titleAr: 'الوحدة الأولى',   lessonCount: 4 },
      { order: 2, titleAr: 'الوحدة الثانية',  lessonCount: 4 },
      { order: 3, titleAr: 'الوحدة الثالثة',  lessonCount: 4 },
      { order: 4, titleAr: 'الوحدة الرابعة',  lessonCount: 4 },
      { order: 5, titleAr: 'الوحدة الخامسة',  lessonCount: 4 },
      { order: 6, titleAr: 'الوحدة السادسة',  lessonCount: 4 },
    ],
  },

  // ── SCIENCE TRACK — majors, pick one (3) ───────────────────────────────────
  {
    id:      'BIOLOGY',
    nameAr:  'أحياء',
    nameEn:  'Biology',
    track:   TRACKS.SCIENCE,
    isMajor: true,
    color:   'green',
    order:   7,
    units: [
      { order: 1, titleAr: 'الوحدة الأولى',   lessonCount: 5 },
      { order: 2, titleAr: 'الوحدة الثانية',  lessonCount: 5 },
      { order: 3, titleAr: 'الوحدة الثالثة',  lessonCount: 5 },
      { order: 4, titleAr: 'الوحدة الرابعة',  lessonCount: 5 },
      { order: 5, titleAr: 'الوحدة الخامسة',  lessonCount: 5 },
      { order: 6, titleAr: 'الوحدة السادسة',  lessonCount: 5 },
      { order: 7, titleAr: 'الوحدة السابعة',  lessonCount: 5 },
    ],
  },
  {
    id:      'ENGINEERING_SCI',
    nameAr:  'علوم هندسة',
    nameEn:  'Engineering Sciences',
    track:   TRACKS.SCIENCE,
    isMajor: true,
    color:   'orange',
    order:   8,
    units: [
      { order: 1, titleAr: 'أساسيات الرسم الهندسي',   lessonCount: 13 },
      { order: 2, titleAr: 'أساسيات الهندسة الميكانيكية',  lessonCount: 24 },
      { order: 3, titleAr: 'أساسيات الهندسة الكهربائية',  lessonCount: 25 },
      { order: 4, titleAr: 'أساسيات الهندسة المدنية',  lessonCount: 13 },
    ],
  },
  {
    id:      'CS',
    nameAr:  'علوم حاسوب',
    nameEn:  'Computer Science',
    track:   TRACKS.SCIENCE,
    isMajor: true,
    color:   'indigo',
    order:   9,
    units: [
      { order: 1, titleAr: 'الدوائر المنطقية و العد الثنائي',   lessonCount: 9 },
      { order: 2, titleAr: 'بنائيات البيانات',  lessonCount: 13 },
      { order: 3, titleAr: 'الخوارزميات البيانية',  lessonCount: 6 },
      { order: 4, titleAr: 'نظم التشغيل',  lessonCount: 13 },
      { order: 5, titleAr: 'تحليل و تصميم النظم الأليه للمعلومات',  lessonCount: 8 },
    ],
  },

  // ── LITERARY TRACK — required (2) ──────────────────────────────────────────
  {
    id:      'HISTORY',
    nameAr:  'تاريخ',
    nameEn:  'History',
    track:   TRACKS.LITERARY,
    isMajor: false,
    color:   'yellow',
    order:   10,
    units: [
      { order: 1, titleAr: 'الثورة و الدولة المهدية',   lessonCount: 12  },
      { order: 2, titleAr: 'الحكم الثنائي و الحركة الوطنية',  lessonCount: 10 },
      { order: 3, titleAr: 'دولة الخلافة العثمانية و الأطماع الإستعمارية في العالم العربي',  lessonCount: 7 },
      { order: 4, titleAr: 'حركات التحرر العربية',  lessonCount: 12 },
    ],
  },
  {
    id:      'GEOGRAPHY',
    nameAr:  'جغرافيا',
    nameEn:  'Geography',
    track:   TRACKS.LITERARY,
    isMajor: false,
    color:   'teal',
    order:   11,
    units: [
      { order: 1, titleAr: 'مقدمة في قراءة و تفسير الصور الجوية',   lessonCount: 4 },
      { order: 2, titleAr: 'الجغرافيا الإقتصادية',  lessonCount: 28 },
      { order: 3, titleAr: 'الوحدة الثالثة',  lessonCount: 4 },
      { order: 4, titleAr: 'الإنسان و البيئة مشكلات عالمية',  lessonCount: 22 },
    ],
  },

  // ── LITERARY TRACK — majors, pick one (2) ──────────────────────────────────
  {
    id:      'ISLAMIC_STUDIES',
    nameAr:  'دراسات إسلامية',
    nameEn:  'Islamic Studies',
    track:   TRACKS.LITERARY,
    isMajor: true,
    color:   'amber',
    order:   12,
    units: [
      { order: 1, titleAr: 'القأن الكريم و علومه',   lessonCount: 11 },
      { order: 2, titleAr: 'النظام الإقتصادي',  lessonCount: 6 },
      { order: 3, titleAr: 'من أصول الفقه',  lessonCount: 4 },
      { order: 4, titleAr: 'علوم السنة',  lessonCount: 6 },
    ],
  },
  {
    id:      'MILITARY_SCI',
    nameAr:  'علوم عسكرية',
    nameEn:  'Military Sciences',
    track:   TRACKS.LITERARY,
    isMajor: true,
    color:   'slate',
    order:   13,
    units: [
      { order: 1, titleAr: 'الإستراتيحية القومية',   lessonCount: 1 },
      { order: 2, titleAr: 'الإستراتيجية العسكرية',  lessonCount: 1 },
      { order: 3, titleAr: 'العقيدة العسكرية',  lessonCount: 1 },
      { order: 4, titleAr: 'فن الحرب',  lessonCount: 1 },
      { order: 5, titleAr: 'طبيعة الحروب المعاصرة',  lessonCount: 1 },
      { order: 6, titleAr: 'حرب النجوم',  lessonCount: 1 },
      { order: 7, titleAr: 'التربية و التدريب العسكرية',  lessonCount: 1 },
      { order: 8, titleAr: 'صفات القائد',  lessonCount: 1 },
      { order: 9, titleAr: 'توجيهات الإسلام في القيادة',  lessonCount: 1 },
      { order: 10, titleAr: 'نماذج من القادة',  lessonCount: 1 },
      { order: 11, titleAr: 'إعداد الدولة للحرب',  lessonCount: 1 },
      { order: 12, titleAr: 'إعداد القوات المسلحة للحرب',  lessonCount: 1 },
      { order: 13, titleAr: 'نماذج من المعارك التاريخية',  lessonCount: 1 },
    ],
  },
];

// ─── Lookup Helpers ───────────────────────────────────────────────────────────

/** Quick map: subjectId → subject object */
export const SUBJECTS_BY_ID = Object.fromEntries(
  SUBJECTS_CATALOG.map((s) => [s.id, s])
);

/** All valid subject IDs — use for Mongoose enum validation */
export const SUBJECT_IDS = SUBJECTS_CATALOG.map((s) => s.id);

/** Total lesson count for a subject (sum of all units' lessonCounts) */
export const getTotalLessons = (subjectId) => {
  const subject = SUBJECTS_BY_ID[subjectId];
  if (!subject) return 0;
  return subject.units.reduce((acc, u) => acc + u.lessonCount, 0);
};

/**
 * Generate the scaffold that gets pre-loaded into the editor when a
 * contributor first opens their subject. Every unit and lesson has a
 * deterministic ID: `<subjectId>_U<unitOrder>` and `<subjectId>_U<unitOrder>_L<lessonOrder>`
 *
 * These IDs are stable — the Android app and Atlas can reference them
 * without collisions across contributors.
 */
export const buildSubjectScaffold = (subjectId) => {
  const subject = SUBJECTS_BY_ID[subjectId];
  if (!subject) return null;

  const units   = [];
  const lessons = [];

  subject.units.forEach((unitTemplate) => {
    const unitId = `${subjectId}_U${unitTemplate.order}`;
    units.push({
      id:          unitId,
      title:       unitTemplate.titleAr,
      order:       unitTemplate.order,
      description: null,
    });

    for (let l = 1; l <= unitTemplate.lessonCount; l++) {
      lessons.push({
        id:               `${unitId}_L${l}`,
        unitId,
        title:            `الدرس ${l}`,
        order:            l,
        estimatedMinutes: 15,
        summary:          null,
      });
    }
  });

  return {
    subject: {
      id:      subjectId,
      nameAr:  subject.nameAr,
      nameEn:  subject.nameEn,
      path:    subject.track,
      isMajor: subject.isMajor,
      order:   subject.order,
    },
    units,
    lessons,
    sections:  [],
    blocks:    [],
    concepts:  [],
    tags:      [],
    feedItems: [],
    questions: [],
    exams:     [],
  };
};