import { Concept } from '@/lib/models/Concept';
import { Lesson } from '@/lib/models/Lesson';

// ─── What a release leaves out, in words ──────────────────────────────────────
// closeReferences (lib/releaseLinks.js) drops links to what is not in the
// release. This says which, for the person publishing: a warning, never a
// refusal.

const MAX_LISTED = 100;

const KIND = {
  feedItem: 'بطاقة', lesson: 'درس', section: 'قسم', block: 'عنصر في قسم',
  concept: 'مفهوم', question: 'سؤال', exam: 'امتحان',
};

/** [{ what, reason, held }] for the first hundred; `held` = not sent at all. */
export async function describeOmissions(omitted = []) {
  const listed = omitted.slice(0, MAX_LISTED);
  const missing = [...new Set(listed.flatMap((o) => o.missing))];
  if (!missing.length) return [];

  const [concepts, lessons] = await Promise.all([
    Concept.find({ contentId: { $in: missing } }).select('contentId titleAr').lean(),
    Lesson.find({ contentId: { $in: missing } }).select('contentId title').lean(),
  ]);
  const names = new Map([
    ...concepts.map((c) => [c.contentId, `مفهوم «${c.titleAr}»`]),
    ...lessons.map((l) => [l.contentId, `درس «${l.title}»`]),
  ]);

  return listed.map((o) => {
    const targets = [...new Set(o.missing.map((id) => names.get(id) || id))].join('، ');
    return {
      what: `${KIND[o.kind] || o.kind}: ${o.label}`,
      held: !!o.held,
      reason: o.held ? `لن يصل التطبيق — ينقصه ${targets}` : `يصل دون ربطه بـ ${targets}`,
    };
  });
}
