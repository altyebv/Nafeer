/**
 * BASHEER STRING POOLS
 * ─────────────────────────────────────────────────────────────────────────────
 * The app's remote copy (greetings, encouragement, practice insights), kept in
 * one Firestore document: app_config/string_pools.
 *
 *   { pools: { <pool>: { strings: [ { text, text_male?, text_female?, weight, tags } ] } } }
 *
 * The app reads it on every launch (Basheer: core/data/remote/Stringspool.kt,
 * StringPoolManager.kt). A typo there fails silently — an unknown pool is never
 * read, an unknown tag never matches — so pool names and tags are fixed here,
 * copied from the app, and the editor only offers these.
 *
 * Shared by the admin screen and the publish route: both validate with
 * `validatePools`, the route writes what `serializePools` returns.
 */

export const STRING_POOLS_COLLECTION = 'app_config';
export const STRING_POOLS_DOC        = 'string_pools';

// Tags StringPoolManager.matchesTag understands. An entry with no tags is
// always eligible; with tags, it is eligible when any one of them matches.
export const POOL_TAGS = [
  { id: 'morning',     label: 'صباحاً',        hint: 'من 5 إلى 11' },
  { id: 'afternoon',   label: 'ظهراً',         hint: 'من 12 إلى 17' },
  { id: 'evening',     label: 'مساءً',         hint: 'من 18 إلى 23' },
  { id: 'high_streak', label: 'سلسلة طويلة',   hint: '7 أيام فأكثر' },
  { id: 'at_risk',     label: 'متأخر عن الخطة', hint: 'الإيقاع في خطر' },
];
export const POOL_TAG_IDS = POOL_TAGS.map((t) => t.id);

// StringPoolNames, in the app's order. `fallback` is what the app shows while
// the pool is empty (StringPoolManager.fallback) — one entry, or two when the
// app picks by context.
export const POOL_GROUPS = [
  {
    label: 'التحية',
    pools: [
      { name: 'greetings_morning', label: 'تحية الصباح', fallback: [
        { when: 'سلسلة 7 أيام فأكثر', text: 'صباح الخير! مشعلك مستمر 🔥' },
        { when: 'غير ذلك', text: 'صباح الخير، انطلق اليوم!', text_female: 'صباح الخير، انطلقي اليوم!' },
      ] },
      { name: 'greetings_afternoon', label: 'تحية الظهر', fallback: [{ text: 'مساء الخير، وقت المراجعة' }] },
      { name: 'greetings_evening',   label: 'تحية المساء', fallback: [{ text: 'المساء وقت الدراسة الهادئة' }] },
    ],
  },
  {
    label: 'التشجيع',
    pools: [
      { name: 'encouragement_streak',        label: 'السلسلة',          fallback: [{ text: 'أيام متتالية، عقل متقدم 🔥' }] },
      { name: 'encouragement_goal_complete', label: 'اكتمال الأهداف',    fallback: [{ text: 'أنجزت أهداف اليوم ✓' }] },
      { name: 'encouragement_lesson_done',   label: 'انتهاء درس',        fallback: [{ text: 'درس أقل، أمل أكثر!' }] },
      { name: 'encouragement_rec_complete',  label: 'اكتمال هدف اليوم',  fallback: [{ text: 'هدف اليوم مكتمل ✓' }] },
    ],
  },
  {
    label: 'الدعوة والتنبيه',
    pools: [
      { name: 'cta_idle_prompt', label: 'دعوة للبدء', fallback: [
        { text: 'لم تبدأ بعد؟ دقيقتان تكفيان', text_female: 'لم تبدئي بعد؟ دقيقتان تكفيان' },
      ] },
      { name: 'pace_at_risk_warning', label: 'تنبيه التأخر',   fallback: [{ text: 'الوقت يمضي — درس واحد يحدث فرقًا' }] },
      { name: 'exam_crunch',          label: 'اقتراب الامتحان', fallback: [{ text: 'الامتحان قريب — كل درس يحسب' }] },
    ],
  },
  {
    label: 'قراءات التدريب',
    pools: [
      { name: 'practice_insight_empty_bank', label: 'بنك أسئلة فارغ', fallback: [
        { text: 'لا توجد أسئلة كافية بعد. حدّث المحتوى أو اختر مادة أخرى.', text_female: 'لا توجد أسئلة كافية بعد. حدّثي المحتوى أو اختاري مادة أخرى.' },
      ] },
      { name: 'practice_insight_first_session', label: 'الجلسة الأولى', fallback: [
        { text: 'ابدأ بجلسة قصيرة كي نبني قراءة دقيقة لمستواك.', text_female: 'ابدئي بجلسة قصيرة كي نبني قراءة دقيقة لمستواك.' },
      ] },
      { name: 'practice_insight_focus', label: 'التركيز على الضعف', fallback: [
        { when: 'متأخر عن الخطة', text: 'الأولوية الآن لنقاط الضعف؛ جلسة مركزة ستعطيك أعلى عائد.' },
        { when: 'غير ذلك', text: 'راجع الأسئلة التي تعثّرت فيها قبل أن تتحول إلى عادة.', text_female: 'راجعي الأسئلة التي تعثّرت فيها قبل أن تتحول إلى عادة.' },
      ] },
      { name: 'practice_insight_steady', label: 'تحسّن ثابت', fallback: [{ text: 'مستواك يتحسن. مراجعة قصيرة الآن تثبّت المكاسب.' }] },
      { name: 'practice_insight_strong', label: 'أداء قوي', fallback: [
        { text: 'أداؤك ثابت. نوّع نوع الأسئلة أو ارفع مستوى التحدي.', text_female: 'أداؤك ثابت. نوّعي نوع الأسئلة أو ارفعي مستوى التحدي.' },
      ] },
    ],
  },
];

export const POOLS = POOL_GROUPS.flatMap((g) => g.pools);
export const POOL_NAMES = POOLS.map((p) => p.name);

// Placeholders no call site supplies yet. Today no caller passes any, so every
// placeholder is a warning: the app skips an entry whose form names one it
// was not given. Add a name here once a call site passes it.
export const SUPPLIED_PLACEHOLDERS = [];

const PLACEHOLDER = /\{(\w+)\}/g;

export function placeholdersIn(text) {
  return [...new Set([...(text || '').matchAll(PLACEHOLDER)].map((m) => m[1]))];
}

export function emptyEntry() {
  return { text: '', text_male: '', text_female: '', weight: 1, tags: [] };
}

/**
 * Firestore document → editor state: every known pool present (empty when
 * absent), each entry with all fields filled. Pools the app does not know are
 * returned apart, so publishing can keep them untouched.
 */
export function parsePoolsDoc(doc) {
  const raw = doc?.pools && typeof doc.pools === 'object' ? doc.pools : {};
  const pools = {};
  for (const name of POOL_NAMES) {
    const strings = Array.isArray(raw[name]?.strings) ? raw[name].strings : [];
    pools[name] = strings.map((s) => ({
      text:        typeof s?.text === 'string' ? s.text : '',
      text_male:   typeof s?.text_male === 'string' ? s.text_male : '',
      text_female: typeof s?.text_female === 'string' ? s.text_female : '',
      weight:      typeof s?.weight === 'number' ? s.weight : 1,
      tags:        Array.isArray(s?.tags) ? s.tags.filter((t) => typeof t === 'string') : [],
    }));
  }
  const unknown = Object.fromEntries(Object.entries(raw).filter(([name]) => !POOL_NAMES.includes(name)));
  return { pools, unknown };
}

/**
 * Problems in one entry. `errors` block publishing (the app would drop the
 * entry); `warnings` do not.
 */
export function checkEntry(entry) {
  const errors = [];
  const warnings = [];
  if (!entry.text?.trim()) errors.push('النص العام مطلوب.');
  const w = Number(entry.weight);
  if (!Number.isFinite(w) || w <= 0) errors.push('الوزن يجب أن يكون أكبر من صفر.');
  const badTags = (entry.tags || []).filter((t) => !POOL_TAG_IDS.includes(t));
  if (badTags.length) errors.push(`وسوم لا يعرفها التطبيق: ${badTags.join('، ')}`);

  const missing = placeholdersIn([entry.text, entry.text_male, entry.text_female].join(' '))
    .filter((p) => !SUPPLIED_PLACEHOLDERS.includes(p));
  if (missing.length) {
    warnings.push(`المتغيرات {${missing.join('}، {')}} لا يمررها التطبيق بعد، فيتخطّى هذا النص ما دامت فيه.`);
  }
  return { errors, warnings };
}

/** Every entry's problems, keyed `${pool}:${index}`, plus totals. */
export function validatePools(pools) {
  const byEntry = {};
  let errors = 0;
  let warnings = 0;
  for (const name of POOL_NAMES) {
    (pools[name] || []).forEach((entry, i) => {
      const r = checkEntry(entry);
      if (r.errors.length || r.warnings.length) byEntry[`${name}:${i}`] = r;
      errors += r.errors.length;
      warnings += r.warnings.length;
    });
  }
  return { byEntry, errors, warnings };
}

/**
 * Editor state → the `pools` map the app reads. Blank gendered forms are left
 * out (the app falls back to `text`); text is trimmed. Unknown pools from the
 * live document are carried over as they were.
 */
export function serializePools(pools, unknown = {}) {
  const out = { ...unknown };
  for (const name of POOL_NAMES) {
    out[name] = {
      strings: (pools[name] || []).map((e) => {
        const s = { text: e.text.trim(), weight: Number(e.weight), tags: [...(e.tags || [])] };
        if (e.text_male?.trim())   s.text_male   = e.text_male.trim();
        if (e.text_female?.trim()) s.text_female = e.text_female.trim();
        return s;
      }),
    };
  }
  return out;
}
