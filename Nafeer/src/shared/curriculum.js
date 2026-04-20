/**
 * NAFEER CURRICULUM CATALOG
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for all subjects, their tracks, and their full
 * unit/lesson template structure.
 *
 * Rules:
 *  • IDs are IMMUTABLE — never rename them. The Android app, Atlas documents,
 *    and editor exports all key off these strings.
 *  • `order` on each unit MUST be globally unique within the subject — it is
 *    used as the stable suffix of the unit's contentId (e.g. MATH_SCIENCE_U6).
 *    Never reuse an order number within the same subject.
 *  • `bookOrder` is the display-only position of the unit within its book.
 *    It resets to 1 for each book and is never used in ID generation.
 *  • lessonCount per unit is the *target* — contributors fill them in order.
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
  COMMON:   { label: 'مشترك', color: 'text-sand-400',   badge: 'bg-sand-900/40 border-sand-700/40 text-sand-400'      },
  SCIENCE:  { label: 'علمي',  color: 'text-blue-400',   badge: 'bg-blue-900/40 border-blue-700/40 text-blue-400'      },
  LITERARY: { label: 'أدبي',  color: 'text-purple-400', badge: 'bg-purple-900/40 border-purple-700/40 text-purple-400' },
};

// ─── Subject Catalog ─────────────────────────────────────────────────────────
/**
 * Each unit entry:
 * {
 *   order      : number  — GLOBALLY UNIQUE within subject. Used in contentId. NEVER change.
 *   bookOrder  : number? — Display position within this book (resets per book). Optional.
 *   titleAr    : string
 *   lessonCount: number
 *   bookId     : string? — Groups units under a named book divider (Android + admin UI)
 *   bookTitle  : string? — Human-readable book name shown in the divider
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
      { order: 1, titleAr: 'التجويد',                          lessonCount: 3  },
      { order: 2, titleAr: 'سورة النور',                        lessonCount: 17 },
      { order: 3, titleAr: 'آيات مختارة',                       lessonCount: 3  },
      { order: 4, titleAr: 'أحكام فقهية عامة',                  lessonCount: 5  },
      { order: 5, titleAr: 'الأمة الإسلامية و خصائصها',          lessonCount: 6  },
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
      // ── كتاب المطالعة و الأدب ──────────────────────────────────────────
      { order: 1, bookOrder: 1, titleAr: 'الوحدة الأولى',  lessonCount: 5, bookId: 'ARABIC_BOOK_MATALAA', bookTitle: 'المطالعة و الأدب' },
      { order: 2, bookOrder: 2, titleAr: 'الوحدة الثانية', lessonCount: 5, bookId: 'ARABIC_BOOK_MATALAA', bookTitle: 'المطالعة و الأدب' },
      { order: 3, bookOrder: 3, titleAr: 'الوحدة الثالثة', lessonCount: 5, bookId: 'ARABIC_BOOK_MATALAA', bookTitle: 'المطالعة و الأدب' },
      // ── كتاب قواعد النحو ───────────────────────────────────────────────
      { order: 4, bookOrder: 1, titleAr: 'الوحدة الأولى',  lessonCount: 5, bookId: 'ARABIC_BOOK_NAHW',    bookTitle: 'قواعد النحو' },
      { order: 5, bookOrder: 2, titleAr: 'الوحدة الثانية', lessonCount: 5, bookId: 'ARABIC_BOOK_NAHW',    bookTitle: 'قواعد النحو' },
      { order: 6, bookOrder: 3, titleAr: 'الوحدة الثالثة', lessonCount: 5, bookId: 'ARABIC_BOOK_NAHW',    bookTitle: 'قواعد النحو' },
      // ── كتاب البلاغة و التعبير ─────────────────────────────────────────
      { order: 7, bookOrder: 1, titleAr: 'الوحدة الأولى',  lessonCount: 5, bookId: 'ARABIC_BOOK_BALAGHA', bookTitle: 'البلاغة و التعبير' },
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
    track:   TRACKS.LITERARY,
    isMajor: false,
    color:   'sand',
    order:   4,
    units: [
      { order: 1, titleAr: 'الدوال الحقيقية و النهايات',           lessonCount: 7 },
      { order: 2, titleAr: 'التفاضل',                              lessonCount: 8 },
      { order: 3, titleAr: 'التكامل كعملية عكسية للتفاضل',         lessonCount: 1 },
      { order: 4, titleAr: 'الإحصاء',                              lessonCount: 6 },
      { order: 5, titleAr: 'الإحتمالات',                           lessonCount: 8 },
      { order: 6, titleAr: 'المصفوفات',                            lessonCount: 9 },
    ],
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
    units: [
      // ── الكتاب الأول ────────────────────────────────────────────────────────
      // order values 1–5 reserved for book one (globally unique within subject)
      { order: 1, bookOrder: 1, titleAr: 'الاستنتاج الرياضي، التباديل و التوافيق و نظرية ذات الحدين', lessonCount: 6,  bookId: 'MATH_SCI_BOOK_1', bookTitle: 'الكتاب الأول' },
      { order: 2, bookOrder: 2, titleAr: 'المصفوفات',                                                 lessonCount: 11, bookId: 'MATH_SCI_BOOK_1', bookTitle: 'الكتاب الأول' },
      { order: 3, bookOrder: 3, titleAr: 'الكسور الجزئية',                                            lessonCount: 4,  bookId: 'MATH_SCI_BOOK_1', bookTitle: 'الكتاب الأول' },
      { order: 4, bookOrder: 4, titleAr: 'الإحتمالات',                                               lessonCount: 9,  bookId: 'MATH_SCI_BOOK_1', bookTitle: 'الكتاب الأول' },
      { order: 5, bookOrder: 5, titleAr: 'الإحصاء',                                                  lessonCount: 6,  bookId: 'MATH_SCI_BOOK_1', bookTitle: 'الكتاب الأول' },
      // ── الكتاب الثاني ───────────────────────────────────────────────────────
      // order values 6–12 reserved for book two (continue from 6, never reuse)
      { order: 6,  bookOrder: 1, titleAr: 'الدوال الحقيقية و النهايات',       lessonCount: 8, bookId: 'MATH_SCI_BOOK_2', bookTitle: 'الكتاب الثاني' },
      { order: 7,  bookOrder: 2, titleAr: 'التفاضل',                          lessonCount: 7, bookId: 'MATH_SCI_BOOK_2', bookTitle: 'الكتاب الثاني' },
      { order: 8,  bookOrder: 3, titleAr: 'تطبيقات على التفاضل',              lessonCount: 4, bookId: 'MATH_SCI_BOOK_2', bookTitle: 'الكتاب الثاني' },
      { order: 9,  bookOrder: 4, titleAr: 'التكامل',                          lessonCount: 2, bookId: 'MATH_SCI_BOOK_2', bookTitle: 'الكتاب الثاني' },
      { order: 10, bookOrder: 5, titleAr: 'التكامل المحدد و تطبيقاته',        lessonCount: 4, bookId: 'MATH_SCI_BOOK_2', bookTitle: 'الكتاب الثاني' },
      { order: 11, bookOrder: 6, titleAr: 'الدائرة',                          lessonCount: 5, bookId: 'MATH_SCI_BOOK_2', bookTitle: 'الكتاب الثاني' },
      { order: 12, bookOrder: 7, titleAr: 'مجموعة الأعداد المركبة',           lessonCount: 7, bookId: 'MATH_SCI_BOOK_2', bookTitle: 'الكتاب الثاني' },
    ],
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
    order:   7,
    units: [
      { order: 1, titleAr: 'الوحدة الأولى',   lessonCount: 4 },
      { order: 2, titleAr: 'الوحدة الثانية',  lessonCount: 4 },
      { order: 3, titleAr: 'الوحدة الثالثة',  lessonCount: 4 },
      { order: 4, titleAr: 'الوحدة الرابعة',  lessonCount: 4 },
      { order: 5, titleAr: 'الوحدة الخامسة',  lessonCount: 4 },
      { order: 6, titleAr: 'الوحدة السادسة',  lessonCount: 4 },
    ],
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
    order:   9,
    units: [
      { order: 1, titleAr: 'أساسيات الرسم الهندسي',           lessonCount: 13 },
      { order: 2, titleAr: 'أساسيات الهندسة الميكانيكية',     lessonCount: 24 },
      { order: 3, titleAr: 'أساسيات الهندسة الكهربائية',      lessonCount: 25 },
      { order: 4, titleAr: 'أساسيات الهندسة المدنية',         lessonCount: 13 },
    ],
  },

  {
    id:      'CS',
    nameAr:  'علوم حاسوب',
    nameEn:  'Computer Science',
    track:   TRACKS.SCIENCE,
    isMajor: true,
    color:   'indigo',
    order:   10,
    units: [
      { order: 1, titleAr: 'الدوائر المنطقية و العد الثنائي',                    lessonCount: 9  },
      { order: 2, titleAr: 'بنيات البيانات',                                    lessonCount: 13 },
      { order: 3, titleAr: 'الخوارزميات البيانية',                               lessonCount: 6  },
      { order: 4, titleAr: 'نظم التشغيل',                                       lessonCount: 13 },
      { order: 5, titleAr: 'تحليل و تصميم النظم الآلية للمعلومات',               lessonCount: 8  },
    ],
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
    units: [
      { order: 1, titleAr: 'الثورة و الدولة المهدية',                                                    lessonCount: 12 },
      { order: 2, titleAr: 'الحكم الثنائي و الحركة الوطنية',                                             lessonCount: 10 },
      { order: 3, titleAr: 'دولة الخلافة العثمانية و الأطماع الاستعمارية في العالم العربي',               lessonCount: 7  },
      { order: 4, titleAr: 'حركات التحرر العربية',                                                       lessonCount: 12 },
    ],
  },

  {
    id:      'GEOGRAPHY',
    nameAr:  'جغرافيا',
    nameEn:  'Geography',
    track:   TRACKS.LITERARY,
    isMajor: false,
    color:   'teal',
    order:   12,
    units: [
      { order: 1, titleAr: 'مقدمة في قراءة و تفسير الصور الجوية', lessonCount: 4  },
      { order: 2, titleAr: 'الجغرافيا الاقتصادية',                lessonCount: 28 },
      { order: 3, titleAr: 'الوحدة الثالثة',                      lessonCount: 4  },
      { order: 4, titleAr: 'الإنسان و البيئة مشكلات عالمية',       lessonCount: 22 },
    ],
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
    units: [
      { order: 1, titleAr: 'القرآن الكريم و علومه', lessonCount: 11 },
      { order: 2, titleAr: 'النظام الاقتصادي',      lessonCount: 6  },
      { order: 3, titleAr: 'من أصول الفقه',          lessonCount: 4  },
      { order: 4, titleAr: 'علوم السنة',             lessonCount: 6  },
    ],
  },

  {
    id:      'MILITARY_SCI',
    nameAr:  'علوم عسكرية',
    nameEn:  'Military Sciences',
    track:   TRACKS.LITERARY,
    isMajor: true,
    color:   'slate',
    order:   14,
    units: [
      { order: 1,  titleAr: 'الاستراتيجية القومية',             lessonCount: 1 },
      { order: 2,  titleAr: 'الاستراتيجية العسكرية',            lessonCount: 1 },
      { order: 3,  titleAr: 'العقيدة العسكرية',                 lessonCount: 1 },
      { order: 4,  titleAr: 'فن الحرب',                        lessonCount: 1 },
      { order: 5,  titleAr: 'طبيعة الحروب المعاصرة',            lessonCount: 1 },
      { order: 6,  titleAr: 'حرب النجوم',                      lessonCount: 1 },
      { order: 7,  titleAr: 'التربية و التدريب العسكري',         lessonCount: 1 },
      { order: 8,  titleAr: 'صفات القائد',                      lessonCount: 1 },
      { order: 9,  titleAr: 'توجيهات الإسلام في القيادة',       lessonCount: 1 },
      { order: 10, titleAr: 'نماذج من القادة',                  lessonCount: 1 },
      { order: 11, titleAr: 'إعداد الدولة للحرب',               lessonCount: 1 },
      { order: 12, titleAr: 'إعداد القوات المسلحة للحرب',       lessonCount: 1 },
      { order: 13, titleAr: 'نماذج من المعارك التاريخية',       lessonCount: 1 },
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
 * Validate that all unit `order` values are unique within each subject.
 * Call this in tests or on startup — a collision silently loses units in the DB.
 */
export function validateCurriculum() {
  const errors = [];
  for (const subject of SUBJECTS_CATALOG) {
    const seen = new Set();
    for (const unit of subject.units) {
      const id = `${subject.id}_U${unit.order}`;
      if (seen.has(id)) {
        errors.push(`DUPLICATE unit contentId: "${id}" in subject "${subject.id}" — fix the order field`);
      }
      seen.add(id);
    }
  }
  if (errors.length) {
    errors.forEach((e) => console.error('[curriculum] ❌', e));
    throw new Error(`Curriculum validation failed with ${errors.length} error(s). See above.`);
  }
  return true;
}

/**
 * Generate the scaffold that gets pre-loaded into the editor when a
 * contributor first opens their subject. Every unit and lesson has a
 * deterministic ID:
 *   unit:   `<subjectId>_U<unit.order>`        e.g. MATH_SCIENCE_U6
 *   lesson: `<subjectId>_U<unit.order>_L<n>`   e.g. MATH_SCIENCE_U6_L3
 *
 * These IDs are stable — the Android app and Atlas can reference them
 * without collisions across contributors.
 *
 * `bookOrder` is carried through to the unit scaffold for UI display
 * (per-book unit numbering), but is never used in the ID itself.
 */
export const buildSubjectScaffold = (subjectId) => {
  const subject = SUBJECTS_BY_ID[subjectId];
  if (!subject) return null;

  // Validate before building so errors surface immediately
  const unitOrders = subject.units.map((u) => u.order);
  const dupes = unitOrders.filter((o, i) => unitOrders.indexOf(o) !== i);
  if (dupes.length) {
    throw new Error(
      `[buildSubjectScaffold] Duplicate unit orders [${dupes.join(', ')}] in subject "${subjectId}". ` +
      `Each unit order must be unique — it forms the unit's contentId.`
    );
  }

  const units   = [];
  const lessons = [];

  subject.units.forEach((unitTemplate) => {
    const unitId = `${subjectId}_U${unitTemplate.order}`;

    units.push({
      id:          unitId,
      title:       unitTemplate.titleAr,
      order:       unitTemplate.order,
      // bookOrder is display-only — resets per book, never used in IDs
      bookOrder:   unitTemplate.bookOrder ?? null,
      description: null,
      bookId:      unitTemplate.bookId    ?? null,
      bookTitle:   unitTemplate.bookTitle ?? null,
    });

    for (let l = 1; l <= unitTemplate.lessonCount; l++) {
      lessons.push({
        id:               `${unitId}_L${l}`,
        unitId,
        title:            `الدرس ${l}`,
        order:            l,
        estimatedMinutes: 15,
        summary:          null,
        groupId:          null,
        groupTitle:       null,
        groupMetadata:    null,
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