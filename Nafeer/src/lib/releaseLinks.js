// ─── Only links that resolve ──────────────────────────────────────────────────
// Basheer's database refuses a link to something it does not have, and one bad
// link rejects a whole subject (concepts, tags, lessons, sections and questions
// are foreign keys there). So a release carries a link only when its target is
// in the same release. What cannot do without its target waits for it:
//   a feed card for its concept, a lesson for its unit, a checkpoint question
//   for its section.
//
// A document that had a link taken out gets a different version token, so it is
// sent again, link and all, by the release that first includes the target.
//
// Pure. Takes and returns database documents.

import { questionGoesToApp } from '@/lib/appExport';

const ids = (docs) => new Set(docs.map((d) => d.contentId));
const stamp = (d) => new Date(d.updatedAt || d.createdAt || 0).toISOString();

// `doc` with each named link field cut to the targets that exist. What was cut is
// recorded in `report` under `kind` and `label`.
function trim(doc, links, report, kind, label) {
  const changes = {};
  const dropped = [];
  for (const [field, targets] of Object.entries(links)) {
    const value = doc[field];
    if (Array.isArray(value)) {
      const kept = value.filter((id) => targets.has(id));
      if (kept.length === value.length) continue;
      changes[field] = kept;
      dropped.push(...value.filter((id) => !targets.has(id)));
    } else if (value && !targets.has(value)) {
      changes[field] = null;
      dropped.push(value);
    }
  }
  if (!dropped.length) return doc;
  report.push({ kind, id: doc.contentId, label, missing: dropped });
  return { ...doc, ...changes, updatedAt: `${stamp(doc)}|-${dropped.join(',')}` };
}

export function closeReferences({
  units = [], lessons = [], sections = [], blocks = [], concepts = [], tags = [],
  questions = [], exams = [], feedItems = [],
}) {
  const unitIds = ids(units);
  const tagIds = ids(tags);
  const conceptIds = ids(concepts);
  const omitted = [];
  const short = (text) => String(text || '').slice(0, 60);
  const holdBack = (kind, doc, label, missing) => omitted.push({ kind, id: doc.contentId, label, missing: [missing], held: true });

  const keptLessons = lessons.filter((l) => unitIds.has(l.unitContentId));
  lessons.filter((l) => !unitIds.has(l.unitContentId)).forEach((l) => holdBack('lesson', l, l.title, l.unitContentId));
  const lessonIds = ids(keptLessons);
  const keptSections = sections
    .filter((s) => lessonIds.has(s.lessonContentId))
    .map((s) => trim(s, { conceptIds }, omitted, 'section', s.title));
  const sectionIds = ids(keptSections);
  const sectionTitle = new Map(keptSections.map((s) => [s.contentId, s.title]));

  const keptQuestions = questions
    // A checkpoint ships unapproved only as part of its section.
    .filter((q) => !q.isCheckpoint || !q.sectionContentId || sectionIds.has(q.sectionContentId))
    .map((q) => trim(q, {
      conceptIds, unitContentId: unitIds, lessonContentId: lessonIds, sectionContentId: sectionIds,
    }, omitted, 'question', short(q.textAr)));
  const questionIds = ids(keptQuestions.filter(
    (q) => (q.status === 'approved' || q.isCheckpoint) && questionGoesToApp(q),
  ));

  feedItems.filter((f) => !conceptIds.has(f.conceptContentId))
    .forEach((f) => holdBack('feedItem', f, short(f.contentAr), f.conceptContentId));

  return {
    units,
    tags,
    lessons: keptLessons,
    sections: keptSections,
    blocks: blocks.filter((b) => sectionIds.has(b.sectionContentId))
      .map((b) => trim(b, { conceptRef: conceptIds }, omitted, 'block', sectionTitle.get(b.sectionContentId))),
    concepts: concepts.map((c) => trim(c, { tagIds }, omitted, 'concept', c.titleAr)),
    questions: keptQuestions,
    exams: exams.map((e) => trim(e, { questionContentIds: questionIds }, omitted, 'exam', e.titleAr)),
    feedItems: feedItems.filter((f) => conceptIds.has(f.conceptContentId)),
    omitted,
  };
}
